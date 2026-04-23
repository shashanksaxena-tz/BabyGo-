import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';

import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';
import '../discover/improve_domain_screen.dart';

/// Development Insights screen -- shows detailed analytics and growth trends
/// for a child across all developmental domains.
///
/// Design: purple gradient header (indigo-purple), time filter pills,
/// development trend chart, domain detail cards, and milestone velocity.
class DevelopmentInsightsScreen extends StatefulWidget {
  final String childId;

  const DevelopmentInsightsScreen({
    super.key,
    required this.childId,
  });

  @override
  State<DevelopmentInsightsScreen> createState() =>
      _DevelopmentInsightsScreenState();
}

class _DevelopmentInsightsScreenState extends State<DevelopmentInsightsScreen> {
  bool _isLoading = true;
  ChildProfile? _child;
  List<AnalysisResult> _analyses = [];
  AnalysisResult? _latestAnalysis;

  // Time filter
  int _selectedFilterIndex = 0;
  static const _filterLabels = ['1 Week', '1 Month', '3 Months', 'All Time'];
  static const _filterDays = [7, 30, 90, 36500];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getChild(widget.childId);
    final analyses = await storage.getAnalyses(widget.childId);

    setState(() {
      _child = child;
      _analyses = analyses;
      _latestAnalysis = analyses.isNotEmpty ? analyses.first : null;
      _isLoading = false;
    });
  }

  List<AnalysisResult> get _filteredAnalyses {
    final cutoff = DateTime.now().subtract(
      Duration(days: _filterDays[_selectedFilterIndex]),
    );
    return _analyses.where((a) => a.timestamp.isAfter(cutoff)).toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }

  // Compute trend percentage between latest and earliest in filtered range
  double _computeTrend() {
    final filtered = _filteredAnalyses;
    if (filtered.length < 2) return 0;
    final earliest = filtered.first.overallScore;
    final latest = filtered.last.overallScore;
    if (earliest == 0) return 0;
    return ((latest - earliest) / earliest * 100);
  }

  double _computeDomainTrend(DevelopmentDomain domain) {
    final filtered = _filteredAnalyses;
    if (filtered.length < 2) return 0;
    final getScore = (AnalysisResult a) {
      switch (domain) {
        case DevelopmentDomain.motor:
          return a.motorAssessment.score;
        case DevelopmentDomain.language:
          return a.languageAssessment.score;
        case DevelopmentDomain.cognitive:
          return a.cognitiveAssessment.score;
        case DevelopmentDomain.social:
          return a.socialAssessment.score;
        default:
          return a.overallScore;
      }
    };
    final earliest = getScore(filtered.first);
    final latest = getScore(filtered.last);
    if (earliest == 0) return 0;
    return ((latest - earliest) / earliest * 100);
  }

  int get _achievedCount {
    if (_latestAnalysis == null) return 0;
    int count = 0;
    for (final assessment in _latestAnalysis!.allAssessments) {
      count += assessment.achievedMilestones.length;
    }
    return count;
  }

  int get _upcomingCount {
    if (_latestAnalysis == null) return 0;
    int count = 0;
    for (final assessment in _latestAnalysis!.allAssessments) {
      count += assessment.upcomingMilestones.length;
    }
    return count;
  }

  int get _inProgressCount {
    // Milestones that are upcoming but within the current age window
    if (_child == null || _latestAnalysis == null) return 0;
    final ageMonths = _child!.ageInMonths;
    int count = 0;
    for (final assessment in _latestAnalysis!.allAssessments) {
      for (final m in assessment.upcomingMilestones) {
        if (m.minMonths <= ageMonths && m.maxMonths >= ageMonths) {
          count++;
        }
      }
    }
    return count;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF8B5CF6),
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
      backgroundColor: const Color(0xFF6366F1),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
        onPressed: () => Navigator.of(context).pop(),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.settings_rounded, color: Colors.white70),
          onPressed: () {},
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
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
                          Icons.insights_rounded,
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
                              'Development Insights',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Detailed analytics & growth trends',
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
          // Time filter pills
          _buildTimeFilterPills(),
          const SizedBox(height: 24),

          // Development Trend chart
          _buildDevelopmentTrendCard(),
          const SizedBox(height: 20),

          // Domain Detail Cards
          const Text(
            'Domain Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral800,
            ),
          ),
          const SizedBox(height: 12),
          ..._buildDomainDetailCards(),
          const SizedBox(height: 20),

          // Milestone Velocity
          _buildMilestoneVelocity(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildTimeFilterPills() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(_filterLabels.length, (index) {
          final isActive = index == _selectedFilterIndex;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _selectedFilterIndex = index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: isActive
                      ? const Color(0xFF8B5CF6)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isActive
                        ? const Color(0xFF8B5CF6)
                        : AppTheme.neutral300,
                    width: 1.5,
                  ),
                ),
                child: Text(
                  _filterLabels[index],
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isActive ? Colors.white : AppTheme.neutral600,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildDevelopmentTrendCard() {
    final filtered = _filteredAnalyses;
    final trend = _computeTrend();
    final trendPositive = trend >= 0;

    return StaggeredListAnimation(
      index: 0,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: AppTheme.softShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Development Trend',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                if (filtered.length >= 2)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: (trendPositive
                              ? AppTheme.success
                              : AppTheme.error)
                          .withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          trendPositive
                              ? Icons.trending_up_rounded
                              : Icons.trending_down_rounded,
                          size: 16,
                          color: trendPositive
                              ? AppTheme.success
                              : AppTheme.error,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${trendPositive ? "+" : ""}${trend.toStringAsFixed(0)}%',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: trendPositive
                                ? AppTheme.success
                                : AppTheme.error,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Multi-domain trend chart',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.neutral500,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 200,
              child: filtered.isEmpty
                  ? Center(
                      child: Text(
                        'No analysis data in this time period.\nRun an analysis to see trends!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.neutral400,
                        ),
                      ),
                    )
                  : _buildLineChart(filtered),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLineChart(List<AnalysisResult> data) {
    final spots = data.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.overallScore);
    }).toList();

    final dateLabels = data.map((a) {
      return DateFormat('M/d').format(a.timestamp);
    }).toList();

    return LineChart(
      LineChartData(
        minY: 0,
        maxY: 100,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 25,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: AppTheme.neutral200,
              strokeWidth: 1,
            );
          },
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: 25,
              reservedSize: 35,
              getTitlesWidget: (value, meta) {
                return Text(
                  value.toInt().toString(),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.neutral400,
                  ),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              interval: 1,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= dateLabels.length) {
                  return const SizedBox.shrink();
                }
                // Show at most 5 labels to avoid crowding
                if (dateLabels.length > 5 &&
                    idx % (dateLabels.length ~/ 5 + 1) != 0 &&
                    idx != dateLabels.length - 1) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    dateLabels[idx],
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppTheme.neutral400,
                    ),
                  ),
                );
              },
            ),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: const Color(0xFF8B5CF6),
            barWidth: 3,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: const Color(0xFF8B5CF6).withOpacity(0.1),
            ),
          ),
        ],
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (spots) {
              return spots.map((s) {
                return LineTooltipItem(
                  '${s.y.toStringAsFixed(0)}%',
                  const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                );
              }).toList();
            },
          ),
        ),
      ),
    );
  }

  List<Widget> _buildDomainDetailCards() {
    if (_latestAnalysis == null) {
      return [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppTheme.softShadow,
          ),
          child: const Center(
            child: Text(
              'Run an analysis to see domain details.',
              style: TextStyle(color: AppTheme.neutral400),
            ),
          ),
        ),
      ];
    }

    final domains = [
      _DomainInfo(
        name: 'Motor Skills',
        domain: DevelopmentDomain.motor,
        score: _latestAnalysis!.motorAssessment.score,
        status: _latestAnalysis!.motorAssessment.status,
        color: AppTheme.motorColor,
        icon: Icons.directions_run_rounded,
      ),
      _DomainInfo(
        name: 'Cognitive',
        domain: DevelopmentDomain.cognitive,
        score: _latestAnalysis!.cognitiveAssessment.score,
        status: _latestAnalysis!.cognitiveAssessment.status,
        color: AppTheme.secondaryPurple,
        icon: Icons.psychology_rounded,
      ),
      _DomainInfo(
        name: 'Language',
        domain: DevelopmentDomain.language,
        score: _latestAnalysis!.languageAssessment.score,
        status: _latestAnalysis!.languageAssessment.status,
        color: AppTheme.socialColor,
        icon: Icons.record_voice_over_rounded,
      ),
      _DomainInfo(
        name: 'Social-Emotional',
        domain: DevelopmentDomain.social,
        score: _latestAnalysis!.socialAssessment.score,
        status: _latestAnalysis!.socialAssessment.status,
        color: AppTheme.secondaryOrange,
        icon: Icons.favorite_rounded,
      ),
    ];

    return domains.asMap().entries.map((entry) {
      final i = entry.key;
      final d = entry.value;
      final trend = _computeDomainTrend(d.domain);
      final trendPositive = trend >= 0;

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: StaggeredListAnimation(
          index: i + 1,
          child: GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ImproveDomainScreen(
                    childId: widget.childId,
                    domain: d.domain.name,
                    domainTitle: d.name,
                    score: d.score.round(),
                    status: d.status,
                    primaryColor: d.color,
                    gradientEnd: d.color.withOpacity(0.7),
                    domainIcon: d.icon,
                  ),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: AppTheme.softShadow,
              ),
              child: Row(
                children: [
                  // Domain icon
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: d.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(d.icon, color: d.color, size: 24),
                  ),
                  const SizedBox(width: 14),

                  // Domain name + progress bar
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          d.name,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.neutral800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Progress bar
                        TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: d.score / 100),
                          duration: const Duration(milliseconds: 1000),
                          curve: Curves.easeOutCubic,
                          builder: (context, value, _) {
                            return Container(
                              height: 6,
                              decoration: BoxDecoration(
                                color: AppTheme.neutral200,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: FractionallySizedBox(
                                alignment: Alignment.centerLeft,
                                widthFactor: value.clamp(0.0, 1.0),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: d.color,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Score + trend
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${d.score.round()}',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: d.color,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            trend > 0.5
                                ? Icons.arrow_upward_rounded
                                : trend < -0.5
                                    ? Icons.arrow_downward_rounded
                                    : Icons.remove_rounded,
                            size: 14,
                            color: trend > 0.5
                                ? AppTheme.success
                                : trend < -0.5
                                    ? AppTheme.error
                                    : AppTheme.neutral400,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            '${trendPositive ? "+" : ""}${trend.toStringAsFixed(0)}%',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: trend > 0.5
                                  ? AppTheme.success
                                  : trend < -0.5
                                      ? AppTheme.error
                                      : AppTheme.neutral400,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(width: 4),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: AppTheme.neutral300,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }).toList();
  }

  Widget _buildMilestoneVelocity() {
    return StaggeredListAnimation(
      index: 5,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: AppTheme.softShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Milestone Velocity',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Progress overview',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.neutral500,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                _buildVelocityStat(
                  label: 'Achieved',
                  count: _achievedCount,
                  color: AppTheme.success,
                  icon: Icons.check_circle_rounded,
                ),
                const SizedBox(width: 12),
                _buildVelocityStat(
                  label: 'In Progress',
                  count: _inProgressCount,
                  color: AppTheme.warning,
                  icon: Icons.pending_rounded,
                ),
                const SizedBox(width: 12),
                _buildVelocityStat(
                  label: 'Upcoming',
                  count: _upcomingCount,
                  color: AppTheme.secondaryBlue,
                  icon: Icons.schedule_rounded,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVelocityStat({
    required String label,
    required int count,
    required Color color,
    required IconData icon,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            AnimatedCounter(
              value: count,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DomainInfo {
  final String name;
  final DevelopmentDomain domain;
  final double score;
  final String status;
  final Color color;
  final IconData icon;

  const _DomainInfo({
    required this.name,
    required this.domain,
    required this.score,
    required this.status,
    required this.color,
    required this.icon,
  });
}
