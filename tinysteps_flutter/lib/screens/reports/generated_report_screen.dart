import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

/// Generated Report screen -- displays a fully generated developmental
/// report for a child, with domain assessments, recommendations, and
/// export/share functionality.
///
/// Design: teal gradient header with share/download, report metadata,
/// patient info, overall assessment with score, domain assessment details,
/// recommendations, and export buttons.
class GeneratedReportScreen extends StatefulWidget {
  final String childId;

  const GeneratedReportScreen({
    super.key,
    required this.childId,
  });

  @override
  State<GeneratedReportScreen> createState() => _GeneratedReportScreenState();
}

class _GeneratedReportScreenState extends State<GeneratedReportScreen> {
  bool _isLoading = true;
  bool _isExporting = false;
  String? _errorMessage;
  ChildProfile? _child;

  // Generated report data
  Map<String, dynamic>? _report;
  String _reportId = '';
  String _reportNumber = '';

  @override
  void initState() {
    super.initState();
    _generateReport();
  }

  Future<void> _generateReport() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Load child profile
      final storage = StorageService();
      final child = await storage.getChild(widget.childId);
      setState(() => _child = child);

      // Generate the report via API
      final result = await ApiService().generateReport(widget.childId);

      if (!mounted) return;

      if (result['success'] == true) {
        final data = result['data'];
        Map<String, dynamic> report;

        if (data is Map<String, dynamic>) {
          report = data['report'] is Map<String, dynamic>
              ? data['report'] as Map<String, dynamic>
              : data;
        } else {
          report = {};
        }

        final id = report['_id']?.toString() ??
            report['id']?.toString() ??
            '';
        final year = DateTime.now().year;
        final seq = id.length >= 4 ? id.substring(id.length - 4).toUpperCase() : id.toUpperCase();

        setState(() {
          _report = report;
          _reportId = id;
          _reportNumber = 'RPT-$year-$seq';
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              result['error']?.toString() ?? 'Failed to generate report';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not generate report. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Export / Share
  // ---------------------------------------------------------------------------

  Future<void> _exportPdf() async {
    if (_reportId.isEmpty) return;

    setState(() => _isExporting = true);

    try {
      final result =
          await ApiService().getReportPdf(widget.childId, _reportId);

      if (!mounted) return;

      if (result['success'] == true) {
        final data = result['data'];
        Uint8List? pdfBytes;

        if (data is Map<String, dynamic> && data['pdf'] != null) {
          // Base64-encoded PDF
          pdfBytes = base64Decode(data['pdf'].toString());
        }

        if (pdfBytes != null) {
          final dir = await getApplicationDocumentsDirectory();
          final file =
              File('${dir.path}/tinysteps_report_$_reportId.pdf');
          await file.writeAsBytes(pdfBytes);

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'PDF saved to ${file.path}',
                  style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
                ),
                behavior: SnackBarBehavior.floating,
                backgroundColor: AppTheme.primaryGreen,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            );
          }
        } else {
          _showExportSnackbar('PDF export requested. Check your downloads.');
        }
      } else {
        _showExportSnackbar('Could not export PDF. Please try again.');
      }
    } catch (e) {
      _showExportSnackbar('Export failed. Please try again.');
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _sendToDoctor() async {
    if (_reportId.isEmpty) return;

    setState(() => _isExporting = true);

    try {
      final result =
          await ApiService().getReportPdf(widget.childId, _reportId);

      if (!mounted) return;

      if (result['success'] == true) {
        final data = result['data'];
        Uint8List? pdfBytes;

        if (data is Map<String, dynamic> && data['pdf'] != null) {
          pdfBytes = base64Decode(data['pdf'].toString());
        }

        if (pdfBytes != null) {
          final dir = await getTemporaryDirectory();
          final file =
              File('${dir.path}/tinysteps_report_$_reportId.pdf');
          await file.writeAsBytes(pdfBytes);

          await Share.shareXFiles(
            [XFile(file.path)],
            subject: 'TinySteps Development Report - ${_child?.displayName ?? "Child"}',
            text:
                'Attached is the developmental assessment report for ${_child?.displayName ?? "my child"} generated by TinySteps AI.',
          );
        } else {
          // Fallback: share report summary as text
          final summary = _report?['summary']?.toString() ??
              _report?['overallAssessment']?['summary']?.toString() ??
              'Development report generated.';
          await Share.share(
            'TinySteps Development Report ($_reportNumber)\n\n$summary\n\nGenerated by TinySteps AI',
            subject: 'TinySteps Development Report',
          );
        }
      } else {
        // Fallback text share
        await Share.share(
          'TinySteps Development Report ($_reportNumber)\n\nPlease view the full report in the TinySteps app.',
          subject: 'TinySteps Development Report',
        );
      }
    } catch (e) {
      _showExportSnackbar('Could not share report. Please try again.');
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  void _showExportSnackbar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
        ),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.neutral700,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Data extraction helpers
  // ---------------------------------------------------------------------------

  double _getOverallScore() {
    if (_report == null) return 0;
    final oa = _report!['overallAssessment'];
    if (oa is Map<String, dynamic>) {
      return (oa['score'] ?? oa['overallScore'] ?? 0).toDouble();
    }
    return (_report!['overallScore'] ?? 0).toDouble();
  }

  String _getOverallStatus() {
    if (_report == null) return 'on_track';
    final oa = _report!['overallAssessment'];
    if (oa is Map<String, dynamic>) {
      return oa['status']?.toString() ?? oa['overallStatus']?.toString() ?? 'on_track';
    }
    return _report!['overallStatus']?.toString() ?? 'on_track';
  }

  String _getOverallSummary() {
    if (_report == null) return '';
    final oa = _report!['overallAssessment'];
    if (oa is Map<String, dynamic>) {
      return oa['summary']?.toString() ?? '';
    }
    return _report!['summary']?.toString() ?? '';
  }

  List<Map<String, dynamic>> _getDomainAssessments() {
    if (_report == null) return [];
    final domains = _report!['domainAssessments'] ??
        _report!['domains'] ??
        _report!['assessments'];
    if (domains is List) {
      return domains
          .map((d) => d is Map<String, dynamic> ? d : <String, dynamic>{})
          .where((d) => d.isNotEmpty)
          .toList();
    }
    return [];
  }

  List<String> _getRecommendations() {
    if (_report == null) return [];
    final recs = _report!['recommendations'];
    if (recs is List) {
      return recs.map((r) => r.toString()).toList();
    }
    return [];
  }

  String _getReportDate() {
    if (_report == null) return DateFormat('MMM d, yyyy').format(DateTime.now());
    final dateStr = _report!['createdAt']?.toString() ??
        _report!['generatedAt']?.toString() ??
        _report!['date']?.toString();
    if (dateStr != null && dateStr.isNotEmpty) {
      try {
        return DateFormat('MMM d, yyyy').format(DateTime.parse(dateStr));
      } catch (_) {
        return dateStr;
      }
    }
    return DateFormat('MMM d, yyyy').format(DateTime.now());
  }

  // ---------------------------------------------------------------------------
  // Domain helpers
  // ---------------------------------------------------------------------------

  Color _domainColor(String domain) {
    switch (domain.toLowerCase()) {
      case 'motor':
        return const Color(0xFF3B82F6);
      case 'cognitive':
        return const Color(0xFF8B5CF6);
      case 'language':
        return const Color(0xFFEC4899);
      case 'social':
        return const Color(0xFFF59E0B);
      default:
        return AppTheme.primaryGreen;
    }
  }

  IconData _domainIcon(String domain) {
    switch (domain.toLowerCase()) {
      case 'motor':
        return Icons.directions_run_rounded;
      case 'cognitive':
        return Icons.lightbulb_rounded;
      case 'language':
        return Icons.record_voice_over_rounded;
      case 'social':
        return Icons.people_rounded;
      default:
        return Icons.auto_awesome_rounded;
    }
  }

  String _domainLabel(String domain) {
    switch (domain.toLowerCase()) {
      case 'motor':
        return 'Motor Skills';
      case 'cognitive':
        return 'Cognitive';
      case 'language':
        return 'Language';
      case 'social':
        return 'Social-Emotional';
      default:
        return _capitalize(domain);
    }
  }

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'on_track':
        return 'On Track';
      case 'emerging':
        return 'Watch';
      case 'needs_support':
        return 'Needs Support';
      default:
        return _capitalize(status);
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
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

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
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
              // Top row: back + share + download
              Row(
                children: [
                  _headerIconButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  const Spacer(),
                  _headerIconButton(
                    icon: Icons.share_rounded,
                    onTap: _isLoading ? () {} : _sendToDoctor,
                  ),
                  const SizedBox(width: 10),
                  _headerIconButton(
                    icon: Icons.download_rounded,
                    onTap: _isLoading ? () {} : _exportPdf,
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
                      Icons.assignment_rounded,
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
                          'Development Report',
                          style: GoogleFonts.nunito(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Comprehensive Pediatric Assessment',
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
    final domains = _getDomainAssessments();
    final recommendations = _getRecommendations();
    final overallScore = _getOverallScore();
    final overallStatus = _getOverallStatus();
    final summary = _getOverallSummary();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        // Report metadata row
        StaggeredListAnimation(index: 0, child: _buildMetadataRow()),
        const SizedBox(height: 16),

        // Patient info card
        StaggeredListAnimation(index: 1, child: _buildPatientInfoCard()),
        const SizedBox(height: 16),

        // Overall assessment card
        StaggeredListAnimation(
          index: 2,
          child: _buildOverallAssessmentCard(
              overallScore, overallStatus, summary),
        ),
        const SizedBox(height: 24),

        // Domain assessments
        if (domains.isNotEmpty) ...[
          Text(
            'Domain Assessment Details',
            style: GoogleFonts.nunito(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral800,
            ),
          ),
          const SizedBox(height: 14),
          ...domains.asMap().entries.map(
                (entry) => StaggeredListAnimation(
                  index: entry.key + 3,
                  child: _buildDomainCard(entry.value),
                ),
              ),
          const SizedBox(height: 12),
        ],

        // Recommendations
        if (recommendations.isNotEmpty) ...[
          StaggeredListAnimation(
            index: domains.length + 3,
            child: _buildRecommendationsCard(recommendations),
          ),
          const SizedBox(height: 24),
        ],

        // Action buttons
        StaggeredListAnimation(
          index: domains.length + 4,
          child: _buildActionButtons(),
        ),
        const SizedBox(height: 20),

        // Disclaimer
        _buildDisclaimer(),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // REPORT METADATA ROW
  // ---------------------------------------------------------------------------

  Widget _buildMetadataRow() {
    return Row(
      children: [
        // Report date
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
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
                Icon(Icons.calendar_today_rounded,
                    size: 16, color: AppTheme.neutral500),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _getReportDate(),
                    style: GoogleFonts.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neutral700,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),

        // Report number
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
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
                Icon(Icons.tag_rounded,
                    size: 16, color: AppTheme.neutral500),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _reportNumber,
                    style: GoogleFonts.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neutral700,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // PATIENT INFO CARD
  // ---------------------------------------------------------------------------

  Widget _buildPatientInfoCard() {
    final child = _child;
    if (child == null) return const SizedBox.shrink();

    final dateFormat = DateFormat('MMM d, yyyy');
    final birthDateStr = dateFormat.format(child.dateOfBirth);
    final genderStr = _capitalize(child.gender.name);

    // Build measurement string
    final measurements = <String>[];
    measurements.add('Height: ${child.height.toStringAsFixed(0)}cm');
    measurements.add('Weight: ${child.weight.toStringAsFixed(1)}kg');
    if (child.headCircumference != null) {
      measurements
          .add('HC: ${child.headCircumference!.toStringAsFixed(0)}cm');
    }
    final measurementStr = measurements.join(' \u2022 ');

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
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
                    child.name.isNotEmpty
                        ? child.name[0].toUpperCase()
                        : 'C',
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
                      '$genderStr \u2022 ${child.displayAge} \u2022 Born $birthDateStr',
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
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.neutral50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              measurementStr,
              style: GoogleFonts.nunito(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // OVERALL ASSESSMENT CARD
  // ---------------------------------------------------------------------------

  Widget _buildOverallAssessmentCard(
      double score, String status, String summary) {
    final scoreInt = score.round();
    final statusClr = _statusColor(status);
    final statusLbl = _statusLabel(status);

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
            'Overall Assessment',
            style: GoogleFonts.nunito(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral800,
            ),
          ),
          const SizedBox(height: 16),

          // Score + badge row
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Animated progress ring with score
              AnimatedProgressRing(
                progress: score / 100,
                size: 90,
                strokeWidth: 8,
                backgroundColor: statusClr.withOpacity(0.15),
                progressColor: statusClr,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '$scoreInt',
                      style: GoogleFonts.nunito(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: statusClr,
                      ),
                    ),
                    Text(
                      '/100',
                      style: GoogleFonts.nunito(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.neutral400,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),

              // Status badge + summary
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: statusClr.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statusLbl,
                        style: GoogleFonts.nunito(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: statusClr,
                        ),
                      ),
                    ),
                    if (summary.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        summary,
                        style: GoogleFonts.nunito(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.neutral600,
                          height: 1.4,
                        ),
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // DOMAIN ASSESSMENT CARD
  // ---------------------------------------------------------------------------

  Widget _buildDomainCard(Map<String, dynamic> domain) {
    final domainKey = domain['domain']?.toString() ?? '';
    final label = _domainLabel(domainKey);
    final color = _domainColor(domainKey);
    final icon = _domainIcon(domainKey);
    final score = (domain['score'] ?? 0).toDouble();
    final scoreInt = score.round();
    final status = domain['status']?.toString() ?? 'on_track';
    final observations = _extractStringList(domain['observations']);
    final whoRange = domain['whoRange']?.toString() ?? '';

    final bool showWatchAlert =
        status == 'emerging' || status == 'needs_support';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
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
          // Domain header
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
              ),
              Text(
                '$scoreInt',
                style: GoogleFonts.nunito(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              Text(
                '/100',
                style: GoogleFonts.nunito(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral400,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: score / 100,
              minHeight: 8,
              backgroundColor: color.withOpacity(0.12),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),

          // Watch alert banner
          if (showWatchAlert) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _statusColor(status).withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _statusColor(status).withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    size: 16,
                    color: _statusColor(status),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    status == 'needs_support'
                        ? 'NEEDS SUPPORT'
                        : 'WATCH ALERT',
                    style: GoogleFonts.nunito(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: _statusColor(status),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Observations
          if (observations.isNotEmpty) ...[
            const SizedBox(height: 14),
            ...observations.take(5).map(
                  (obs) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(top: 6),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: color.withOpacity(0.5),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            obs,
                            style: GoogleFonts.nunito(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.neutral600,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
          ],

          // WHO range reference
          if (whoRange.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              'WHO Reference: $whoRange',
              style: GoogleFonts.nunito(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: AppTheme.neutral400,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // RECOMMENDATIONS CARD
  // ---------------------------------------------------------------------------

  Widget _buildRecommendationsCard(List<String> recommendations) {
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
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.lightbulb_outline_rounded,
                  color: AppTheme.primaryGreen,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Recommendations',
                style: GoogleFonts.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.neutral800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...recommendations.asMap().entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${entry.key + 1}',
                            style: GoogleFonts.nunito(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          entry.value,
                          style: GoogleFonts.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.neutral700,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // ACTION BUTTONS
  // ---------------------------------------------------------------------------

  Widget _buildActionButtons() {
    return Row(
      children: [
        // Send to Doctor
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _isExporting ? null : _sendToDoctor,
            icon: _isExporting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.send_rounded, size: 18),
            label: Text(
              'Send to Doctor',
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
        const SizedBox(width: 12),

        // Export PDF
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _isExporting ? null : _exportPdf,
            icon: _isExporting
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppTheme.primaryGreen,
                    ),
                  )
                : const Icon(Icons.picture_as_pdf_rounded, size: 18),
            label: Text(
              'Export PDF',
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
              side:
                  const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // DISCLAIMER
  // ---------------------------------------------------------------------------

  Widget _buildDisclaimer() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Text(
        'This report is generated by AI for informational purposes only '
        'and does not constitute medical advice. Always consult with a '
        'qualified healthcare provider for medical decisions regarding '
        'your child\'s development.',
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
  // LOADING / ERROR
  // ---------------------------------------------------------------------------

  Widget _buildLoadingState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated progress ring
            AnimatedProgressRing(
              progress: 0.75,
              size: 80,
              strokeWidth: 6,
              progressColor: AppTheme.primaryGreen,
              duration: const Duration(milliseconds: 2000),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: AppTheme.primaryGreen,
                size: 30,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Generating Report...',
              style: GoogleFonts.nunito(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Analyzing development data and creating\na comprehensive assessment',
              textAlign: TextAlign.center,
              style: GoogleFonts.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.neutral500,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: 200,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: const LinearProgressIndicator(
                  minHeight: 4,
                  backgroundColor: Color(0xFFE4E4E7),
                  valueColor:
                      AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
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
              'Report Generation Failed',
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
              onPressed: _generateReport,
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

  List<String> _extractStringList(dynamic value) {
    if (value is List) {
      return value.map((v) => v.toString()).toList();
    }
    return [];
  }
}
