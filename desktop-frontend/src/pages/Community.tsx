import { useState, useEffect, useCallback, useRef } from 'react';
import TopBar from '../components/TopBar';
import {
    Search,
    Heart,
    MessageSquare,
    Plus,
    ShieldCheck,
    X,
    Send,
    TrendingUp,
    Clock,
    Loader2,
    AlertCircle,
    ChevronDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

// --- Types ---

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

// --- Constants ---

const CATEGORIES = [
    { id: 'all', label: 'All Topics', emoji: '' },
    { id: 'general', label: 'General', emoji: '' },
    { id: 'motor-skills', label: 'Motor Skills', emoji: '' },
    { id: 'language', label: 'Language', emoji: '' },
    { id: 'cognitive', label: 'Cognitive', emoji: '' },
    { id: 'social', label: 'Social', emoji: '' },
    { id: 'sleep', label: 'Sleep', emoji: '' },
    { id: 'nutrition', label: 'Nutrition', emoji: '' },
    { id: 'milestones', label: 'Milestones', emoji: '' },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; avatarBg: string; avatarText: string }> = {
    'general': { bg: 'bg-gray-50', text: 'text-gray-600', avatarBg: 'bg-gray-100', avatarText: 'text-gray-600' },
    'motor-skills': { bg: 'bg-blue-50', text: 'text-blue-600', avatarBg: 'bg-blue-100', avatarText: 'text-blue-600' },
    'language': { bg: 'bg-pink-50', text: 'text-pink-600', avatarBg: 'bg-pink-100', avatarText: 'text-pink-600' },
    'cognitive': { bg: 'bg-purple-50', text: 'text-purple-600', avatarBg: 'bg-purple-100', avatarText: 'text-purple-600' },
    'social': { bg: 'bg-emerald-50', text: 'text-emerald-600', avatarBg: 'bg-emerald-100', avatarText: 'text-emerald-600' },
    'sleep': { bg: 'bg-indigo-50', text: 'text-indigo-600', avatarBg: 'bg-indigo-100', avatarText: 'text-indigo-600' },
    'nutrition': { bg: 'bg-amber-50', text: 'text-amber-600', avatarBg: 'bg-amber-100', avatarText: 'text-amber-600' },
    'milestones': { bg: 'bg-teal-50', text: 'text-teal-600', avatarBg: 'bg-teal-100', avatarText: 'text-teal-600' },
};

const TOPIC_COLORS = [
    'bg-emerald-50 text-emerald-600',
    'bg-amber-50 text-amber-600',
    'bg-blue-50 text-blue-600',
    'bg-pink-50 text-pink-600',
    'bg-purple-50 text-purple-600',
    'bg-teal-50 text-teal-600',
];

const PAGE_SIZE = 20;

// --- Helpers ---

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

function avatarColor(name: string): string {
    const colors = [
        'bg-pink-100 text-pink-600',
        'bg-blue-100 text-blue-600',
        'bg-purple-100 text-purple-600',
        'bg-emerald-100 text-emerald-600',
        'bg-amber-100 text-amber-600',
        'bg-cyan-100 text-cyan-600',
        'bg-rose-100 text-rose-600',
        'bg-indigo-100 text-indigo-600',
    ];
    let hash = 0;
    for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function getCategoryStyle(cat: string) {
    return CATEGORY_STYLES[cat] || CATEGORY_STYLES['general'];
}

function getCategoryLabel(cat: string) {
    return CATEGORIES.find((c) => c.id === cat)?.label || cat;
}

// --- Component ---

export default function Community() {
    const { user } = useAuth();

    // Posts state
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

    // Trending topics
    const [trendingTopics, setTrendingTopics] = useState<string[]>([]);

    // Create post modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('general');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Post detail modal
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // --- Debounce search ---
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400);
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [searchQuery]);

    // --- Fetch posts ---
    const fetchPosts = useCallback(async (resetOffset = true) => {
        if (resetOffset) {
            setLoading(true);
            setOffset(0);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const params: Record<string, string | number> = {
                sort: sortBy,
                limit: PAGE_SIZE,
                offset: resetOffset ? 0 : offset,
            };
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

            const response = await api.get('/community/posts', { params });
            const data = response.data;

            if (resetOffset) {
                setPosts(data.posts || []);
            } else {
                setPosts((prev) => [...prev, ...(data.posts || [])]);
            }
            setTotal(data.total || 0);
            if (!resetOffset) {
                setOffset((prev) => prev + PAGE_SIZE);
            } else {
                setOffset(PAGE_SIZE);
            }
        } catch (err: any) {
            console.error('Failed to load posts:', err);
            setError(err.response?.data?.error || 'Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [selectedCategory, debouncedSearch, sortBy, offset]);

    // Reload when filters change
    useEffect(() => {
        fetchPosts(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, debouncedSearch, sortBy]);

    // --- Fetch trending topics ---
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await api.get('/community/topics');
                if (response.data?.popularTopics) {
                    setTrendingTopics(response.data.popularTopics);
                }
            } catch {
                // silently fail - topics are non-critical
            }
        };
        fetchTopics();
    }, []);

    // --- Create post ---
    const handleCreatePost = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        setCreating(true);
        setCreateError(null);
        try {
            const response = await api.post('/community/posts', {
                title: newTitle.trim(),
                content: newContent.trim(),
                category: newCategory,
            });
            if (response.data?.post) {
                setPosts((prev) => [response.data.post, ...prev]);
                setTotal((prev) => prev + 1);
                setShowCreateModal(false);
                setNewTitle('');
                setNewContent('');
                setNewCategory('general');
            }
        } catch (err: any) {
            console.error('Failed to create post:', err);
            setCreateError(err.response?.data?.error || 'Failed to create post. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    // --- Like / unlike ---
    const handleLike = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await api.post(`/community/posts/${postId}/like`);
            const updatedPost = response.data?.post;
            if (updatedPost) {
                setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
                if (selectedPost?._id === postId) setSelectedPost(updatedPost);
            }
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    // --- Open post detail ---
    const openPost = async (post: Post) => {
        setSelectedPost(post);
        setComments([]);
        setCommentText('');
        setLoadingComments(true);
        try {
            const response = await api.get(`/community/posts/${post._id}`);
            if (response.data?.comments) setComments(response.data.comments);
            if (response.data?.post) setSelectedPost(response.data.post);
        } catch (err) {
            console.error('Failed to load post details:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const closePostDetail = () => {
        setSelectedPost(null);
        setComments([]);
        setCommentText('');
    };

    // --- Add comment ---
    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedPost) return;
        setSubmittingComment(true);
        try {
            const response = await api.post(`/community/posts/${selectedPost._id}/comments`, {
                content: commentText.trim(),
            });
            if (response.data?.comment) {
                setComments((prev) => [...prev, response.data.comment]);
                setCommentText('');
                // Update reply count in both the detail view and the list
                const updatedReplyCount = (selectedPost.replyCount || 0) + 1;
                setPosts((prev) =>
                    prev.map((p) =>
                        p._id === selectedPost._id
                            ? { ...p, replyCount: updatedReplyCount }
                            : p
                    )
                );
                setSelectedPost((prev) =>
                    prev ? { ...prev, replyCount: updatedReplyCount } : prev
                );
                // Scroll to bottom of comments
                setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    // --- Check if user liked a post ---
    const isLikedByUser = (post: Post) => {
        if (!user?.id) return false;
        return post.likedBy?.includes(user.id);
    };

    const hasMore = posts.length < total;

    // --- Featured post (first featured, or first post with most likes) ---
    const featuredPost = posts.find((p) => p.isFeatured) || (posts.length > 0 ? posts.reduce((a, b) => a.likes > b.likes ? a : b) : null);
    const regularPosts = posts.filter((p) => p._id !== featuredPost?._id);

    return (
        <>
            <TopBar title="Community" subtitle="Connect with other parents" />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-8">

                {/* Main Feed */}
                <div className="xl:w-3/4 flex flex-col gap-6">

                    {/* Search & Filters Bar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl p-4 flex items-center">
                            <Search className="w-5 h-5 text-gray-400 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search discussions, topics..."
                                className="bg-transparent border-none outline-none ml-3 text-base w-full text-gray-800 placeholder-gray-400 font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="ml-2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Sort Toggle */}
                        <div className="flex bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setSortBy('recent')}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition ${
                                    sortBy === 'recent'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Clock className="w-4 h-4" />
                                Recent
                            </button>
                            <button
                                onClick={() => setSortBy('popular')}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition ${
                                    sortBy === 'popular'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Popular
                            </button>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition hover:-translate-y-0.5 ${
                                    selectedCategory === cat.id
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4">
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                            <div className="flex-1">
                                <p className="text-red-800 font-semibold">Something went wrong</p>
                                <p className="text-red-600 text-sm mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => fetchPosts(true)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading community posts...</p>
                        </div>
                    )}

                    {/* Posts Feed */}
                    {!loading && !error && (
                        <>
                            {/* Featured Post */}
                            {featuredPost && posts.length > 0 && (
                                <div
                                    onClick={() => openPost(featuredPost)}
                                    className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 cursor-pointer hover:shadow-lg transition"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            {featuredPost.isFeatured && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm shadow-emerald-500/20">
                                                    Featured
                                                </span>
                                            )}
                                            <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-widest ${getCategoryStyle(featuredPost.category).bg} ${getCategoryStyle(featuredPost.category).text}`}>
                                                {getCategoryLabel(featuredPost.category)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleLike(featuredPost._id, e)}
                                            className={`flex items-center gap-1.5 font-semibold text-sm transition ${
                                                isLikedByUser(featuredPost) ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
                                            }`}
                                        >
                                            <Heart className="w-4 h-4" fill={isLikedByUser(featuredPost) ? 'currentColor' : 'none'} />
                                            {featuredPost.likes} likes
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold font-heading text-gray-900 leading-tight">{featuredPost.title}</h3>
                                    <p className="text-gray-600 text-sm font-medium leading-relaxed line-clamp-3">
                                        {featuredPost.content}
                                    </p>

                                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${avatarColor(featuredPost.authorName)}`}>
                                                {getInitials(featuredPost.authorName)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-800">{featuredPost.authorName}</span>
                                                <span className="text-xs text-gray-400 font-semibold">
                                                    {timeAgo(featuredPost.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-sm">
                                            <MessageSquare className="w-4 h-4" /> {featuredPost.replyCount} replies
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Regular Posts */}
                            {regularPosts.length > 0 && (
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-lg font-bold font-heading text-gray-900 px-1">
                                        {debouncedSearch
                                            ? `Search results for "${debouncedSearch}"`
                                            : selectedCategory !== 'all'
                                            ? `${getCategoryLabel(selectedCategory)} Discussions`
                                            : 'Recent Discussions'
                                        }
                                    </h3>

                                    {regularPosts.map((post) => (
                                        <div
                                            key={post._id}
                                            onClick={() => openPost(post)}
                                            className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-4 cursor-pointer hover:shadow-lg transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${avatarColor(post.authorName)}`}>
                                                    {getInitials(post.authorName)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800">{post.authorName}</span>
                                                    <span className="text-[11px] text-gray-400 font-semibold">{timeAgo(post.createdAt)}</span>
                                                </div>
                                                <span className={`ml-3 px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-widest ${getCategoryStyle(post.category).bg} ${getCategoryStyle(post.category).text}`}>
                                                    {getCategoryLabel(post.category)}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-1.5">{post.title}</h4>
                                                <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-2">{post.content}</p>
                                            </div>

                                            <div className="flex items-center gap-5 mt-1 pt-4 border-t border-gray-50 text-gray-400 font-semibold text-sm">
                                                <button
                                                    onClick={(e) => handleLike(post._id, e)}
                                                    className={`flex items-center gap-1.5 transition ${
                                                        isLikedByUser(post) ? 'text-pink-500' : 'hover:text-pink-500'
                                                    }`}
                                                >
                                                    <Heart className="w-4 h-4" fill={isLikedByUser(post) ? 'currentColor' : 'none'} />
                                                    {post.likes}
                                                </button>
                                                <span className="flex items-center gap-1.5">
                                                    <MessageSquare className="w-4 h-4" /> {post.replyCount} replies
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Load More */}
                            {hasMore && (
                                <div className="flex justify-center pt-2 pb-4">
                                    <button
                                        onClick={() => fetchPosts(false)}
                                        disabled={loadingMore}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-md transition disabled:opacity-50"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4" />
                                                Load More Posts
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Empty State */}
                            {posts.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                                        {debouncedSearch
                                            ? 'No posts found'
                                            : selectedCategory !== 'all'
                                            ? `No ${getCategoryLabel(selectedCategory)} posts yet`
                                            : 'No posts yet'
                                        }
                                    </h3>
                                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                        {debouncedSearch
                                            ? `No discussions matching "${debouncedSearch}". Try a different search term.`
                                            : 'Be the first to start a conversation and connect with other parents!'
                                        }
                                    </p>
                                    {!debouncedSearch && (
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                                        >
                                            Create First Post
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="xl:w-1/4 flex flex-col gap-6">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                    >
                        <Plus className="w-5 h-5" /> Start Discussion
                    </button>

                    {/* Trending Topics */}
                    {trendingTopics.length > 0 && (
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-4">
                            <h3 className="font-bold font-heading text-lg text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Trending Topics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {trendingTopics.map((topic, i) => (
                                    <button
                                        key={topic}
                                        onClick={() => {
                                            setSearchQuery(topic);
                                        }}
                                        className={`px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition hover:-translate-y-0.5 ${TOPIC_COLORS[i % TOPIC_COLORS.length]}`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Post Count Summary */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-5">
                        <h3 className="font-bold font-heading text-lg text-gray-900">Community Stats</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold font-heading text-emerald-500">{total}</span>
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Posts</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold font-heading text-emerald-500">
                                    {posts.reduce((sum, p) => sum + (p.replyCount || 0), 0)}
                                </span>
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Replies</span>
                            </div>
                        </div>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-emerald-50 rounded-[24px] p-6 border border-emerald-100/50 flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold font-heading text-gray-900">Community Guidelines</h3>
                        </div>
                        <p className="text-sm font-medium text-emerald-900/70 leading-relaxed mb-1">
                            Be respectful, share experiences, and support fellow parents on their journey.
                        </p>
                        <ul className="text-sm text-emerald-800/60 space-y-1.5 list-disc list-inside">
                            <li>Share your genuine experiences</li>
                            <li>Be kind and supportive</li>
                            <li>No medical advice - consult your pediatrician</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Create Post Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold font-heading text-gray-900">New Post</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateError(null);
                                }}
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {createError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-red-700 text-sm font-medium">{createError}</p>
                            </div>
                        )}

                        {/* Title */}
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Title</label>
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-base font-medium mb-4"
                        />

                        {/* Content */}
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Content</label>
                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Share your thoughts, questions, or experiences..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm resize-none mb-4"
                            rows={5}
                        />

                        {/* Category */}
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setNewCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        newCategory === cat.id
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleCreatePost}
                            disabled={!newTitle.trim() || !newContent.trim() || creating}
                            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
                                !newTitle.trim() || !newContent.trim() || creating
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                            }`}
                        >
                            {creating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Posting...
                                </span>
                            ) : (
                                'Create Post'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Post Detail Modal */}
            {selectedPost && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                    onClick={closePostDetail}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    >
                        {/* Post Header */}
                        <div className="p-8 pb-5 border-b border-gray-100 shrink-0">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base ${avatarColor(selectedPost.authorName)}`}>
                                        {getInitials(selectedPost.authorName)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{selectedPost.authorName}</p>
                                        <p className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                                            {timeAgo(selectedPost.createdAt)}
                                            <span className="text-gray-300">|</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCategoryStyle(selectedPost.category).bg} ${getCategoryStyle(selectedPost.category).text}`}>
                                                {getCategoryLabel(selectedPost.category)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closePostDetail}
                                    className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            <h2 className="text-xl font-bold font-heading text-gray-900 mb-3">
                                {selectedPost.title}
                            </h2>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {selectedPost.content}
                            </p>

                            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-50">
                                <button
                                    onClick={(e) => handleLike(selectedPost._id, e)}
                                    className={`flex items-center gap-1.5 text-sm font-semibold transition ${
                                        isLikedByUser(selectedPost) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'
                                    }`}
                                >
                                    <Heart
                                        className="w-4 h-4"
                                        fill={isLikedByUser(selectedPost) ? 'currentColor' : 'none'}
                                    />
                                    {selectedPost.likes} likes
                                </button>
                                <div className="flex items-center gap-1.5 text-sm text-gray-400 font-semibold">
                                    <MessageSquare className="w-4 h-4" />
                                    {selectedPost.replyCount} replies
                                </div>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-5 min-h-0">
                            {loadingComments ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                    <p className="ml-3 text-sm text-gray-400 font-medium">Loading comments...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 font-medium">
                                        No comments yet. Be the first to reply!
                                    </p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(comment.authorName)}`}>
                                            {getInitials(comment.authorName)}
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-md p-4">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <p className="text-sm font-bold text-gray-800">
                                                    {comment.authorName}
                                                </p>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {timeAgo(comment.createdAt)}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={commentsEndRef} />
                        </div>

                        {/* Comment Input */}
                        <div className="p-5 border-t border-gray-100 shrink-0">
                            <div className="flex gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(user?.name || 'You')}`}>
                                    {getInitials(user?.name || 'You')}
                                </div>
                                <div className="flex-1 flex gap-2">
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
                                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200 font-medium"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim() || submittingComment}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                            !commentText.trim() || submittingComment
                                                ? 'bg-gray-200 text-gray-400'
                                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                        }`}
                                    >
                                        {submittingComment ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
