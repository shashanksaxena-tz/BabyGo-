import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

class AnalysisResultsScreen extends StatefulWidget {
  final ChildProfile child;
  final AnalysisResult result;

  const AnalysisResultsScreen({
    super.key,
    required this.child,
    required this.result,
  });

  @override
  State<AnalysisResultsScreen> createState() => _AnalysisResultsScreenState();
}

class _AnalysisResultsScreenState extends State<AnalysisResultsScreen> {
  int? _expandedDomain;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              _buildHeader(),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Score Card
                      StaggeredListAnimation(
                        index: 0,
                        child: _buildScoreCard(),
                      ),
                      const SizedBox(height: 20),

                      // Summary
                      StaggeredListAnimation(
                        index: 1,
                        child: _buildSummaryCard(),
                      ),
                      const SizedBox(height: 24),

                      // Domain Assessments
                      const Text(
                        'Development Areas',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.neutral800,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ...widget.result.allAssessments.asMap().entries.map(
                        (entry) => StaggeredListAnimation(
                          index: entry.key + 2,
                          child: _buildDomainCard(entry.value, entry.key),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Personalized Tips
                      if (widget.result.personalizedTips.isNotEmpty)
                        StaggeredListAnimation(
                          index: 6,
                          child: _buildTipsCard(),
                        ),

                      const SizedBox(height: 24),

                      // Sources
                      StaggeredListAnimation(
                        index: 7,
                        child: _buildSourcesCard(),
                      ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            onPressed: () {
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            icon: const Icon(Icons.close_rounded),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.neutral100,
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
                  'Analysis Results',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral900,
                  ),
                ),
                Text(
                  '${widget.child.displayName} - ${widget.child.displayAge}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              // Share functionality
            },
            icon: const Icon(Icons.share_rounded),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.neutral100,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreCard() {
    final score = widget.result.overallScore;
    final status = widget.result.overallStatus;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryGreen.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Overall Development',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    AnimatedCounter(
                      value: score.round(),
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 8, left: 4),
                      child: Text(
                        '/100',
                        style: TextStyle(
                          fontSize: 20,
                          color: Colors.white70,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _getStatusIcon(status),
                        color: Colors.white,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _getStatusLabel(status),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          AnimatedProgressRing(
            progress: score / 100,
            size: 100,
            strokeWidth: 10,
            backgroundColor: Colors.white24,
            progressColor: Colors.white,
            duration: const Duration(milliseconds: 1500),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _getStatusEmoji(status),
                  style: const TextStyle(fontSize: 32),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.auto_awesome_rounded,
                  color: AppTheme.primaryGreen, size: 20),
              SizedBox(width: 8),
              Text(
                'AI Summary',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            widget.result.summary,
            style: const TextStyle(
              fontSize: 15,
              color: AppTheme.neutral600,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDomainCard(DomainAssessment assessment, int index) {
    final isExpanded = _expandedDomain == index;
    final color = _getDomainColor(assessment.domain);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isExpanded ? AppTheme.mediumShadow : AppTheme.softShadow,
          border: isExpanded
              ? Border.all(color: color.withOpacity(0.3), width: 2)
              : null,
        ),
        child: Column(
          children: [
            // Header (always visible)
            GestureDetector(
              onTap: () {
                setState(() {
                  _expandedDomain = isExpanded ? null : index;
                });
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        _getDomainIcon(assessment.domain),
                        color: color,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            assessment.domainName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.neutral800,
                            ),
                          ),
                          Text(
                            _getStatusLabel(assessment.status),
                            style: TextStyle(
                              fontSize: 13,
                              color: _getStatusColor(assessment.status),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${assessment.score.round()}%',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: color,
                      ),
                    ),
                    const SizedBox(width: 8),
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 300),
                      child: Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: AppTheme.neutral400,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Expanded content
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: _buildExpandedContent(assessment, color),
              crossFadeState: isExpanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 300),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpandedContent(DomainAssessment assessment, Color color) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(),
          const SizedBox(height: 12),

          // Observations
          if (assessment.observations.isNotEmpty) ...[
            _buildSubsection('Observations', assessment.observations, color),
            const SizedBox(height: 16),
          ],

          // Strengths
          if (assessment.strengths.isNotEmpty) ...[
            _buildSubsection('Strengths', assessment.strengths, AppTheme.success),
            const SizedBox(height: 16),
          ],

          // Areas to support
          if (assessment.areasToSupport.isNotEmpty) ...[
            _buildSubsection(
              'Areas to Support',
              assessment.areasToSupport,
              AppTheme.warning,
            ),
            const SizedBox(height: 16),
          ],

          // Recommended Activities
          if (assessment.activities.isNotEmpty) ...[
            const Text(
              'Recommended Activities',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral700,
              ),
            ),
            const SizedBox(height: 8),
            ...assessment.activities.map((activity) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.play_circle_filled, color: color, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        activity,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.neutral700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildSubsection(String title, List<String> items, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral700,
          ),
        ),
        const SizedBox(height: 8),
        ...items.map((item) => Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 6,
                height: 6,
                margin: const EdgeInsets.only(top: 6),
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  item,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral600,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildTipsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_rounded, color: AppTheme.secondaryOrange),
              SizedBox(width: 8),
              Text(
                'Personalized Tips',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...widget.result.personalizedTips.asMap().entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppTheme.secondaryOrange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        '${entry.key + 1}',
                        style: const TextStyle(
                          color: AppTheme.secondaryOrange,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      entry.value,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppTheme.neutral600,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSourcesCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.menu_book_rounded, color: AppTheme.secondaryBlue),
              SizedBox(width: 8),
              Text(
                'WHO Sources',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'This analysis is based on WHO developmental milestones and growth standards.',
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.neutral500,
            ),
          ),
          const SizedBox(height: 16),
          ...widget.result.allSources.take(4).map((source) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GestureDetector(
                onTap: () async {
                  final uri = Uri.parse(source.url);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.secondaryBlue.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.link_rounded,
                        color: AppTheme.secondaryBlue,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          source.title,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.secondaryBlue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.open_in_new_rounded,
                        color: AppTheme.secondaryBlue,
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // Helper methods
  Color _getDomainColor(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return AppTheme.motorColor;
      case DevelopmentDomain.language:
        return AppTheme.languageColor;
      case DevelopmentDomain.cognitive:
        return AppTheme.cognitiveColor;
      case DevelopmentDomain.social:
        return AppTheme.socialColor;
    }
  }

  IconData _getDomainIcon(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return Icons.directions_run_rounded;
      case DevelopmentDomain.language:
        return Icons.record_voice_over_rounded;
      case DevelopmentDomain.cognitive:
        return Icons.psychology_rounded;
      case DevelopmentDomain.social:
        return Icons.favorite_rounded;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'on_track':
        return Icons.check_circle_rounded;
      case 'emerging':
        return Icons.trending_up_rounded;
      case 'needs_support':
        return Icons.info_rounded;
      default:
        return Icons.help_rounded;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'on_track':
        return 'On Track';
      case 'emerging':
        return 'Emerging';
      case 'needs_support':
        return 'Needs Support';
      default:
        return 'Unknown';
    }
  }

  String _getStatusEmoji(String status) {
    switch (status) {
      case 'on_track':
        return '🌟';
      case 'emerging':
        return '🌱';
      case 'needs_support':
        return '💪';
      default:
        return '❓';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'on_track':
        return AppTheme.success;
      case 'emerging':
        return AppTheme.warning;
      case 'needs_support':
        return AppTheme.error;
      default:
        return AppTheme.neutral500;
    }
  }
}
