import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';
import 'improve_domain_screen.dart';

/// Resources Library screen -- browse improvement resources by domain and type.
///
/// Design: emerald-teal gradient header with search, 2x2 domain grid,
/// 4-col type grid, and a "Recently Added" list.
class ResourcesLibraryScreen extends StatefulWidget {
  const ResourcesLibraryScreen({super.key});

  @override
  State<ResourcesLibraryScreen> createState() => _ResourcesLibraryScreenState();
}

class _ResourcesLibraryScreenState extends State<ResourcesLibraryScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  ChildProfile? _child;
  AnalysisResult? _latestAnalysis;

  // Raw resources from the API
  List<Map<String, dynamic>> _resources = [];

  // Aggregated counts
  Map<String, int> _domainCounts = {};
  Map<String, int> _typeCounts = {};

  // Search
  final TextEditingController _searchController = TextEditingController();
  bool _showSearch = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final storage = StorageService();
      final child = await storage.getCurrentChild();
      AnalysisResult? latestAnalysis;

      if (child != null) {
        latestAnalysis = await storage.getLatestAnalysis(child.id);
      }

      setState(() {
        _child = child;
        _latestAnalysis = latestAnalysis;
      });

      if (child != null) {
        await _fetchResources(child.id);
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'No child profile found. Please set up a profile first.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Could not load data. Please try again.';
        });
      }
    }
  }

  Future<void> _fetchResources(String childId) async {
    try {
      final result = await ApiService().getResources(childId);

      if (!mounted) return;

      if (result['success'] == true) {
        final data = result['data'];
        List<dynamic> rawResources = [];
        Map<String, int> domainCounts = {};
        Map<String, int> typeCounts = {};

        if (data is Map<String, dynamic>) {
          rawResources = data['resources'] is List ? data['resources'] : [];

          // Use counts from API if available
          if (data['counts'] is Map) {
            final counts = data['counts'] as Map<String, dynamic>;
            if (counts['byDomain'] is Map) {
              (counts['byDomain'] as Map<String, dynamic>).forEach((k, v) {
                domainCounts[k] = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
              });
            }
            if (counts['byType'] is Map) {
              (counts['byType'] as Map<String, dynamic>).forEach((k, v) {
                typeCounts[k] = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
              });
            }
          }
        } else if (data is List) {
          rawResources = data;
        }

        final resources = rawResources
            .map((r) => r is Map<String, dynamic> ? r : <String, dynamic>{})
            .where((r) => r.isNotEmpty)
            .toList();

        // If API didn't provide counts, compute locally
        if (domainCounts.isEmpty) {
          for (final r in resources) {
            final domain = (r['domain'] ?? '').toString().toLowerCase();
            if (domain.isNotEmpty) {
              domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
            }
          }
        }
        if (typeCounts.isEmpty) {
          for (final r in resources) {
            final type = (r['type'] ?? '').toString().toLowerCase();
            if (type.isNotEmpty) {
              typeCounts[type] = (typeCounts[type] ?? 0) + 1;
            }
          }
        }

        setState(() {
          _resources = resources;
          _domainCounts = domainCounts;
          _typeCounts = typeCounts;
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

  /// Recently added resources -- sorted by createdAt descending, take first 5.
  List<Map<String, dynamic>> get _recentResources {
    final sorted = List<Map<String, dynamic>>.from(_resources);
    sorted.sort((a, b) {
      final aDate = a['createdAt']?.toString() ?? '';
      final bDate = b['createdAt']?.toString() ?? '';
      return bDate.compareTo(aDate);
    });
    return sorted.take(5).toList();
  }

  // ---------------------------------------------------------------------------
  // Domain helper data
  // ---------------------------------------------------------------------------

  static const _domains = [
    _DomainInfo(
      key: 'motor',
      label: 'Motor Skills',
      icon: Icons.directions_run_rounded,
      color: Color(0xFF3B82F6),
      bgColor: Color(0xFFEFF6FF),
    ),
    _DomainInfo(
      key: 'cognitive',
      label: 'Cognitive',
      icon: Icons.lightbulb_rounded,
      color: Color(0xFF8B5CF6),
      bgColor: Color(0xFFF5F3FF),
    ),
    _DomainInfo(
      key: 'language',
      label: 'Language',
      icon: Icons.record_voice_over_rounded,
      color: Color(0xFFEC4899),
      bgColor: Color(0xFFFDF2F8),
    ),
    _DomainInfo(
      key: 'social',
      label: 'Social-Emotional',
      icon: Icons.people_rounded,
      color: Color(0xFFF59E0B),
      bgColor: Color(0xFFFFFBEB),
    ),
  ];

  static const _types = [
    _TypeInfo(key: 'activity', label: 'Activities', icon: Icons.auto_awesome_rounded, color: Color(0xFF10B981)),
    _TypeInfo(key: 'book', label: 'Books', icon: Icons.menu_book_rounded, color: Color(0xFF8B5CF6)),
    _TypeInfo(key: 'video', label: 'Videos', icon: Icons.play_circle_rounded, color: Color(0xFFEF4444)),
    _TypeInfo(key: 'toy', label: 'Toys', icon: Icons.extension_rounded, color: Color(0xFFF59E0B)),
  ];

  // ---------------------------------------------------------------------------
  // Navigation to ImproveDomainScreen
  // ---------------------------------------------------------------------------

  void _navigateToDomain(_DomainInfo domain) {
    final childId = _child?.id ?? '';
    int score = 0;
    String status = 'on_track';

    if (_latestAnalysis != null) {
      switch (domain.key) {
        case 'motor':
          score = _latestAnalysis!.motorAssessment.score.round();
          status = _latestAnalysis!.motorAssessment.status;
          break;
        case 'cognitive':
          score = _latestAnalysis!.cognitiveAssessment.score.round();
          status = _latestAnalysis!.cognitiveAssessment.status;
          break;
        case 'language':
          score = _latestAnalysis!.languageAssessment.score.round();
          status = _latestAnalysis!.languageAssessment.status;
          break;
        case 'social':
          score = _latestAnalysis!.socialAssessment.score.round();
          status = _latestAnalysis!.socialAssessment.status;
          break;
      }
    }

    Widget screen;
    switch (domain.key) {
      case 'motor':
        screen = ImproveDomainScreen.motor(childId: childId, score: score, status: status);
        break;
      case 'cognitive':
        screen = ImproveDomainScreen.cognitive(childId: childId, score: score, status: status);
        break;
      case 'language':
        screen = ImproveDomainScreen.language(childId: childId, score: score, status: status);
        break;
      case 'social':
        screen = ImproveDomainScreen.social(childId: childId, score: score, status: status);
        break;
      default:
        screen = ImproveDomainScreen.motor(childId: childId, score: score, status: status);
    }

    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  // ---------------------------------------------------------------------------
  // BUILD
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0FDF4),
      body: Column(
        children: [
          _buildGradientHeader(),
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _errorMessage != null
                    ? _buildErrorState()
                    : _buildBody(),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // HEADER
  // ---------------------------------------------------------------------------

  Widget _buildGradientHeader() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF14B8A6)],
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
              // Top row: back + search toggle
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _headerIconButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  _headerIconButton(
                    icon: Icons.search_rounded,
                    onTap: () => setState(() => _showSearch = !_showSearch),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Icon + title + subtitle
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.local_library_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Resources Library',
                          style: GoogleFonts.nunito(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Everything to support ${_child?.displayName ?? "your child"}\'s growth',
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

              // Search bar (animated show/hide)
              if (_showSearch) ...[
                const SizedBox(height: 16),
                Container(
                  height: 46,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _searchController,
                    style: GoogleFonts.nunito(color: Colors.white, fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'Search resources...',
                      hintStyle: GoogleFonts.nunito(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 15,
                      ),
                      prefixIcon: Icon(Icons.search_rounded, color: Colors.white.withOpacity(0.7), size: 22),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
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

  // ---------------------------------------------------------------------------
  // BODY
  // ---------------------------------------------------------------------------

  Widget _buildBody() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppTheme.primaryGreen,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          // Browse by Domain
          _sectionLabel('Browse by Domain'),
          const SizedBox(height: 12),
          _buildDomainGrid(),
          const SizedBox(height: 28),

          // Browse by Type
          _sectionLabel('Browse by Type'),
          const SizedBox(height: 12),
          _buildTypeGrid(),
          const SizedBox(height: 28),

          // Recently Added
          if (_recentResources.isNotEmpty) ...[
            _sectionLabel('Recently Added'),
            const SizedBox(height: 12),
            ..._recentResources.asMap().entries.map(
              (entry) => StaggeredListAnimation(
                index: entry.key,
                child: _buildRecentResourceCard(entry.value),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _sectionLabel(String label) {
    return Text(
      label,
      style: GoogleFonts.nunito(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: AppTheme.neutral800,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // DOMAIN GRID (2x2)
  // ---------------------------------------------------------------------------

  Widget _buildDomainGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.45,
      children: _domains.map((d) => _buildDomainCard(d)).toList(),
    );
  }

  Widget _buildDomainCard(_DomainInfo domain) {
    final count = _domainCounts[domain.key] ?? 0;
    final bool isFocusArea = domain.key == 'language' &&
        _latestAnalysis != null &&
        _latestAnalysis!.languageAssessment.score < 80;

    return GestureDetector(
      onTap: () => _navigateToDomain(domain),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: domain.bgColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: domain.color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(domain.icon, color: domain.color, size: 22),
                ),
                const Spacer(),
                if (isFocusArea)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: domain.color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Focus area',
                      style: GoogleFonts.nunito(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: domain.color,
                      ),
                    ),
                  ),
              ],
            ),
            const Spacer(),
            Text(
              domain.label,
              style: GoogleFonts.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '$count resources',
              style: GoogleFonts.nunito(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppTheme.neutral500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TYPE GRID (4-column)
  // ---------------------------------------------------------------------------

  Widget _buildTypeGrid() {
    return Row(
      children: _types.map((t) {
        final count = _typeCounts[t.key] ?? 0;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: t != _types.last ? 10 : 0,
            ),
            child: _buildTypeCard(t, count),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTypeCard(_TypeInfo typeInfo, int count) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: typeInfo.color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(typeInfo.icon, color: typeInfo.color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            typeInfo.label,
            style: GoogleFonts.nunito(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral700,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            '$count',
            style: GoogleFonts.nunito(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppTheme.neutral400,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // RECENTLY ADDED CARDS
  // ---------------------------------------------------------------------------

  Widget _buildRecentResourceCard(Map<String, dynamic> resource) {
    final title = resource['title']?.toString() ?? 'Resource';
    final domain = resource['domain']?.toString() ?? '';
    final type = resource['type']?.toString() ?? '';
    final ageRange = resource['ageRange']?.toString() ?? '';

    final domainInfo = _domains.firstWhere(
      (d) => d.key == domain.toLowerCase(),
      orElse: () => _domains.first,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Domain-colored icon placeholder
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: domainInfo.color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(domainInfo.icon, color: domainInfo.color, size: 24),
          ),
          const SizedBox(width: 14),

          // Title + tags
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.nunito(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    if (domain.isNotEmpty)
                      _buildMiniTag(_capitalize(domain), domainInfo.color),
                    if (domain.isNotEmpty && (ageRange.isNotEmpty || type.isNotEmpty))
                      const SizedBox(width: 6),
                    if (ageRange.isNotEmpty)
                      _buildMiniTag(ageRange, AppTheme.neutral400),
                    if (ageRange.isNotEmpty && type.isNotEmpty)
                      const SizedBox(width: 6),
                    if (type.isNotEmpty)
                      _buildMiniTag(_capitalize(type), AppTheme.neutral400),
                  ],
                ),
              ],
            ),
          ),

          Icon(Icons.chevron_right_rounded, color: AppTheme.neutral300, size: 22),
        ],
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

  // ---------------------------------------------------------------------------
  // LOADING / ERROR STATES
  // ---------------------------------------------------------------------------

  Widget _buildLoadingState() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(4, (index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: index < 2 ? 100 : 72,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: _shimmerPlaceholder(index < 2 ? 100 : 72),
        );
      }),
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
              onPressed: _loadData,
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: Text(
                'Retry',
                style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
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

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }
}

// =============================================================================
// Data models for domain/type grid
// =============================================================================

class _DomainInfo {
  final String key;
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _DomainInfo({
    required this.key,
    required this.label,
    required this.icon,
    required this.color,
    required this.bgColor,
  });
}

class _TypeInfo {
  final String key;
  final String label;
  final IconData icon;
  final Color color;

  const _TypeInfo({
    required this.key,
    required this.label,
    required this.icon,
    required this.color,
  });
}
