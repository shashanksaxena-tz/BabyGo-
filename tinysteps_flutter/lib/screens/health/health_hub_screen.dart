import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

/// Health Hub / Doctors screen -- shows recommended specialists based on
/// the child's development analysis.
///
/// Design: red-orange gradient header, AI recommendation banner, category
/// filter pills, and doctor listing cards.
class HealthHubScreen extends StatefulWidget {
  const HealthHubScreen({super.key});

  @override
  State<HealthHubScreen> createState() => _HealthHubScreenState();
}

class _HealthHubScreenState extends State<HealthHubScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  ChildProfile? _child;

  // Data from API
  String _childName = '';
  List<String> _flaggedDomains = [];
  Map<String, dynamic> _domainScores = {};
  List<Map<String, dynamic>> _recommendedDoctors = [];
  List<Map<String, dynamic>> _otherDoctors = [];

  // Category filter
  String _selectedCategory = 'All';
  static const _categories = ['All', 'Pediatricians', 'Speech', 'Therapy'];

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
      final child = await storage.getCurrentChild();

      setState(() => _child = child);

      if (child != null) {
        await _fetchDoctors(child.id);
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

  Future<void> _fetchDoctors(String childId) async {
    try {
      final result = await ApiService().getRecommendedDoctors(childId);

      if (!mounted) return;

      if (result['success'] == true) {
        final data = result['data'];
        if (data is Map<String, dynamic>) {
          setState(() {
            _childName = data['childName']?.toString() ?? _child?.displayName ?? '';
            _flaggedDomains = List<String>.from(data['flaggedDomains'] ?? []);
            _domainScores = data['domainScores'] is Map<String, dynamic>
                ? data['domainScores'] as Map<String, dynamic>
                : {};
            _recommendedDoctors = _parseList(data['recommended']);
            _otherDoctors = _parseList(data['others']);
            _isLoading = false;
          });
        } else {
          setState(() {
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _errorMessage = result['error']?.toString() ?? 'Failed to load doctors';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not load doctors. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  List<Map<String, dynamic>> _parseList(dynamic raw) {
    if (raw is List) {
      return raw
          .map((e) => e is Map<String, dynamic> ? e : <String, dynamic>{})
          .where((e) => e.isNotEmpty)
          .toList();
    }
    return [];
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  List<Map<String, dynamic>> get _filteredRecommended {
    return _applyFilter(_recommendedDoctors);
  }

  List<Map<String, dynamic>> get _filteredOthers {
    return _applyFilter(_otherDoctors);
  }

  List<Map<String, dynamic>> _applyFilter(List<Map<String, dynamic>> doctors) {
    if (_selectedCategory == 'All') return doctors;

    return doctors.where((d) {
      final specialty = (d['specialty'] ?? '').toString().toLowerCase();
      final category = _selectedCategory.toLowerCase();
      return specialty.contains(category) ||
          (category == 'pediatricians' && specialty.contains('pediatric')) ||
          (category == 'speech' && (specialty.contains('speech') || specialty.contains('language'))) ||
          (category == 'therapy' && (specialty.contains('therap') || specialty.contains('occupational')));
    }).toList();
  }

  // ---------------------------------------------------------------------------
  // Domain color / label helpers
  // ---------------------------------------------------------------------------

  Color _domainColor(String domain) {
    switch (domain.toLowerCase()) {
      case 'motor':
        return const Color(0xFF3B82F6);
      case 'language':
        return const Color(0xFFEC4899);
      case 'cognitive':
        return const Color(0xFF8B5CF6);
      case 'social':
        return const Color(0xFFF59E0B);
      default:
        return AppTheme.primaryGreen;
    }
  }

  String _specialistForDomain(String domain) {
    switch (domain.toLowerCase()) {
      case 'motor':
        return 'Pediatric Physiotherapist';
      case 'language':
        return 'Speech-Language Pathologist';
      case 'cognitive':
        return 'Developmental Pediatrician';
      case 'social':
        return 'Child Psychologist';
      default:
        return 'Specialist';
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
      backgroundColor: const Color(0xFFFAFAFA),
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
  // HEADER (red-orange gradient)
  // ---------------------------------------------------------------------------

  Widget _buildGradientHeader() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFEF4444), Color(0xFFF97316)],
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
              // Top row: back + notification
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _headerIconButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  _headerIconButton(
                    icon: Icons.notifications_none_rounded,
                    onTap: () {},
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
                    child: const Icon(Icons.health_and_safety_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Health Hub',
                          style: GoogleFonts.nunito(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Recommended specialists for ${_childName.isNotEmpty ? _childName : (_child?.displayName ?? "your child")}',
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
      color: const Color(0xFFEF4444),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // AI recommendation banner
          if (_flaggedDomains.isNotEmpty) ...[
            _buildAIBanner(),
            const SizedBox(height: 20),
          ],

          // Category filter pills
          _buildCategoryPills(),
          const SizedBox(height: 20),

          // Recommended for You
          if (_filteredRecommended.isNotEmpty) ...[
            Text(
              'Recommended for You',
              style: GoogleFonts.nunito(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral800,
              ),
            ),
            const SizedBox(height: 12),
            ..._filteredRecommended.asMap().entries.map(
              (entry) => StaggeredListAnimation(
                index: entry.key,
                child: _buildDoctorCard(entry.value, isRecommended: true),
              ),
            ),
          ],

          // Other doctors
          if (_filteredOthers.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              'Other Specialists',
              style: GoogleFonts.nunito(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral800,
              ),
            ),
            const SizedBox(height: 12),
            ..._filteredOthers.asMap().entries.map(
              (entry) => StaggeredListAnimation(
                index: entry.key + _filteredRecommended.length,
                child: _buildDoctorCard(entry.value, isRecommended: false),
              ),
            ),
          ],

          // Empty state if nothing after filter
          if (_filteredRecommended.isEmpty && _filteredOthers.isEmpty)
            _buildEmptyFilterState(),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // AI RECOMMENDATION BANNER
  // ---------------------------------------------------------------------------

  Widget _buildAIBanner() {
    final primaryFlagged = _flaggedDomains.isNotEmpty ? _flaggedDomains.first : '';
    final specialist = _specialistForDomain(primaryFlagged);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFFFFF7ED),
            const Color(0xFFFFFBEB),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFF59E0B).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: Color(0xFFF59E0B), size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Based on ${_childName.isNotEmpty ? _childName : "your child"}\'s Report',
                  style: GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_capitalize(primaryFlagged)} flagged \u2014 we recommend consulting a $specialist',
                  style: GoogleFonts.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral600,
                    height: 1.4,
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
  // CATEGORY FILTER PILLS
  // ---------------------------------------------------------------------------

  Widget _buildCategoryPills() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _categories.map((cat) {
          final isActive = _selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () => setState(() => _selectedCategory = cat),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  color: isActive ? const Color(0xFFEF4444) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isActive ? const Color(0xFFEF4444) : AppTheme.neutral300,
                    width: 1.5,
                  ),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: const Color(0xFFEF4444).withOpacity(0.2),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  cat,
                  style: GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isActive ? Colors.white : AppTheme.neutral600,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // DOCTOR CARD
  // ---------------------------------------------------------------------------

  Widget _buildDoctorCard(Map<String, dynamic> doctor, {required bool isRecommended}) {
    final name = doctor['name']?.toString() ?? 'Doctor';
    final specialty = doctor['specialty']?.toString() ?? '';
    final rating = (doctor['rating'] ?? 0).toString();
    final experience = doctor['experience']?.toString() ?? '';
    final distance = doctor['distance']?.toString() ?? '';
    final fee = doctor['fee']?.toString() ?? '';
    final recommendedDomain = doctor['recommendedDomain']?.toString() ?? '';

    // Extract initials for avatar
    final nameParts = name.split(' ');
    final initials = nameParts.length >= 2
        ? '${nameParts[0][0]}${nameParts[1][0]}'
        : name.isNotEmpty
            ? name[0]
            : 'D';

    final domainAccent = recommendedDomain.isNotEmpty
        ? _domainColor(recommendedDomain)
        : const Color(0xFFEF4444);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
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
        border: isRecommended
            ? Border(
                left: BorderSide(
                  color: domainAccent,
                  width: 4,
                ),
              )
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Recommendation tag
            if (isRecommended && recommendedDomain.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: domainAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, size: 14, color: domainAccent),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'Recommended \u2014 ${_capitalize(recommendedDomain)} watch area detected',
                        style: GoogleFonts.nunito(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: domainAccent,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Doctor info row
            Row(
              children: [
                // Avatar circle
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        isRecommended ? domainAccent : AppTheme.neutral400,
                        isRecommended ? domainAccent.withOpacity(0.7) : AppTheme.neutral300,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      initials.toUpperCase(),
                      style: GoogleFonts.nunito(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Name + specialty
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: GoogleFonts.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.neutral800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        specialty,
                        style: GoogleFonts.nunito(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.neutral500,
                        ),
                      ),
                    ],
                  ),
                ),

                // Rating badge
                if (rating != '0' && rating.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: const Color(0xFFF59E0B).withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star_rounded, size: 16, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 3),
                        Text(
                          rating,
                          style: GoogleFonts.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFF59E0B),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),

            // Experience + Distance + Fee row
            Row(
              children: [
                if (experience.isNotEmpty)
                  _buildInfoPill(Icons.work_outline_rounded, experience),
                if (experience.isNotEmpty && distance.isNotEmpty)
                  const SizedBox(width: 10),
                if (distance.isNotEmpty)
                  _buildInfoPill(Icons.location_on_outlined, distance),
                if ((experience.isNotEmpty || distance.isNotEmpty) && fee.isNotEmpty)
                  const SizedBox(width: 10),
                if (fee.isNotEmpty)
                  _buildInfoPill(Icons.payments_outlined, fee),
              ],
            ),
            const SizedBox(height: 14),

            // Book Appointment button
            SizedBox(
              width: double.infinity,
              child: isRecommended
                  ? ElevatedButton(
                      onPressed: () {
                        // Placeholder: show a snackbar
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Booking with $name coming soon!',
                              style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
                            ),
                            behavior: SnackBarBehavior.floating,
                            backgroundColor: AppTheme.primaryGreen,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        'Book Appointment',
                        style: GoogleFonts.nunito(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    )
                  : OutlinedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Booking with $name coming soon!',
                              style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
                            ),
                            behavior: SnackBarBehavior.floating,
                            backgroundColor: AppTheme.neutral600,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.neutral700,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        side: BorderSide(color: AppTheme.neutral300, width: 1.5),
                      ),
                      child: Text(
                        'Book Appointment',
                        style: GoogleFonts.nunito(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoPill(IconData icon, String label) {
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

  // ---------------------------------------------------------------------------
  // EMPTY FILTER STATE
  // ---------------------------------------------------------------------------

  Widget _buildEmptyFilterState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Center(
        child: Column(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppTheme.neutral100,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Icons.search_off_rounded,
                size: 32,
                color: AppTheme.neutral400,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No doctors match this filter',
              style: GoogleFonts.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try selecting a different category',
              style: GoogleFonts.nunito(
                fontSize: 14,
                color: AppTheme.neutral400,
              ),
            ),
          ],
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
          height: 160,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: _shimmerPlaceholder(160),
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
                backgroundColor: const Color(0xFFEF4444),
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
}
