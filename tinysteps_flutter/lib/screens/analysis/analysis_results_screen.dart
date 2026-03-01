import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../widgets/bottom_nav_bar.dart';
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
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: Column(
        children: [
          // Scrollable content (header + body)
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Full-bleed green gradient header with score
                  _buildGreenHeader(),
                  const SizedBox(height: 20),

                  // Domain score bars
                  _buildDomainBreakdown(),
                  const SizedBox(height: 20),

                  // Key Observations
                  _buildObservationsSection(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Bottom nav
          BottomNavBar(
            currentIndex: 0,
            onTap: (index) {
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildGreenHeader() {
    final score = widget.result.overallScore.round();
    final dateStr = DateFormat('MMM d, yyyy').format(widget.result.timestamp);

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            children: [
              // AppBar row
              SizedBox(
                height: 48,
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      },
                      child: const Icon(
                        Icons.arrow_back_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Analysis Results',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        // Share functionality
                      },
                      child: const Icon(
                        Icons.share_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Avatar
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(color: Colors.white, width: 3),
                  color: Colors.white.withOpacity(0.3),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(37),
                  child: Image.asset(
                    'assets/images/leo_avatar.png',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Center(
                      child: Text(
                        '\u{1F476}',
                        style: TextStyle(fontSize: 36),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),

              // "Overall Development Score"
              Text(
                'Overall Development Score',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
              const SizedBox(height: 6),

              // Score row: "87 /100"
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  AnimatedCounter(
                    value: score,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 48,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      '/100',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(0.67),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),

              // "Great Progress!"
              Text(
                _getStatusMessage(widget.result.overallStatus),
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),

              // Date
              Text(
                dateStr,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withOpacity(0.67),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 500.ms);
  }

  Widget _buildDomainBreakdown() {
    final assessments = widget.result.allAssessments;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: assessments.asMap().entries.map((entry) {
          final index = entry.key;
          final assessment = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _buildDomainScoreBar(assessment)
                .animate()
                .fadeIn(delay: (100 + index * 80).ms, duration: 400.ms)
                .slideX(begin: 0.1, end: 0),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDomainScoreBar(DomainAssessment assessment) {
    final color = _getDomainColor(assessment.domain);
    final icon = _getDomainIcon(assessment.domain);
    final name = _getDomainShortName(assessment.domain);
    final score = assessment.score.round();

    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0x0A000000),
            blurRadius: 8,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left color bar
          Container(
            width: 4,
            decoration: BoxDecoration(
              color: color,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(14),
                bottomLeft: Radius.circular(14),
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Domain icon
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 14),
          // Domain name
          Text(
            name,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(width: 14),
          // Progress bar
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppTheme.borderLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: score / 100),
                      duration: const Duration(milliseconds: 1200),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, _) {
                        return Container(
                          width: constraints.maxWidth * value,
                          height: 8,
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: 14),
          // Score number
          SizedBox(
            width: 30,
            child: Text(
              '$score',
              textAlign: TextAlign.right,
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }

  Widget _buildObservationsSection() {
    // Collect key observations from all assessments
    final observations = <Map<String, String>>[];

    for (final assessment in widget.result.allAssessments) {
      if (assessment.strengths.isNotEmpty) {
        observations.add({
          'emoji': _getDomainEmoji(assessment.domain),
          'title': '${assessment.domainName} Strength',
          'desc': assessment.strengths.first,
        });
      }
      if (assessment.observations.isNotEmpty) {
        observations.add({
          'emoji': _getDomainEmoji(assessment.domain),
          'title': '${_getDomainShortName(assessment.domain)} Observation',
          'desc': assessment.observations.first,
        });
      }
    }

    // Limit to 3-4 observations
    final displayObs = observations.take(4).toList();
    if (displayObs.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Key Observations',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ...displayObs.asMap().entries.map((entry) {
            final index = entry.key;
            final obs = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildObservationCard(
                obs['emoji']!,
                obs['title']!,
                obs['desc']!,
              ).animate()
                  .fadeIn(delay: (400 + index * 100).ms, duration: 400.ms)
                  .slideY(begin: 0.1, end: 0),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildObservationCard(String emoji, String title, String description) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0x0A000000),
            blurRadius: 8,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            emoji,
            style: const TextStyle(fontSize: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
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
      case DevelopmentDomain.sensory:
        return AppTheme.secondaryPurple;
    }
  }

  IconData _getDomainIcon(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return Icons.directions_bike_rounded;
      case DevelopmentDomain.language:
        return Icons.chat_bubble_rounded;
      case DevelopmentDomain.cognitive:
        return Icons.psychology_rounded;
      case DevelopmentDomain.social:
        return Icons.handshake_rounded;
      case DevelopmentDomain.sensory:
        return Icons.touch_app_rounded;
    }
  }

  String _getDomainShortName(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return 'Motor';
      case DevelopmentDomain.language:
        return 'Language';
      case DevelopmentDomain.cognitive:
        return 'Cognitive';
      case DevelopmentDomain.social:
        return 'Social';
      case DevelopmentDomain.sensory:
        return 'Sensory';
    }
  }

  String _getDomainEmoji(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return '\u{1F3C3}';
      case DevelopmentDomain.language:
        return '\u{1F4AC}';
      case DevelopmentDomain.cognitive:
        return '\u{1F9E0}';
      case DevelopmentDomain.social:
        return '\u{1F91D}';
      case DevelopmentDomain.sensory:
        return '\u{2728}';
    }
  }

  String _getStatusMessage(String status) {
    switch (status) {
      case 'on_track':
        return 'Great Progress!';
      case 'emerging':
        return 'Growing Well!';
      case 'needs_support':
        return 'Keep Going!';
      default:
        return 'Great Progress!';
    }
  }
}
