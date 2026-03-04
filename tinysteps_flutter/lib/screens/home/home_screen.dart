import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';
import '../../widgets/child_header_card.dart';
import '../../widgets/domain_score_ring.dart';
import '../analysis/media_capture_screen.dart';
import '../stories/bedtime_stories_screen.dart';
import '../milestones/milestones_screen.dart';
import '../growth/growth_charts_screen.dart';

/// V3 Home Dashboard - matches Pencil design nodeId: 39h1m exactly
/// Layout: Status bar area -> Header -> Child Info Card -> Overall Score Card
/// -> Domain Pills -> Recent Activity -> Quick Actions -> BottomNavBar
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  ChildProfile? _currentChild;
  AnalysisResult? _latestAnalysis;
  bool _isLoading = true;
  int _storyCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();
    AnalysisResult? analysis;
    int storyCount = 0;

    if (child != null) {
      analysis = await storage.getLatestAnalysis(child.id);
      final stories = await storage.getStories(child.id);
      storyCount = stories.length;
    }

    if (mounted) {
      setState(() {
        _currentChild = child;
        _latestAnalysis = analysis;
        _storyCount = storyCount;
        _isLoading = false;
      });
    }
  }

  // TODO: Status labels should come from the backend /api/config endpoint
  // instead of being hardcoded here. The backend now provides statusLabels
  // in the config response (e.g., { "on_track": { "label": "On Track", ... } }).
  String _getStatusLabel(String? status) {
    switch (status) {
      case 'on_track':
        return 'On Track';
      case 'emerging':
        return 'Emerging';
      case 'needs_support':
        return 'Needs Support';
      default:
        return 'On Track';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        color: AppTheme.backgroundV3,
        child: const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }

    return Container(
      color: AppTheme.backgroundV3,
      child: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: AppTheme.primaryGreen,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row: back arrow, "Home", spacer, settings gear
                _buildHeader(),

                // Scrollable content with padding
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Child info card
                      StaggeredListAnimation(
                        index: 0,
                        child: ChildHeaderCard(
                          childName: _currentChild?.displayName ?? 'Baby',
                          ageText: _currentChild?.displayAge ?? '',
                          statusText: _getStatusLabel(
                            _latestAnalysis?.overallStatus,
                          ),
                          avatarUrl: _currentChild?.profilePhotoPath,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Overall Score card
                      StaggeredListAnimation(
                        index: 1,
                        child: _buildOverallScoreCard(),
                      ),
                      const SizedBox(height: 20),

                      // Domain Score Pills row
                      StaggeredListAnimation(
                        index: 2,
                        child: _buildDomainPills(),
                      ),
                      const SizedBox(height: 20),

                      // Recent Activity section
                      StaggeredListAnimation(
                        index: 3,
                        child: _buildRecentActivity(),
                      ),
                      const SizedBox(height: 20),

                      // Quick Actions section
                      StaggeredListAnimation(
                        index: 4,
                        child: _buildQuickActions(),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Header row matching design: back chevron, "Home" title, spacer, settings gear
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
      child: SizedBox(
        height: 48,
        child: Row(
          children: [
            GestureDetector(
              onTap: () {
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                }
              },
              child: const Icon(
                Icons.chevron_left_rounded,
                size: 24,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Home',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () {
                // Settings action - placeholder
              },
              child: const Icon(
                Icons.settings_outlined,
                size: 22,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Overall Score card with large ring, score number, description, trend badge
  Widget _buildOverallScoreCard() {
    final score = _latestAnalysis?.overallScore.round() ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadowV3,
      ),
      child: Row(
        children: [
          // Score ring - 90px with 6px stroke
          SizedBox(
            width: 90,
            height: 90,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: score / 100),
              duration: const Duration(milliseconds: 1500),
              curve: Curves.easeOutCubic,
              builder: (context, value, _) {
                return CustomPaint(
                  painter: _OverallScoreRingPainter(
                    progress: value,
                    strokeWidth: 6,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TweenAnimationBuilder<int>(
                          tween: IntTween(begin: 0, end: score),
                          duration: const Duration(milliseconds: 1500),
                          curve: Curves.easeOutCubic,
                          builder: (context, val, _) {
                            return Text(
                              '$val',
                              style: const TextStyle(
                                fontFamily: 'Nunito',
                                fontSize: 28,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            );
                          },
                        ),
                        const Text(
                          '/100',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            color: AppTheme.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: 20),

          // Score info column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Overall Score',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _latestAnalysis != null
                      ? 'Your child is developing well across all domains'
                      : 'Run an analysis to see your score',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                // Trend badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.greenTint,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.trending_up_rounded,
                        size: 14,
                        color: Color(0xFF059669),
                      ),
                      const SizedBox(width: 4),
                      const Text(
                        '+5 this month',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF059669),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Domain score pills row - 4 items evenly spaced
  Widget _buildDomainPills() {
    final motor = _latestAnalysis?.motorAssessment.score.round() ?? 0;
    final social = _latestAnalysis?.socialAssessment.score.round() ?? 0;
    final cognitive = _latestAnalysis?.cognitiveAssessment.score.round() ?? 0;
    final language = _latestAnalysis?.languageAssessment.score.round() ?? 0;

    return Row(
      children: [
        Expanded(
          child: _buildDomainPill(
            score: motor,
            label: 'Motor',
            color: AppTheme.motorColor,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildDomainPill(
            score: social,
            label: 'Social',
            color: AppTheme.socialColor,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildDomainPill(
            score: cognitive,
            label: 'Cognitive',
            color: AppTheme.cognitiveColor,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildDomainPill(
            score: language,
            label: 'Language',
            color: AppTheme.languageColor,
          ),
        ),
      ],
    );
  }

  /// Single domain pill card with ring and label
  Widget _buildDomainPill({
    required int score,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadowV3,
      ),
      child: DomainScoreRing(
        score: score,
        label: label,
        color: color,
        size: 44,
      ),
    );
  }

  /// Recent Activity section with header + horizontal card row
  Widget _buildRecentActivity() {
    final daysSinceAnalysis = _latestAnalysis != null
        ? DateTime.now().difference(_latestAnalysis!.timestamp).inDays
        : null;
    final analysisTimeText = daysSinceAnalysis != null
        ? (daysSinceAnalysis == 0
            ? 'Today'
            : daysSinceAnalysis == 1
                ? '1 day ago'
                : '$daysSinceAnalysis days ago')
        : 'No data';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Activity',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () {
                // View all action
              },
              child: const Text(
                'View All',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryGreen,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Horizontal card row
        Row(
          children: [
            Expanded(
              child: _buildRecentCard(
                iconBgColor: AppTheme.purpleTint,
                iconColor: AppTheme.cognitiveColor,
                icon: Icons.search_rounded,
                title: 'Last Analysis',
                subtitle: analysisTimeText,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildRecentCard(
                iconBgColor: AppTheme.blueTint,
                iconColor: AppTheme.motorColor,
                icon: Icons.flag_rounded,
                title: 'Next Milestone',
                subtitle: 'In 1 week',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildRecentCard(
                iconBgColor: AppTheme.pinkTint,
                iconColor: AppTheme.languageColor,
                icon: Icons.menu_book_rounded,
                title: 'Stories Read',
                subtitle: '$_storyCount this month',
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Single recent activity card
  Widget _buildRecentCard({
    required Color iconBgColor,
    required Color iconColor,
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadowV3,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: FontWeight.w400,
              color: AppTheme.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  /// Quick Actions section with 2x2 grid
  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontFamily: 'Nunito',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),

        // Row 1: New Analysis + Milestones
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                iconBgColor: AppTheme.blueTint,
                iconColor: AppTheme.motorColor,
                icon: Icons.document_scanner_rounded,
                label: 'New Analysis',
                onTap: () {
                  if (_currentChild != null) {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => MediaCaptureScreen(child: _currentChild!),
                      ),
                    );
                  }
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildQuickActionCard(
                iconBgColor: AppTheme.greenTint,
                iconColor: AppTheme.primaryGreen,
                icon: Icons.flag_rounded,
                label: 'Milestones',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const MilestonesScreen()),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Row 2: Growth Charts + Bedtime Stories
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                iconBgColor: AppTheme.purpleTint,
                iconColor: AppTheme.cognitiveColor,
                icon: Icons.show_chart_rounded,
                label: 'Growth Charts',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const GrowthChartsScreen()),
                  );
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildQuickActionCard(
                iconBgColor: AppTheme.pinkTint,
                iconColor: AppTheme.languageColor,
                icon: Icons.auto_stories_rounded,
                label: 'Bedtime Stories',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const BedtimeStoriesScreen()),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Single quick action card
  Widget _buildQuickActionCard({
    required Color iconBgColor,
    required Color iconColor,
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Custom painter for the Overall Score ring (90px, 6px stroke, green on gray)
class _OverallScoreRingPainter extends CustomPainter {
  final double progress;
  final double strokeWidth;

  _OverallScoreRingPainter({
    required this.progress,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background ring
    final bgPaint = Paint()
      ..color = const Color(0xFFE5E7EB)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, bgPaint);

    // Progress ring
    final progressPaint = Paint()
      ..color = AppTheme.primaryGreen
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _OverallScoreRingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
