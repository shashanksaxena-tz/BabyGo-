import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

/// WHO Research Evidence screen -- displays scientific evidence and research
/// sources behind the developmental assessments.
///
/// Design: teal gradient header with book icon, WHO trust banner,
/// source cards with domain tags, methodology section, and disclaimer.
class WHOEvidenceScreen extends StatefulWidget {
  /// Context filter: 'motor', 'language', 'cognitive', 'social', 'growth', 'report', etc.
  final String evidenceContext;

  /// Optional analysis ID for analysis-specific evidence.
  final String? analysisId;

  const WHOEvidenceScreen({
    super.key,
    this.evidenceContext = 'general',
    this.analysisId,
  });

  @override
  State<WHOEvidenceScreen> createState() => _WHOEvidenceScreenState();
}

class _WHOEvidenceScreenState extends State<WHOEvidenceScreen> {
  bool _isLoading = true;

  List<Map<String, dynamic>> _sources = [];
  List<Map<String, dynamic>> _methodology = [];
  String _disclaimer = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ApiService().getWHOEvidence(
        context: widget.evidenceContext,
        analysisId: widget.analysisId,
      );

      if (result['success'] == true && result['data'] != null) {
        final data = result['data'];
        setState(() {
          _sources = List<Map<String, dynamic>>.from(data['sources'] ?? []);
          _methodology =
              List<Map<String, dynamic>>.from(data['methodology'] ?? []);
          _disclaimer = data['disclaimer'] as String? ?? _defaultDisclaimer;
          _isLoading = false;
        });
      } else {
        // Fall back to built-in data if API fails
        _loadFallbackData();
      }
    } catch (e) {
      _loadFallbackData();
    }
  }

  void _loadFallbackData() {
    setState(() {
      _sources = _defaultSources;
      _methodology = _defaultMethodology;
      _disclaimer = _defaultDisclaimer;
      _isLoading = false;
    });
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF10B981),
          ),
        ),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildHeader(),
          SliverToBoxAdapter(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return SliverAppBar(
      expandedHeight: 180,
      pinned: true,
      backgroundColor: const Color(0xFF10B981),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
        onPressed: () => Navigator.of(context).pop(),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search_rounded, color: Colors.white70),
          onPressed: () {},
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF10B981), Color(0xFF14B8A6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 50, 20, 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.menu_book_rounded,
                          color: Colors.white,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'WHO Evidence & Research',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Scientific standards behind our assessments',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: Colors.white.withOpacity(0.8),
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
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // WHO Trust Banner
          _buildTrustBanner(),
          const SizedBox(height: 24),

          // Key Research Sources
          const Text(
            'Key Research Sources',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral800,
            ),
          ),
          const SizedBox(height: 12),
          ..._sources.asMap().entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: StaggeredListAnimation(
                index: entry.key,
                child: _buildSourceCard(entry.value),
              ),
            );
          }),
          const SizedBox(height: 24),

          // Our Methodology
          _buildMethodologySection(),
          const SizedBox(height: 24),

          // Disclaimer
          _buildDisclaimer(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildTrustBanner() {
    return StaggeredListAnimation(
      index: 0,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF10B981).withOpacity(0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFF10B981).withOpacity(0.2),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.verified_rounded,
                color: Color(0xFF10B981),
                size: 28,
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'WHO Growth Standards',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.neutral800,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'All assessments are based on the WHO Multicentre Growth Reference Study and validated developmental milestones.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.neutral600,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSourceCard(Map<String, dynamic> source) {
    final domain = source['domain'] as String? ?? 'General';
    final title = source['title'] as String? ?? '';
    final journal = source['journal'] as String? ?? '';
    final year = source['year']?.toString() ?? '';
    final citations = source['citations'] as int? ?? 0;
    final url = source['url'] as String? ?? '';

    Color tagColor;
    switch (domain.toLowerCase()) {
      case 'growth standards':
      case 'growth':
        tagColor = AppTheme.secondaryBlue;
        break;
      case 'motor development':
      case 'motor':
        tagColor = AppTheme.secondaryPurple;
        break;
      case 'language & communication':
      case 'language':
        tagColor = AppTheme.socialColor;
        break;
      case 'cognitive':
        tagColor = AppTheme.cognitiveColor;
        break;
      default:
        tagColor = AppTheme.primaryGreen;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Domain tag
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: tagColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              domain,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: tagColor,
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Study title
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral800,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 6),

          // Journal + Year
          if (journal.isNotEmpty || year.isNotEmpty)
            Text(
              [journal, year].where((s) => s.isNotEmpty).join(' - '),
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.neutral500,
                fontStyle: FontStyle.italic,
              ),
            ),
          const SizedBox(height: 10),

          // Bottom row: citations + view link
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (citations > 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.neutral100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.format_quote_rounded,
                        size: 14,
                        color: AppTheme.neutral500,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${_formatCitations(citations)} citations',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.neutral500,
                        ),
                      ),
                    ],
                  ),
                )
              else
                const SizedBox.shrink(),
              if (url.isNotEmpty)
                GestureDetector(
                  onTap: () => _openUrl(url),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View Full Study',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.open_in_new_rounded,
                        size: 14,
                        color: AppTheme.primaryGreen,
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMethodologySection() {
    final steps = _methodology.isNotEmpty
        ? _methodology
        : _defaultMethodology;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Our Methodology',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.neutral800,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: AppTheme.softShadow,
          ),
          child: Column(
            children: steps.asMap().entries.map((entry) {
              final i = entry.key;
              final step = entry.value;
              final title = step['title'] as String? ?? '';
              final desc = step['description'] as String? ?? '';
              final icon = _getMethodologyIcon(i);
              final color = _getMethodologyColor(i);

              return Padding(
                padding: EdgeInsets.only(
                  bottom: i < steps.length - 1 ? 20 : 0,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Step number circle
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color, size: 20),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.neutral800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            desc,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.neutral500,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildDisclaimer() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.warning.withOpacity(0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.warning.withOpacity(0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: AppTheme.warning,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              _disclaimer,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.neutral600,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatCitations(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(count % 1000 == 0 ? 0 : 1)}k';
    }
    return count.toString();
  }

  IconData _getMethodologyIcon(int index) {
    switch (index) {
      case 0:
        return Icons.camera_alt_rounded;
      case 1:
        return Icons.compare_arrows_rounded;
      case 2:
        return Icons.auto_awesome_rounded;
      default:
        return Icons.science_rounded;
    }
  }

  Color _getMethodologyColor(int index) {
    switch (index) {
      case 0:
        return AppTheme.secondaryBlue;
      case 1:
        return AppTheme.primaryGreen;
      case 2:
        return AppTheme.secondaryPurple;
      default:
        return AppTheme.primaryTeal;
    }
  }

  // ==================== Fallback / Default Data ====================

  static const String _defaultDisclaimer =
      'This information is for educational and informational purposes only and is not intended as medical advice. '
      'TinySteps AI does not replace professional medical diagnosis. Always consult a qualified healthcare professional '
      'for medical questions or concerns about your child\'s development.';

  static final List<Map<String, dynamic>> _defaultSources = [
    {
      'domain': 'Growth Standards',
      'title':
          'WHO Child Growth Standards: Length/height-for-age, weight-for-age, weight-for-length, weight-for-height and body mass index-for-age',
      'journal': 'World Health Organization',
      'year': '2006',
      'citations': 12450,
      'url': 'https://www.who.int/tools/child-growth-standards/standards',
    },
    {
      'domain': 'Motor Development',
      'title':
          'WHO Multicentre Growth Reference Study: Windows of achievement for six gross motor development milestones',
      'journal': 'Acta Paediatrica',
      'year': '2006',
      'citations': 3280,
      'url': 'https://www.who.int/publications/i/item/9789241596275',
    },
    {
      'domain': 'Language & Communication',
      'title':
          'Early Language Development: Milestones, Individual Variation, and Assessment',
      'journal': 'UNICEF Early Childhood Development',
      'year': '2020',
      'citations': 1840,
      'url': 'https://www.unicef.org/early-childhood-development',
    },
    {
      'domain': 'Cognitive',
      'title':
          'Nurturing Care for Early Childhood Development: A framework for helping children survive and thrive',
      'journal': 'WHO / UNICEF / World Bank',
      'year': '2018',
      'citations': 2750,
      'url': 'https://nurturing-care.org',
    },
    {
      'domain': 'General',
      'title':
          'Learn the Signs. Act Early: Developmental Milestone Checklists',
      'journal': 'Centers for Disease Control and Prevention',
      'year': '2022',
      'citations': 5120,
      'url':
          'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
    },
  ];

  static final List<Map<String, dynamic>> _defaultMethodology = [
    {
      'title': 'Data Collection',
      'description':
          'Photo and video analysis using Google Gemini AI to observe developmental behaviours and physical milestones in a natural setting.',
    },
    {
      'title': 'WHO Benchmark Comparison',
      'description':
          'Each observation is compared against WHO Child Growth Standards and CDC developmental milestone data across motor, language, cognitive, and social-emotional domains.',
    },
    {
      'title': 'AI-Powered Analysis',
      'description':
          'Machine learning models identify patterns and correlations across multiple developmental domains to provide a comprehensive assessment with actionable insights.',
    },
  ];
}
