import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Plus,
  Search,
  X,
  Send,
  TrendingUp,
  Users,
  Filter,
} from 'lucide-react';
import apiService from '../services/apiService';

interface Post {
  _id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  likedBy: string[];
  replyCount: number;
  isFeatured: boolean;
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

interface CommunityViewProps {
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🌟' },
  { id: 'general', label: 'General', emoji: '💬' },
  { id: 'motor-skills', label: 'Motor', emoji: '🏃' },
  { id: 'language', label: 'Language', emoji: '🗣️' },
  { id: 'cognitive', label: 'Cognitive', emoji: '🧠' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'sleep', label: 'Sleep', emoji: '😴' },
  { id: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { id: 'milestones', label: 'Milestones', emoji: '🎯' },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function initialsColor(name: string): string {
  const colors = [
    'from-emerald-400 to-teal-500',
    'from-purple-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-rose-400 to-red-500',
    'from-cyan-400 to-sky-500',
  ];
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const CommunityView: React.FC<CommunityViewProps> = ({ onBack }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);

  // Create post modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [creating, setCreating] = useState(false);

  // Post detail
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort: sortBy };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const result = await apiService.getCommunityPosts(params);
      const res = (result as any).data;
      if (res?.posts) setPosts(res.posts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    apiService.getCommunityTopics().then((result) => {
      const res = (result as any).data;
      if (res?.popularTopics) setTrendingTopics(res.popularTopics);
    }).catch(() => {});
  }, []);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    try {
      const result = await apiService.createCommunityPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      const res = (result as any).data;
      if (res?.post) {
        setPosts((prev) => [res.post, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        setNewCategory('general');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await apiService.togglePostLike(postId);
      const res = (result as any).data;
      if (res?.post) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? res.post : p)));
        if (selectedPost?._id === postId) setSelectedPost(res.post);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const openPost = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const result = await apiService.getCommunityPost(post._id);
      const res = (result as any).data;
      if (res?.comments) setComments(res.comments);
      if (res?.post) setSelectedPost(res.post);
    } catch (err) {
      console.error('Failed to load post:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    setSubmittingComment(true);
    try {
      const result = await apiService.addComment(selectedPost._id, commentText.trim());
      const res = (result as any).data;
      if (res?.comment) {
        setComments((prev) => [...prev, res.comment]);
        setCommentText('');
        setPosts((prev) =>
          prev.map((p) =>
            p._id === selectedPost._id
              ? { ...p, replyCount: p.replyCount + 1 }
              : p
          )
        );
        setSelectedPost((prev) =>
          prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev
        );
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getCategoryEmoji = (cat: string) =>
    CATEGORIES.find((c) => c.id === cat)?.emoji || '💬';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-500" />
              Community
            </h1>
            <p className="text-sm text-gray-500">Connect with other parents</p>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Sort Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSortBy('recent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'recent'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'popular'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Popular
          </button>
        </div>

        {/* Trending Topics */}
        {trendingTopics.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Trending
            </p>
            <div className="flex gap-2 flex-wrap">
              {trendingTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setSearchQuery(topic);
                    setShowSearch(true);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full text-xs font-medium hover:from-indigo-100 hover:to-purple-100 transition-all"
                >
                  #{topic.replace(/\s+/g, '')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
              <Users className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-500 text-sm">Loading community posts...</p>
          </div>
        )}

        {/* Posts List */}
        {!loading && (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openPost(post)}
                  className="bg-white rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-all border border-gray-100"
                >
                  {/* Author Row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${initialsColor(
                        post.authorName
                      )} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {getInitials(post.authorName)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {post.authorName}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                      {getCategoryEmoji(post.category)} {post.category}
                    </span>
                  </div>

                  {/* Title & Content */}
                  <h3 className="font-bold text-gray-900 mb-1">{post.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {post.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                    <button
                      onClick={(e) => handleLike(post._id, e)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        post.likedBy?.length > 0
                          ? 'text-rose-500'
                          : 'text-gray-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={post.likedBy?.length > 0 ? 'currentColor' : 'none'}
                      />
                      <span>{post.likes}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.replyCount}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {posts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Be the first to start a conversation!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  Create Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">New Post</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Title */}
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Post title"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium mb-4"
              />

              {/* Content */}
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your thoughts, questions, or experiences..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none mb-4"
                rows={5}
              />

              {/* Category */}
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Category
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setNewCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      newCategory === cat.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {/* Submit */}
              <button
                onClick={handleCreatePost}
                disabled={!newTitle.trim() || !newContent.trim() || creating}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  !newTitle.trim() || !newContent.trim() || creating
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg'
                }`}
              >
                {creating ? 'Posting...' : 'Post'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
            onClick={() => {
              setSelectedPost(null);
              setComments([]);
              setCommentText('');
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] flex flex-col"
            >
              {/* Post Header */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${initialsColor(
                        selectedPost.authorName
                      )} flex items-center justify-center text-white text-sm font-bold`}
                    >
                      {getInitials(selectedPost.authorName)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {selectedPost.authorName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeAgo(selectedPost.createdAt)} · {getCategoryEmoji(selectedPost.category)}{' '}
                        {selectedPost.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPost(null);
                      setComments([]);
                      setCommentText('');
                    }}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {selectedPost.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedPost.content}
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={(e) => handleLike(selectedPost._id, e)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      selectedPost.likedBy?.length > 0
                        ? 'text-rose-500'
                        : 'text-gray-400 hover:text-rose-500'
                    }`}
                  >
                    <Heart
                      className="w-4 h-4"
                      fill={selectedPost.likedBy?.length > 0 ? 'currentColor' : 'none'}
                    />
                    <span>{selectedPost.likes} likes</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>{selectedPost.replyCount} replies</span>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingComments ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Loading comments...
                  </p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No comments yet. Be the first!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${initialsColor(
                          comment.authorName
                        )} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                      >
                        {getInitials(comment.authorName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            {comment.authorName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {timeAgo(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      !commentText.trim() || submittingComment
                        ? 'bg-gray-200 text-gray-400'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityView;
