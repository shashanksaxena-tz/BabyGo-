import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';
import '../health/health_hub_screen.dart';
import 'generated_report_screen.dart';

/// Pediatrician Report screen -- provides a comprehensive development
/// assessment overview designed to be shared with a pediatrician.
///
/// Design: teal gradient header with stethoscope icon, report status card,
/// child info, development summary with domain scores, key findings,
/// and consult-a-doctor section.
class PediatricianReportScreen extends StatefulWidget {
  final String childId;

  const PediatricianReportScreen({
    super.key,
    required this.childId,
  });

  @override
  State<PediatricianReportScreen> createState() =>
      _PediatricianReportScreenState();
}

class _PediatricianReportScreenState extends State<PediatricianReportScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  ChildProfile? _child;
  AnalysisResult? _latestAnalysis;

  // Report data from API
  List<Map<String, dynamic>> _reports = [];
  Map<String, dynamic>? _latestReport;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final storage = StorageService();
      final child = await storage.getChild(widget.childId);
      AnalysisResult? latestAnalysis;

      if (child != null) {
        latestAnalysis = await storage.getLatestAnalysis(child.id);
      }

      setState(() {
        _child = child;
        _latestAnalysis = latestAnalysis;
      });

      // Fetch existing reports
      await _fetchReports();
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Could not load data. Please try again.';
        });
      }
    }
  }

  Future<void> _fetchReports() async {
    try {
      final result = await ApiService().getReports(widget.childId);

      if (!mounted) return;

      if (result['success'] == true) {
        final data = result['data'];
        List<dynamic> rawReports = [];

        if (data is Map<String, dynamic>) {
          rawReports = data['reports'] is List ? data['reports'] : [];
        } else if (data is List) {
          rawReports = data;
        }

        final reports = rawReports
            .map((r) => r is Map<String, dynamic> ? r : <String, dynamic>{})
            .where((r) => r.isNotEmpty)
            .toList();

        setState(() {
          _reports = reports;
          _latestReport = reports.isNotEmpty ? reports.first : null;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
          // Not treating failed report fetch as a blocking error
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _navigateToGenerateReport() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => GeneratedReportScreen(childId: widget.childId),
      ),
    ).then((_) {
      // Refresh reports when returning
      _fetchReports();
    });
  }

  // ---------------------------------------------------------------------------
  // Domain helpers
  // ---------------------------------------------------------------------------

  Color _domainColor(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return const Color(0xFF3B82F6);
      case DevelopmentDomain.cognitive:
        return const Color(0xFF8B5CF6);
      case DevelopmentDomain.language:
        return const Color(0xFFEC4899);
      case DevelopmentDomain.social:
        return const Color(0xFFF59E0B);
      case DevelopmentDomain.sensory:
        return AppTheme.primaryGreen;
    }
  }

  IconData _domainIcon(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return Icons.directions_run_rounded;
      case DevelopmentDomain.cognitive:
        return Icons.lightbulb_rounded;
      case DevelopmentDomain.language:
        return Icons.record_voice_over_rounded;
      case DevelopmentDomain.social:
        return Icons.people_rounded;
      case DevelopmentDomain.sensory:
        return Icons.touch_app_rounded;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'on_track':
        return 'On Track';
      case 'emerging':
        return 'Emerging';
      case 'needs_support':
        return 'Needs Support';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
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

  IconData _findingIcon(String status) {
    switch (status) {
      case 'on_track':
        return Icons.check_circle_rounded;
      case 'emerging':
        return Icons.warning_amber_rounded;
      case 'needs_support':
        return Icons.error_outline_rounded;
      default:
        return Icons.info_outline_rounded;
    }
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
  // HEADER (teal gradient)
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
              // Top row: back + share
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _headerIconButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  _headerIconButton(
                    icon: Icons.share_rounded,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Generate a report first to share it',
                            style:
                                GoogleFonts.nunito(fontWeight: FontWeight.w600),
                          ),
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: AppTheme.primaryGreen,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    },
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
                    child: const Icon(
                      Icons.medical_services_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pediatrician Report',
                          style: GoogleFonts.nunito(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Comprehensive development assessment',
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _headerIconButton(
      {required IconData icon, required VoidCallback onTap}) {
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
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // Report status card
          StaggeredListAnimation(index: 0, child: _buildReportStatusCard()),
          const SizedBox(height: 16),

          // Child info card
          StaggeredListAnimation(index: 1, child: _buildChildInfoCard()),
          const SizedBox(height: 16),

          // Generate report button
          StaggeredListAnimation(
              index: 2, child: _buildGenerateReportButton()),
          const SizedBox(height: 24),

          // Development summary (only if analysis exists)
          if (_latestAnalysis != null) ...[
            StaggeredListAnimation(
                index: 3, child: _buildDevelopmentSummary()),
            const SizedBox(height: 24),

            // Key findings
            StaggeredListAnimation(index: 4, child: _buildKeyFindings()),
            const SizedBox(height: 24),
          ],

          // Consult a doctor section
          StaggeredListAnimation(
              index: 5, child: _buildConsultDoctorSection()),
          const SizedBox(height: 16),

          // Schedule visit card
          StaggeredListAnimation(index: 6, child: _buildScheduleVisitCard()),
          const SizedBox(height: 16),

          // Disclaimer
          _buildDisclaimer(),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // REPORT STATUS CARD
  // ---------------------------------------------------------------------------

  Widget _buildReportStatusCard() {
    final bool hasReport = _latestReport != null;
    final String reportDate = hasReport
        ? _formatDate(_latestReport!['createdAt']?.toString() ??
            _latestReport!['generatedAt']?.toString())
        : '';

    return Container(
      padding: const EdgeInsets.all(16),
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
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: hasReport ? AppTheme.success : AppTheme.neutral400,
              boxShadow: hasReport
                  ? [
                      BoxShadow(
                        color: AppTheme.success.withOpacity(0.4),
                        blurRadius: 6,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hasReport ? 'Report Ready' : 'No Report Yet',
                  style: GoogleFonts.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                if (hasReport)
                  Text(
                    'Generated $reportDate',
                    style: GoogleFonts.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.neutral500,
                    ),
                  ),
                if (!hasReport)
                  Text(
                    'Generate a report to share with your pediatrician',
                    style: GoogleFonts.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.neutral500,
                    ),
                  ),
              ],
            ),
          ),
          if (hasReport)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppTheme.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${_reports.length} report${_reports.length == 1 ? '' : 's'}',
                style: GoogleFonts.nunito(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.success,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // CHILD INFO CARD
  // ---------------------------------------------------------------------------

  Widget _buildChildInfoCard() {
    final child = _child;
    if (child == null) return const SizedBox.shrink();

    final dateFormat = DateFormat('MMM d, yyyy');
    final birthDateStr = dateFormat.format(child.dateOfBirth);

    return Container(
      padding: const EdgeInsets.all(16),
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
          // Avatar
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  AppTheme.primaryGreen,
                  AppTheme.primaryGreen.withOpacity(0.7),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Center(
              child: Text(
                child.name.isNotEmpty ? child.name[0].toUpperCase() : 'C',
                style: GoogleFonts.nunito(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  child.displayName,
                  style: GoogleFonts.nunito(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${child.displayAge} old  \u2022  Born $birthDateStr',
                  style: GoogleFonts.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // GENERATE REPORT BUTTON
  // ---------------------------------------------------------------------------

  Widget _buildGenerateReportButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _navigateToGenerateReport,
        icon: const Icon(Icons.description_rounded, size: 20),
        label: Text(
          'Generate New Report',
          style: GoogleFonts.nunito(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryGreen,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // DEVELOPMENT SUMMARY CARD
  // ---------------------------------------------------------------------------

  Widget _buildDevelopmentSummary() {
    final analysis = _latestAnalysis!;
    final overallScore = analysis.overallScore.round();

    final domains = [
      analysis.motorAssessment,
      analysis.cognitiveAssessment,
      analysis.languageAssessment,
      analysis.socialAssessment,
    ];

    return Container(
      padding: const EdgeInsets.all(20),
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
          Text(
            'Development Summary',
            style: GoogleFonts.nunito(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral800,
            ),
          ),
          const SizedBox(height: 16),

          // Overall score row
          Row(
            children: [
              Text(
                'Overall Development Score',
                style: GoogleFonts.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral600,
                ),
              ),
              const Spacer(),
              Text(
                '$overallScore',
                style: GoogleFonts.nunito(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: _statusColor(analysis.overallStatus),
                ),
              ),
              Text(
                '/100',
                style: GoogleFonts.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral400,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Domain rows
          ...domains.map((domain) => _buildDomainRow(domain)),
        ],
      ),
    );
  }

  Widget _buildDomainRow(DomainAssessment assessment) {
    final color = _domainColor(assessment.domain);
    final score = assessment.score.round();

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          // Domain icon
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(_domainIcon(assessment.domain), color: color, size: 18),
          ),
          const SizedBox(width: 12),

          // Domain name
          Expanded(
            flex: 3,
            child: Text(
              assessment.domainName,
              style: GoogleFonts.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral700,
              ),
            ),
          ),

          // Score
          SizedBox(
            width: 40,
            child: Text(
              '$score',
              textAlign: TextAlign.right,
              style: GoogleFonts.nunito(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Progress bar
          Expanded(
            flex: 4,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: score / 100,
                minHeight: 8,
                backgroundColor: color.withOpacity(0.12),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // KEY FINDINGS
  // ---------------------------------------------------------------------------

  Widget _buildKeyFindings() {
    final analysis = _latestAnalysis!;
    final findings = <_Finding>[];

    // Gather findings from all domains
    for (final domain in analysis.allAssessments) {
      // Strengths as positive findings
      for (final strength in domain.strengths.take(1)) {
        findings.add(_Finding(
          text: strength,
          status: 'on_track',
          domain: domain.domainName,
        ));
      }

      // Areas to support as watch/concern findings
      for (final area in domain.areasToSupport.take(1)) {
        findings.add(_Finding(
          text: area,
          status: domain.status,
          domain: domain.domainName,
        ));
      }
    }

    // Also add observations if we don't have enough findings
    if (findings.length < 4) {
      for (final domain in analysis.allAssessments) {
        for (final obs in domain.observations.take(1)) {
          if (findings.length >= 6) break;
          findings.add(_Finding(
            text: obs,
            status: domain.status,
            domain: domain.domainName,
          ));
        }
      }
    }

    return Container(
      padding: const EdgeInsets.all(20),
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
          Text(
            'Key Findings for Doctor',
            style: GoogleFonts.nunito(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral800,
            ),
          ),
          const SizedBox(height: 14),

          ...findings.map((f) => _buildFindingRow(f)),

          if (findings.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'No findings available yet. Run a development analysis first.',
                style: GoogleFonts.nunito(
                  fontSize: 14,
                  color: AppTheme.neutral500,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFindingRow(_Finding finding) {
    final color = _statusColor(finding.status);
    final icon = _findingIcon(finding.status);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  finding.text,
                  style: GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral700,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${finding.domain} \u2022 ${_statusLabel(finding.status)}',
                  style: GoogleFonts.nunito(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // CONSULT A DOCTOR SECTION
  // ---------------------------------------------------------------------------

  Widget _buildConsultDoctorSection() {
    return Container(
      padding: const EdgeInsets.all(20),
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
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.local_hospital_rounded,
                  color: Color(0xFFEF4444),
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Consult a Doctor',
                      style: GoogleFonts.nunito(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.neutral800,
                      ),
                    ),
                    Text(
                      'Share this report with a specialist',
                      style: GoogleFonts.nunito(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.neutral500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Two buttons side by side
          Row(
            children: [
              // Send Report button (outlined)
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    if (_latestReport != null) {
                      final reportId =
                          _latestReport!['_id']?.toString() ??
                              _latestReport!['id']?.toString() ??
                              '';
                      ApiService().shareReport(
                        widget.childId,
                        reportId,
                        'email',
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Report sharing initiated',
                            style: GoogleFonts.nunito(
                                fontWeight: FontWeight.w600),
                          ),
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: AppTheme.primaryGreen,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Generate a report first',
                            style: GoogleFonts.nunito(
                                fontWeight: FontWeight.w600),
                          ),
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: AppTheme.warning,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.send_rounded, size: 18),
                  label: Text(
                    'Send Report',
                    style: GoogleFonts.nunito(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryGreen,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    side: const BorderSide(
                        color: AppTheme.primaryGreen, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Find Specialists button (filled)
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const HealthHubScreen()),
                    );
                  },
                  icon: const Icon(Icons.search_rounded, size: 18),
                  label: Text(
                    'Find Specialists',
                    style: GoogleFonts.nunito(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SCHEDULE VISIT CARD
  // ---------------------------------------------------------------------------

  Widget _buildScheduleVisitCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFFF0FDF4),
            const Color(0xFFECFDF5),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primaryGreen.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.calendar_today_rounded,
              color: AppTheme.primaryGreen,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Schedule a Visit',
                  style: GoogleFonts.nunito(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Regular check-ups help track your child\'s development',
                  style: GoogleFonts.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral500,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right_rounded,
            color: AppTheme.neutral300,
            size: 24,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // DISCLAIMER
  // ---------------------------------------------------------------------------

  Widget _buildDisclaimer() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Text(
        'This report is for informational purposes only and does not '
        'constitute medical advice. Always consult with a qualified '
        'healthcare provider for medical decisions regarding your child.',
        textAlign: TextAlign.center,
        style: GoogleFonts.nunito(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: AppTheme.neutral400,
          height: 1.5,
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
          margin: const EdgeInsets.only(bottom: 14),
          height: index == 2 ? 200 : 80,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: _shimmerPlaceholder(index == 2 ? 200 : 80),
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

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }
}

// =============================================================================
// Data model for findings
// =============================================================================

class _Finding {
  final String text;
  final String status;
  final String domain;

  const _Finding({
    required this.text,
    required this.status,
    required this.domain,
  });
}
