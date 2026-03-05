import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';


class CommunityHubScreen extends StatefulWidget {
  const CommunityHubScreen({super.key});

  @override
  State<CommunityHubScreen> createState() => _CommunityHubScreenState();
}

class _CommunityHubScreenState extends State<CommunityHubScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _posts = [];
  List<Map<String, dynamic>> _filteredPosts = [];
  Map<String, dynamic>? _featuredPost;
  List<String> _trendingTopics = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _filterPosts();
  }

  void _filterPosts() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredPosts = List.from(_posts);
      } else {
        _filteredPosts = _posts.where((post) {
          final title = (post['title'] ?? '').toString().toLowerCase();
          final content = (post['content'] ?? '').toString().toLowerCase();
          return title.contains(query) || content.contains(query);
        }).toList();
      }
    });
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    final results = await Future.wait([
      _api.getCommunityPosts(limit: 50),
      _api.getCommunityTopics(),
    ]);

    final postsResult = results[0];
    final topicsResult = results[1];

    if (postsResult['success'] == true) {
      final allPosts = List<Map<String, dynamic>>.from(
        postsResult['data']?['posts'] ?? [],
      );

      // Find featured post
      final featured = allPosts.where((p) => p['isFeatured'] == true).toList();
      setState(() {
        _featuredPost = featured.isNotEmpty ? featured.first : (allPosts.isNotEmpty ? allPosts.first : null);
        _posts = allPosts;
        _filteredPosts = List.from(allPosts);
      });
    }

    if (topicsResult['success'] == true) {
      final topics = List<String>.from(
        topicsResult['data']?['popularTopics'] ?? [],
      );
      setState(() => _trendingTopics = topics);
    }

    setState(() => _isLoading = false);
  }

  Future<void> _toggleLike(String postId) async {
    final result = await _api.toggleCommunityPostLike(postId);
    if (result['success'] == true) {
      final updatedPost = Map<String, dynamic>.from(result['data']?['post'] ?? {});
      setState(() {
        for (int i = 0; i < _posts.length; i++) {
          if (_posts[i]['_id'] == postId) {
            _posts[i] = updatedPost;
            break;
          }
        }
        for (int i = 0; i < _filteredPosts.length; i++) {
          if (_filteredPosts[i]['_id'] == postId) {
            _filteredPosts[i] = updatedPost;
            break;
          }
        }
        if (_featuredPost != null && _featuredPost!['_id'] == postId) {
          _featuredPost = updatedPost;
        }
      });
    }
  }

  void _showCreatePostSheet() {
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    String selectedCategory = 'general';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) {
          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle bar
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppTheme.neutral300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'New Discussion',
                    style: TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: titleController,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Discussion title...',
                      hintStyle: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 15,
                        color: AppTheme.textTertiary,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF3F4F6),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: contentController,
                    maxLines: 4,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      color: AppTheme.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Share your thoughts, questions, or experiences...',
                      hintStyle: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        color: AppTheme.textTertiary,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF3F4F6),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Category',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildCategoryChip('General', 'general', selectedCategory, (val) {
                        setSheetState(() => selectedCategory = val);
                      }),
                      _buildCategoryChip('Motor Skills', 'motor-skills', selectedCategory, (val) {
                        setSheetState(() => selectedCategory = val);
                      }),
                      _buildCategoryChip('Language', 'language', selectedCategory, (val) {
                        setSheetState(() => selectedCategory = val);
                      }),
                      _buildCategoryChip('Sleep', 'sleep', selectedCategory, (val) {
                        setSheetState(() => selectedCategory = val);
                      }),
                      _buildCategoryChip('Nutrition', 'nutrition', selectedCategory, (val) {
                        setSheetState(() => selectedCategory = val);
                      }),
                      _buildCategoryChip('Cognitive', 'cognitive', selectedCategory, (val) {
                        setSheetState(() => selectedCategory = val);
                      }),
                      _buildCategoryChip('Social', 'social', selectedCategory, (val) {
                        setSheetState(() => selectedCategory = val);
                      }),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (titleController.text.isEmpty || contentController.text.isEmpty) return;
                        final result = await _api.createCommunityPost(
                          title: titleController.text,
                          content: contentController.text,
                          category: selectedCategory,
                        );
                        if (result['success'] == true && mounted) {
                          Navigator.pop(context);
                          _loadData();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Post',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showPostDetail(Map<String, dynamic> post) {
    final commentController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) {
          return DraggableScrollableSheet(
            initialChildSize: 0.85,
            maxChildSize: 0.95,
            minChildSize: 0.5,
            builder: (context, scrollController) {
              return FutureBuilder<Map<String, dynamic>>(
                future: _api.getCommunityPost(post['_id']),
                builder: (context, snapshot) {
                  final comments = <Map<String, dynamic>>[];
                  if (snapshot.hasData && snapshot.data!['success'] == true) {
                    comments.addAll(List<Map<String, dynamic>>.from(
                      snapshot.data!['data']?['comments'] ?? [],
                    ));
                  }

                  return Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Column(
                      children: [
                        // Handle bar
                        Padding(
                          padding: const EdgeInsets.only(top: 12, bottom: 8),
                          child: Container(
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: AppTheme.neutral300,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        // Content
                        Expanded(
                          child: ListView(
                            controller: scrollController,
                            padding: const EdgeInsets.all(20),
                            children: [
                              // Category badge
                              if (post['category'] != null && post['category'] != 'general')
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: _buildCategoryBadge(post['category']),
                                ),
                              const SizedBox(height: 8),
                              // Title
                              Text(
                                post['title'] ?? '',
                                style: const TextStyle(
                                  fontFamily: 'Nunito',
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              // Author
                              Row(
                                children: [
                                  _buildAvatar(post['authorName'] ?? 'A', 28),
                                  const SizedBox(width: 8),
                                  Text(
                                    post['authorName'] ?? 'Anonymous',
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    '  \u2022  ${_formatTime(post['createdAt'])}',
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 13,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              // Full content
                              Text(
                                post['content'] ?? '',
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 14,
                                  height: 1.6,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              const Divider(color: AppTheme.borderLight),
                              const SizedBox(height: 12),
                              Text(
                                'Comments (${comments.length})',
                                style: const TextStyle(
                                  fontFamily: 'Nunito',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              if (snapshot.connectionState == ConnectionState.waiting)
                                const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(20),
                                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                                  ),
                                )
                              else if (comments.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 20),
                                  child: Center(
                                    child: Text(
                                      'No comments yet. Be the first to reply!',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize: 14,
                                        color: AppTheme.textSecondary,
                                      ),
                                    ),
                                  ),
                                )
                              else
                                ...comments.map((comment) => _buildCommentItem(comment)),
                            ],
                          ),
                        ),
                        // Comment input
                        Container(
                          padding: EdgeInsets.fromLTRB(
                            16, 12, 16,
                            MediaQuery.of(context).viewInsets.bottom + 16,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border(
                              top: BorderSide(color: AppTheme.borderLight, width: 1),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: commentController,
                                  style: const TextStyle(
                                    fontFamily: 'Inter',
                                    fontSize: 14,
                                    color: AppTheme.textPrimary,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: 'Write a comment...',
                                    hintStyle: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 14,
                                      color: AppTheme.textTertiary,
                                    ),
                                    filled: true,
                                    fillColor: const Color(0xFFF3F4F6),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(24),
                                      borderSide: BorderSide.none,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () async {
                                  if (commentController.text.isEmpty) return;
                                  final result = await _api.addCommunityComment(
                                    post['_id'],
                                    commentController.text,
                                  );
                                  if (result['success'] == true) {
                                    commentController.clear();
                                    setSheetState(() {});
                                    _loadData();
                                  }
                                },
                                child: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryGreen,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Icon(
                                    Icons.send_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildCategoryChip(String label, String value, String selected, ValueChanged<String> onTap) {
    final isSelected = value == selected;
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryGreen : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              onRefresh: _loadData,
              color: AppTheme.primaryGreen,
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                    )
                  : CustomScrollView(
                      slivers: [
                        // Header
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: () => Navigator.of(context).pop(),
                                  child: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppTheme.textPrimary),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Text(
                                    'Community',
                                    style: TextStyle(
                                      fontFamily: 'Nunito',
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                ),
                                // Avatar placeholder
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: AppTheme.greenTint,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.notifications_none_rounded,
                                    size: 18,
                                    color: AppTheme.primaryGreen,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Search bar
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(24),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.search_rounded, size: 20, color: AppTheme.textTertiary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextField(
                                      controller: _searchController,
                                      style: const TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize: 14,
                                        color: AppTheme.textPrimary,
                                      ),
                                      decoration: const InputDecoration(
                                        hintText: 'Search topics...',
                                        hintStyle: TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 14,
                                          color: AppTheme.textTertiary,
                                        ),
                                        border: InputBorder.none,
                                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0),
                        ),
                        // Featured discussion
                        if (_featuredPost != null)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                              child: _buildFeaturedCard(_featuredPost!),
                            ).animate().fadeIn(duration: 400.ms, delay: 100.ms).slideY(begin: 0.1, end: 0),
                          ),
                        // Trending section
                        if (_trendingTopics.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Trending',
                                    style: TextStyle(
                                      fontFamily: 'Nunito',
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    height: 36,
                                    child: ListView.separated(
                                      scrollDirection: Axis.horizontal,
                                      itemCount: _trendingTopics.length,
                                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                                      itemBuilder: (context, index) {
                                        return _buildTrendingPill(_trendingTopics[index], index);
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(duration: 400.ms, delay: 200.ms).slideY(begin: 0.1, end: 0),
                          ),
                        // Recent Discussions header
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                            child: const Text(
                              'Recent Discussions',
                              style: TextStyle(
                                fontFamily: 'Nunito',
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ),
                        ),
                        // Discussion cards
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final post = _filteredPosts[index];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: _buildDiscussionCard(post, index),
                                ).animate().fadeIn(
                                  duration: 350.ms,
                                  delay: Duration(milliseconds: 300 + (index * 80)),
                                ).slideY(begin: 0.1, end: 0);
                              },
                              childCount: _filteredPosts.length,
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
            // FAB
            Positioned(
              right: 20,
              bottom: 90,
              child: FloatingActionButton(
                onPressed: _showCreatePostSheet,
                backgroundColor: AppTheme.primaryGreen,
                elevation: 4,
                child: const Icon(Icons.add, color: Colors.white, size: 28),
              ).animate().scale(
                delay: 500.ms,
                duration: 300.ms,
                curve: Curves.elasticOut,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturedCard(Map<String, dynamic> post) {
    return GestureDetector(
      onTap: () => _showPostDetail(post),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Featured badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Featured',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Title
            Text(
              post['title'] ?? '',
              style: const TextStyle(
                fontFamily: 'Nunito',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            // Author row
            Row(
              children: [
                _buildAvatar(post['authorName'] ?? 'A', 28),
                const SizedBox(width: 8),
                Text(
                  post['authorName'] ?? 'Anonymous',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  '  \u2022  ${_formatTime(post['createdAt'])}',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Engagement row
            Row(
              children: [
                Icon(Icons.chat_bubble_outline_rounded, size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${post['replyCount'] ?? 0} replies',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(width: 16),
                GestureDetector(
                  onTap: () => _toggleLike(post['_id']),
                  child: Row(
                    children: [
                      Icon(
                        _isLikedByUser(post) ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        size: 16,
                        color: _isLikedByUser(post) ? AppTheme.secondaryPink : AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post['likes'] ?? 0} likes',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendingPill(String topic, int index) {
    final colors = [
      [const Color(0xFFDCFCE7), const Color(0xFF16A34A)],
      [const Color(0xFFDBEAFE), const Color(0xFF2563EB)],
      [const Color(0xFFFCE7F3), const Color(0xFFDB2777)],
      [const Color(0xFFFEF3C7), const Color(0xFFD97706)],
      [const Color(0xFFEDE9FE), const Color(0xFF7C3AED)],
      [const Color(0xFFE0F2FE), const Color(0xFF0284C7)],
    ];
    final colorPair = colors[index % colors.length];

    return GestureDetector(
      onTap: () {
        _searchController.text = topic;
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: colorPair[0],
          borderRadius: BorderRadius.circular(24),
        ),
        child: Text(
          topic,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: colorPair[1],
          ),
        ),
      ),
    );
  }

  Widget _buildDiscussionCard(Map<String, dynamic> post, int index) {
    return GestureDetector(
      onTap: () => _showPostDetail(post),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author row
            Row(
              children: [
                _buildAvatar(post['authorName'] ?? 'A', 36),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post['authorName'] ?? 'Anonymous',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        _formatTime(post['createdAt']),
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Title
            Text(
              post['title'] ?? '',
              style: const TextStyle(
                fontFamily: 'Nunito',
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            // Preview text
            Text(
              post['content'] ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 14,
                color: AppTheme.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            // Bottom row
            Row(
              children: [
                GestureDetector(
                  onTap: () => _toggleLike(post['_id']),
                  child: Row(
                    children: [
                      Icon(
                        _isLikedByUser(post) ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        size: 16,
                        color: _isLikedByUser(post) ? AppTheme.secondaryPink : AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post['likes'] ?? 0}',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Icon(Icons.chat_bubble_outline_rounded, size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${post['replyCount'] ?? 0}',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const Spacer(),
                if (post['category'] != null && post['category'] != 'general')
                  _buildCategoryBadge(post['category']),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryBadge(String category) {
    final categoryColors = <String, List<Color>>{
      'motor-skills': [const Color(0xFFDBEAFE), const Color(0xFF2563EB)],
      'language': [const Color(0xFFFCE7F3), const Color(0xFFDB2777)],
      'cognitive': [const Color(0xFFEDE9FE), const Color(0xFF7C3AED)],
      'social': [const Color(0xFFDCFCE7), const Color(0xFF16A34A)],
      'sleep': [const Color(0xFFE0F2FE), const Color(0xFF0284C7)],
      'nutrition': [const Color(0xFFFEF3C7), const Color(0xFFD97706)],
      'milestones': [const Color(0xFFFCE7F3), const Color(0xFFDB2777)],
    };
    final colors = categoryColors[category] ?? [const Color(0xFFF3F4F6), AppTheme.textSecondary];
    final label = category.replaceAll('-', ' ');
    final displayLabel = label[0].toUpperCase() + label.substring(1);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors[0],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        displayLabel,
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: colors[1],
        ),
      ),
    );
  }

  Widget _buildAvatar(String name, double size) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'A';
    final avatarColors = [
      AppTheme.primaryGreen,
      AppTheme.secondaryBlue,
      AppTheme.secondaryPurple,
      AppTheme.secondaryPink,
      AppTheme.secondaryOrange,
    ];
    final colorIndex = initial.codeUnitAt(0) % avatarColors.length;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: avatarColors[colorIndex].withOpacity(0.15),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: size * 0.42,
            fontWeight: FontWeight.w700,
            color: avatarColors[colorIndex],
          ),
        ),
      ),
    );
  }

  Widget _buildCommentItem(Map<String, dynamic> comment) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildAvatar(comment['authorName'] ?? 'A', 32),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      comment['authorName'] ?? 'Anonymous',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatTime(comment['createdAt']),
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment['content'] ?? '',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 14,
                    color: AppTheme.textPrimary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _isLikedByUser(Map<String, dynamic> post) {
    final likedBy = List<String>.from(post['likedBy'] ?? []);
    // The auth middleware uses a fixed guest user ID
    return likedBy.contains('000000000000000000000000');
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '';
    }
  }
}
