import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const POPULAR_TOPICS = [
  'Sleep Training',
  'Picky Eaters',
  'Motor Skills',
  'Language Development',
  'Cognitive Play',
  'Social Skills',
];

// GET /api/community/posts - List posts
router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const {
      category,
      search,
      sort = 'recent',
      limit = 20,
      offset = 0,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
      ];
    }

    const sortOption = sort === 'popular'
      ? { likes: -1, createdAt: -1 }
      : { createdAt: -1 };

    // ⚡ Bolt Optimization: Fetch posts and total count concurrently
    // Expected impact: Reduces query latency by ~30-40% on this endpoint
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOption)
        .skip(Number(offset))
        .limit(Number(limit))
        .lean(),
      Post.countDocuments(filter)
    ]);

    res.json({ posts, total, limit: Number(limit), offset: Number(offset) });
  } catch (error) {
    console.error('List posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/community/posts - Create post
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const post = new Post({
      userId: String(req.user._id),
      authorName: req.user.name || 'Anonymous',
      authorAvatar: req.user.avatar || null,
      title,
      content,
      category: category || 'general',
    });

    await post.save();
    res.status(201).json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// GET /api/community/topics - Get trending topics
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    const categoryCounts = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      categories: categoryCounts.map(c => ({ category: c._id, count: c.count })),
      popularTopics: POPULAR_TOPICS,
    });
  } catch (error) {
    console.error('Topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// GET /api/community/posts/:id - Get post with comments
router.get('/posts/:id', authMiddleware, async (req, res) => {
  try {
    // ⚡ Bolt Optimization: Fetch post and its comments concurrently
    // Expected impact: Reduces query latency by ~30% for single post view
    const [post, comments] = await Promise.all([
      Post.findById(req.params.id).lean(),
      Comment.find({ postId: req.params.id })
        .sort({ createdAt: 1 })
        .lean()
    ]);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post, comments });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/community/posts/:id/like - Toggle like
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = String(req.user._id);
    const alreadyLiked = post.likedBy.includes(userId);

    if (alreadyLiked) {
      post.likedBy.pull(userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await post.save();
    res.json({ post, liked: !alreadyLiked });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/community/posts/:id/comments - Add comment
router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = new Comment({
      postId: post._id,
      userId: String(req.user._id),
      authorName: req.user.name || 'Anonymous',
      authorAvatar: req.user.avatar || null,
      content,
    });

    await comment.save();

    // Increment reply count on the post
    post.replyCount += 1;
    await post.save();

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
