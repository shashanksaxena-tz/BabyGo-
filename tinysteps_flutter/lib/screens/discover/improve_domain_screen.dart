import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

/// A reusable screen for browsing improvement resources for any developmental domain.
///
/// Works for Motor, Language, Cognitive, and Social domains. The screen adapts
/// its color scheme, icons, and tab labels based on the domain passed in.
class ImproveDomainScreen extends StatefulWidget {
  final String childId;
  final String domain; // 'motor', 'language', 'cognitive', 'social'
  final String domainTitle; // 'Motor Skills', 'Language', etc.
  final int score;
  final String status; // 'on_track', 'emerging', 'needs_support'
  final Color primaryColor;
  final Color gradientEnd;
  final IconData domainIcon;
  final String subtitle;

  const ImproveDomainScreen({
    super.key,
    required this.childId,
    required this.domain,
    required this.domainTitle,
    required this.score,
    required this.status,
    required this.primaryColor,
    required this.gradientEnd,
    this.domainIcon = Icons.psychology_rounded,
    this.subtitle = 'Improvement Resources',
  });

  /// Named constructors for each domain with pre-configured colors and icons.
  factory ImproveDomainScreen.motor({
    Key? key,
    required String childId,
    required int score,
    required String status,
  }) {
    return ImproveDomainScreen(
      key: key,
      childId: childId,
      domain: 'motor',
      domainTitle: 'Motor Skills',
      score: score,
      status: status,
      primaryColor: const Color(0xFF3B82F6),
      gradientEnd: const Color(0xFF60A5FA),
      domainIcon: Icons.directions_run_rounded,
      subtitle: 'Strengthen coordination & movement',
    );
  }

  factory ImproveDomainScreen.language({
    Key? key,
    required String childId,
    required int score,
    required String status,
  }) {
    return ImproveDomainScreen(
      key: key,
      childId: childId,
      domain: 'language',
      domainTitle: 'Language',
      score: score,
      status: status,
      primaryColor: const Color(0xFFEC4899),
      gradientEnd: const Color(0xFFF472B6),
      domainIcon: Icons.record_voice_over_rounded,
      subtitle: 'Boost communication & expression',
    );
  }

  factory ImproveDomainScreen.cognitive({
    Key? key,
    required String childId,
    required int score,
    required String status,
  }) {
    return ImproveDomainScreen(
      key: key,
      childId: childId,
      domain: 'cognitive',
      domainTitle: 'Cognitive',
      score: score,
      status: status,
      primaryColor: const Color(0xFF8B5CF6),
      gradientEnd: const Color(0xFFA78BFA),
      domainIcon: Icons.lightbulb_rounded,
      subtitle: 'Develop thinking & problem-solving',
    );
  }

  factory ImproveDomainScreen.social({
    Key? key,
    required String childId,
    required int score,
    required String status,
  }) {
    return ImproveDomainScreen(
      key: key,
      childId: childId,
      domain: 'social',
      domainTitle: 'Social',
      score: score,
      status: status,
      primaryColor: const Color(0xFFF59E0B),
      gradientEnd: const Color(0xFFFBBF24),
      domainIcon: Icons.people_rounded,
      subtitle: 'Nurture emotional & social skills',
    );
  }

  @override
  State<ImproveDomainScreen> createState() => _ImproveDomainScreenState();
}

class _ImproveDomainScreenState extends State<ImproveDomainScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  bool _isBookmarked = false;
  List<Map<String, dynamic>> _allResources = [];
  String? _errorMessage;

  /// Tab definitions vary by domain -- Language uses "Apps" instead of "Toys".
  List<_TabDefinition> get _tabs {
    if (widget.domain == 'language') {
      return const [
        _TabDefinition('Activities', Icons.sports_handball_rounded),
        _TabDefinition('Books', Icons.menu_book_rounded),
        _TabDefinition('Videos', Icons.play_circle_rounded),
        _TabDefinition('Apps', Icons.phone_iphone_rounded),
      ];
    }
    return const [
      _TabDefinition('Activities', Icons.sports_handball_rounded),
      _TabDefinition('Books', Icons.menu_book_rounded),
      _TabDefinition('Videos', Icons.play_circle_rounded),
      _TabDefinition('Toys', Icons.toys_rounded),
    ];
  }

  /// Map tab index to resource type for API filtering.
  String _typeForTab(int index) {
    switch (index) {
      case 0:
        return 'activity';
      case 1:
        return 'book';
      case 2:
        return 'video';
      case 3:
        return widget.domain == 'language' ? 'app' : 'toy';
      default:
        return 'activity';
    }
  }

  /// Background color associated with the domain.
  Color get _domainBgColor {
    switch (widget.domain) {
      case 'motor':
        return const Color(0xFFEFF6FF);
      case 'language':
        return const Color(0xFFFDF2F8);
      case 'cognitive':
        return const Color(0xFFF5F3FF);
      case 'social':
        return const Color(0xFFFFFBEB);
      default:
        return const Color(0xFFF0FDF4);
    }
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      setState(() {}); // Rebuild to update filtered list
    });
    _fetchResources();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchResources() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await ApiService().getResources(
        widget.childId,
        domain: widget.domain,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        final data = result['data'];
        List<dynamic> resources = [];

        if (data is Map<String, dynamic>) {
          resources = data['resources'] is List ? data['resources'] : [];
        } else if (data is List) {
          resources = data;
        }

        setState(() {
          _allResources = resources
              .map((r) => r is Map<String, dynamic> ? r : <String, dynamic>{})
              .where((r) => r.isNotEmpty)
              .toList();
          _allResources.sort((a, b) {
            final priorityOrder = {'high': 0, 'medium': 1, 'low': 2};
            final aPriority = priorityOrder[a['priority'] ?? 'low'] ?? 2;
            final bPriority = priorityOrder[b['priority'] ?? 'low'] ?? 2;
            return aPriority.compareTo(bPriority);
          });
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['error']?.toString() ?? 'Failed to load resources';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not load resources. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  /// Filter resources by the currently active tab's type.
  List<Map<String, dynamic>> get _filteredResources {
    final type = _typeForTab(_tabController.index);
    return _allResources
        .where((r) => (r['type'] ?? '').toString().toLowerCase() == type)
        .toList();
  }

  /// Human-readable status label.
  String get _statusLabel {
    switch (widget.status) {
      case 'on_track':
        return 'On Track';
      case 'emerging':
        return 'Emerging';
      case 'needs_support':
        return 'Needs Support';
      case 'watch_area':
        return 'Watch Area';
      default:
        return widget.status.replaceAll('_', ' ');
    }
  }

  bool get _isWatchArea =>
      widget.score < 80 ||
      widget.status == 'needs_support' ||
      widget.status == 'watch_area';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _domainBgColor,
      body: Column(
        children: [
          _buildGradientHeader(),
          _buildTabBar(),
          Expanded(child: _buildTabContent()),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // HEADER
  // ---------------------------------------------------------------------------

  Widget _buildGradientHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [widget.primaryColor, widget.gradientEnd],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: back + bookmark
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _headerIconButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  _headerIconButton(
                    icon: _isBookmarked
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_border_rounded,
                    onTap: () => setState(() => _isBookmarked = !_isBookmarked),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Domain icon, title, subtitle
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(widget.domainIcon, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.domainTitle,
                          style: GoogleFonts.nunito(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          widget.subtitle,
                          style: GoogleFonts.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withOpacity(0.85),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Score badge pill
              _buildScoreBadge(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _headerIconButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }

  Widget _buildScoreBadge() {
    final isWarning = _isWatchArea;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isWarning
            ? Colors.white.withOpacity(0.95)
            : Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(24),
        border: isWarning
            ? Border.all(color: AppTheme.warning.withOpacity(0.4), width: 1.5)
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isWarning) ...[
            Icon(Icons.warning_amber_rounded, size: 18, color: AppTheme.warning),
            const SizedBox(width: 6),
          ],
          Text(
            isWarning
                ? 'Score: ${widget.score}/100 \u2014 $_statusLabel'
                : '${widget.score}/100 \u2014 $_statusLabel',
            style: GoogleFonts.nunito(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isWarning ? AppTheme.warning : Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB BAR
  // ---------------------------------------------------------------------------

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        isScrollable: false,
        labelColor: widget.primaryColor,
        unselectedLabelColor: AppTheme.neutral400,
        indicatorColor: widget.primaryColor,
        indicatorWeight: 3,
        labelStyle: GoogleFonts.nunito(fontWeight: FontWeight.w700, fontSize: 13),
        unselectedLabelStyle:
            GoogleFonts.nunito(fontWeight: FontWeight.w500, fontSize: 13),
        dividerColor: AppTheme.neutral200,
        tabs: _tabs
            .map(
              (t) => Tab(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(t.icon, size: 18),
                    const SizedBox(width: 4),
                    Text(t.label),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB CONTENT
  // ---------------------------------------------------------------------------

  Widget _buildTabContent() {
    if (_isLoading) {
      return _buildShimmerLoading();
    }

    if (_errorMessage != null) {
      return _buildErrorState();
    }

    final resources = _filteredResources;

    if (resources.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _fetchResources,
      color: widget.primaryColor,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        itemCount: resources.length,
        itemBuilder: (context, index) {
          final resource = resources[index];
          return StaggeredListAnimation(
            index: index,
            child: index == 0
                ? _buildFeaturedResourceCard(resource)
                : _buildCompactResourceCard(resource),
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // FEATURED CARD (first / highest-priority resource)
  // ---------------------------------------------------------------------------

  Widget _buildFeaturedResourceCard(Map<String, dynamic> resource) {
    final title = resource['title'] ?? 'Resource';
    final description = resource['description'] ?? '';
    final ageRange = resource['ageRange'] ?? '';
    final duration = resource['duration'] ?? '';
    final difficulty = resource['difficulty'] ?? '';
    final domain = resource['domain'] ?? widget.domain;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image placeholder area
          Container(
            height: 160,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  widget.primaryColor.withOpacity(0.15),
                  widget.gradientEnd.withOpacity(0.08),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Center(
              child: Icon(
                widget.domainIcon,
                size: 56,
                color: widget.primaryColor.withOpacity(0.4),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tags row
                Row(
                  children: [
                    _buildTag(
                      _capitalize(domain.toString()),
                      widget.primaryColor,
                    ),
                    if (ageRange.toString().isNotEmpty) ...[
                      const SizedBox(width: 8),
                      _buildTag(ageRange.toString(), AppTheme.neutral500),
                    ],
                  ],
                ),
                const SizedBox(height: 10),

                // Title
                Text(
                  title.toString(),
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral900,
                  ),
                ),
                const SizedBox(height: 6),

                // Description
                Text(
                  description.toString(),
                  style: GoogleFonts.nunito(
                    fontSize: 14,
                    color: AppTheme.neutral600,
                    height: 1.5,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),

                // Duration + Difficulty badges
                Row(
                  children: [
                    if (duration.toString().isNotEmpty)
                      _buildInfoBadge(
                        Icons.timer_outlined,
                        duration.toString(),
                      ),
                    if (duration.toString().isNotEmpty &&
                        difficulty.toString().isNotEmpty)
                      const SizedBox(width: 10),
                    if (difficulty.toString().isNotEmpty)
                      _buildInfoBadge(
                        Icons.signal_cellular_alt_rounded,
                        _capitalize(difficulty.toString()),
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

  // ---------------------------------------------------------------------------
  // COMPACT CARD (rest of the resources)
  // ---------------------------------------------------------------------------

  Widget _buildCompactResourceCard(Map<String, dynamic> resource) {
    final title = resource['title'] ?? 'Resource';
    final description = resource['description'] ?? '';
    final ageRange = resource['ageRange'] ?? '';
    final priority = resource['priority'] ?? 'medium';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon placeholder with domain color accent
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: widget.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              _iconForType(_typeForTab(_tabController.index)),
              color: widget.primaryColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),

          // Title + description + tags
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.toString(),
                  style: GoogleFonts.nunito(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  description.toString(),
                  style: GoogleFonts.nunito(
                    fontSize: 13,
                    color: AppTheme.neutral500,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    if (ageRange.toString().isNotEmpty)
                      _buildMiniTag(ageRange.toString(), AppTheme.neutral400),
                    if (ageRange.toString().isNotEmpty &&
                        priority.toString().isNotEmpty)
                      const SizedBox(width: 6),
                    if (priority.toString().isNotEmpty)
                      _buildMiniTag(
                        _capitalize(priority.toString()),
                        _priorityColor(priority.toString()),
                      ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),
          Icon(
            Icons.chevron_right_rounded,
            color: AppTheme.neutral300,
            size: 22,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // STATES: loading shimmer, empty, error
  // ---------------------------------------------------------------------------

  Widget _buildShimmerLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: index == 0 ? 260 : 80,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: _shimmerPlaceholder(index == 0 ? 260 : 80),
        );
      },
    );
  }

  Widget _shimmerPlaceholder(double height) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.3, end: 0.7),
      duration: const Duration(milliseconds: 1000),
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        return Container(
          height: height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: [
                AppTheme.neutral100.withOpacity(value),
                AppTheme.neutral200.withOpacity(value),
                AppTheme.neutral100.withOpacity(value),
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: widget.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                _tabs[_tabController.index].icon,
                size: 36,
                color: widget.primaryColor.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No ${_tabs[_tabController.index].label.toLowerCase()} yet',
              style: GoogleFonts.nunito(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Resources will appear here after your child\'s next development analysis.',
              textAlign: TextAlign.center,
              style: GoogleFonts.nunito(
                fontSize: 14,
                color: AppTheme.neutral500,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchResources,
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: Text(
                'Refresh',
                style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.primaryColor,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                Icons.cloud_off_rounded,
                size: 36,
                color: AppTheme.error.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Something went wrong',
              style: GoogleFonts.nunito(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Please try again.',
              textAlign: TextAlign.center,
              style: GoogleFonts.nunito(
                fontSize: 14,
                color: AppTheme.neutral500,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchResources,
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: Text(
                'Retry',
                style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.primaryColor,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  Widget _buildTag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: GoogleFonts.nunito(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildMiniTag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: GoogleFonts.nunito(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }

  Widget _buildInfoBadge(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.neutral100,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.neutral500),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.nunito(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral600,
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'activity':
        return Icons.sports_handball_rounded;
      case 'book':
        return Icons.menu_book_rounded;
      case 'video':
        return Icons.play_circle_rounded;
      case 'toy':
        return Icons.toys_rounded;
      case 'app':
        return Icons.phone_iphone_rounded;
      default:
        return Icons.star_rounded;
    }
  }

  Color _priorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return AppTheme.error;
      case 'medium':
        return AppTheme.warning;
      case 'low':
        return AppTheme.success;
      default:
        return AppTheme.neutral500;
    }
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }
}

/// Simple data class for tab definitions.
class _TabDefinition {
  final String label;
  final IconData icon;
  const _TabDefinition(this.label, this.icon);
}
