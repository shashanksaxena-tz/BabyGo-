import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/gemini_service.dart';
import '../../services/who_data_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

class RecommendationsScreen extends StatefulWidget {
  const RecommendationsScreen({super.key});

  @override
  State<RecommendationsScreen> createState() => _RecommendationsScreenState();
}

class _RecommendationsScreenState extends State<RecommendationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  ChildProfile? _child;
  bool _isLoading = true;

  // Data
  List<ProductRecommendation> _products = [];
  List<Activity> _activities = [];
  List<ParentingTip> _tips = [];
  bool _isLoadingProducts = false;
  bool _isLoadingActivities = false;
  bool _isLoadingTips = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();

    setState(() {
      _child = child;
      _isLoading = false;
    });

    if (child != null) {
      _loadProducts();
      _loadActivities();
      _loadTips();
    }
  }

  Future<void> _loadProducts() async {
    if (_child == null) return;
    setState(() => _isLoadingProducts = true);

    try {
      final gemini = GeminiService();
      final storage = StorageService();
      final apiKey = storage.getApiKey();

      if (apiKey != null && !gemini.isInitialized) {
        await gemini.initialize(apiKey);
      }

      final products = await gemini.generateProductRecommendations(
        child: _child!,
        categories: ['toys', 'books', 'educational', 'safety'],
      );

      if (mounted) {
        setState(() {
          _products = products;
          _isLoadingProducts = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingProducts = false);
    }
  }

  Future<void> _loadActivities() async {
    if (_child == null) return;
    setState(() => _isLoadingActivities = true);

    try {
      final gemini = GeminiService();
      final storage = StorageService();
      final apiKey = storage.getApiKey();

      if (apiKey != null && !gemini.isInitialized) {
        await gemini.initialize(apiKey);
      }

      final activities = await gemini.generateActivityRecommendations(
        child: _child!,
      );

      if (mounted) {
        setState(() {
          _activities = activities;
          _isLoadingActivities = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingActivities = false);
    }
  }

  Future<void> _loadTips() async {
    if (_child == null) return;
    setState(() => _isLoadingTips = true);

    try {
      final gemini = GeminiService();
      final storage = StorageService();
      final apiKey = storage.getApiKey();

      if (apiKey != null && !gemini.isInitialized) {
        await gemini.initialize(apiKey);
      }

      final tips = await gemini.generateParentingTips(child: _child!);

      if (mounted) {
        setState(() {
          _tips = tips;
          _isLoadingTips = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingTips = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      );
    }

    return Container(
      decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
      child: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildTabBar(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildProductsTab(),
                  _buildActivitiesTab(),
                  _buildTipsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_rounded),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Recommendations',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.neutral900,
                  ),
                ),
                Text(
                  'Personalized for ${_child?.displayName ?? "your child"}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.secondaryPurple.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text('✨', style: TextStyle(fontSize: 24)),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppTheme.neutral100,
        borderRadius: BorderRadius.circular(16),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: AppTheme.softShadow,
        ),
        labelColor: AppTheme.primaryGreen,
        unselectedLabelColor: AppTheme.neutral500,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        dividerColor: Colors.transparent,
        tabs: const [
          Tab(text: '🛍️ Products'),
          Tab(text: '🎯 Activities'),
          Tab(text: '💡 Tips'),
        ],
      ),
    );
  }

  Widget _buildProductsTab() {
    if (_isLoadingProducts) {
      return _buildLoadingState('Finding perfect products...');
    }

    if (_products.isEmpty) {
      return _buildEmptyState('🛍️', 'No products yet', _loadProducts);
    }

    return RefreshIndicator(
      onRefresh: _loadProducts,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _products.length,
        itemBuilder: (context, index) {
          return StaggeredListAnimation(
            index: index,
            child: _buildProductCard(_products[index]),
          );
        },
      ),
    );
  }

  Widget _buildProductCard(ProductRecommendation product) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: _getCategoryColor(product.category).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                product.emoji,
                style: const TextStyle(fontSize: 36),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.neutral800,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _buildCategoryChip(product.category),
                    const SizedBox(width: 8),
                    Text(
                      product.ageRange,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.neutral500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  product.description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.neutral600,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    // Benefits
                    ...product.developmentAreas.take(2).map((area) => Container(
                          margin: const EdgeInsets.only(right: 6),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            area,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        )),
                    const Spacer(),
                    if (product.affiliateUrl != null)
                      TextButton.icon(
                        onPressed: () => _openUrl(product.affiliateUrl!),
                        icon: const Icon(Icons.open_in_new_rounded, size: 16),
                        label: const Text('View'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.secondaryBlue,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivitiesTab() {
    if (_isLoadingActivities) {
      return _buildLoadingState('Creating fun activities...');
    }

    if (_activities.isEmpty) {
      return _buildEmptyState('🎯', 'No activities yet', _loadActivities);
    }

    return RefreshIndicator(
      onRefresh: _loadActivities,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _activities.length,
        itemBuilder: (context, index) {
          return StaggeredListAnimation(
            index: index,
            child: _buildActivityCard(_activities[index]),
          );
        },
      ),
    );
  }

  Widget _buildActivityCard(Activity activity) {
    final domainColor = _getDomainColor(activity.domain);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  domainColor.withOpacity(0.15),
                  domainColor.withOpacity(0.05),
                ],
              ),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(activity.emoji, style: const TextStyle(fontSize: 28)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activity.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.neutral900,
                        ),
                      ),
                      Row(
                        children: [
                          _buildDomainChip(activity.domain, domainColor),
                          const SizedBox(width: 8),
                          Icon(Icons.timer_outlined,
                              size: 14, color: AppTheme.neutral500),
                          const SizedBox(width: 2),
                          Text(
                            activity.duration,
                            style: const TextStyle(
                                fontSize: 12, color: AppTheme.neutral500),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral600,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                // Materials needed
                if (activity.materials.isNotEmpty) ...[
                  const Text(
                    'Materials:',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neutral700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: activity.materials
                        .map((m) => Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.neutral100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                m,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.neutral600,
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                ],
                const SizedBox(height: 12),
                // Skills
                const Text(
                  'Skills developed:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.neutral700,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: activity.skills
                      .map((s) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: domainColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              s,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: domainColor,
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTipsTab() {
    if (_isLoadingTips) {
      return _buildLoadingState('Gathering expert tips...');
    }

    if (_tips.isEmpty) {
      return _buildEmptyState('💡', 'No tips yet', _loadTips);
    }

    return RefreshIndicator(
      onRefresh: _loadTips,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tips.length,
        itemBuilder: (context, index) {
          return StaggeredListAnimation(
            index: index,
            child: _buildTipCard(_tips[index]),
          );
        },
      ),
    );
  }

  Widget _buildTipCard(ParentingTip tip) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.accentOrange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(tip.emoji, style: const TextStyle(fontSize: 24)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tip.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.neutral900,
                      ),
                    ),
                    Text(
                      tip.category,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppTheme.neutral500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            tip.content,
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.neutral700,
              height: 1.6,
            ),
          ),
          if (tip.source != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.verified_rounded,
                    size: 14, color: AppTheme.primaryGreen),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Source: ${tip.source}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.neutral500,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLoadingState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppTheme.primaryGreen),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppTheme.neutral600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String emoji, String message, VoidCallback onRetry) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Load Recommendations'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String category) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _getCategoryColor(category).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        category,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: _getCategoryColor(category),
        ),
      ),
    );
  }

  Widget _buildDomainChip(String domain, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        domain,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'toys':
        return AppTheme.secondaryPink;
      case 'books':
        return AppTheme.secondaryBlue;
      case 'educational':
        return AppTheme.primaryGreen;
      case 'safety':
        return AppTheme.accentOrange;
      default:
        return AppTheme.neutral500;
    }
  }

  Color _getDomainColor(String domain) {
    switch (domain.toLowerCase()) {
      case 'motor':
        return AppTheme.motorColor;
      case 'language':
        return AppTheme.languageColor;
      case 'cognitive':
        return AppTheme.cognitiveColor;
      case 'social':
        return AppTheme.socialColor;
      default:
        return AppTheme.primaryGreen;
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

/// Activity model
class Activity {
  final String name;
  final String emoji;
  final String domain;
  final String description;
  final String duration;
  final List<String> materials;
  final List<String> skills;
  final List<String> steps;

  const Activity({
    required this.name,
    required this.emoji,
    required this.domain,
    required this.description,
    required this.duration,
    this.materials = const [],
    this.skills = const [],
    this.steps = const [],
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      name: json['name'] ?? '',
      emoji: json['emoji'] ?? '🎯',
      domain: json['domain'] ?? 'General',
      description: json['description'] ?? '',
      duration: json['duration'] ?? '10-15 min',
      materials: List<String>.from(json['materials'] ?? []),
      skills: List<String>.from(json['skills'] ?? []),
      steps: List<String>.from(json['steps'] ?? []),
    );
  }
}

/// Parenting tip model
class ParentingTip {
  final String title;
  final String emoji;
  final String category;
  final String content;
  final String? source;

  const ParentingTip({
    required this.title,
    required this.emoji,
    required this.category,
    required this.content,
    this.source,
  });

  factory ParentingTip.fromJson(Map<String, dynamic> json) {
    return ParentingTip(
      title: json['title'] ?? '',
      emoji: json['emoji'] ?? '💡',
      category: json['category'] ?? 'General',
      content: json['content'] ?? '',
      source: json['source'],
    );
  }
}
