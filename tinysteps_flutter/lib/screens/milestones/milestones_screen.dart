import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/bottom_nav_bar.dart';

/// Data class for achieved milestone tracking
class AchievedMilestone {
  final String milestoneId;
  final DateTime achievedDate;
  final String confirmedBy;
  final String? notes;

  AchievedMilestone({
    required this.milestoneId,
    required this.achievedDate,
    this.confirmedBy = 'parent',
    this.notes,
  });

  factory AchievedMilestone.fromJson(Map<String, dynamic> json) {
    return AchievedMilestone(
      milestoneId: json['milestoneId'] ?? '',
      achievedDate: json['achievedDate'] != null
          ? DateTime.parse(json['achievedDate'])
          : DateTime.now(),
      confirmedBy: json['confirmedBy'] ?? 'parent',
      notes: json['notes'],
    );
  }
}

class MilestonesScreen extends StatefulWidget {
  const MilestonesScreen({super.key});

  @override
  State<MilestonesScreen> createState() => _MilestonesScreenState();
}

class _MilestonesScreenState extends State<MilestonesScreen> {
  ChildProfile? _child;
  bool _isLoading = true;
  bool _isSyncing = false;
  String _selectedDomain = 'all';

  // Milestone tracking state
  Map<String, AchievedMilestone> _achievedMilestones = {};
  List<Milestone> _allMilestones = [];

  // Date picker state
  DateTime _selectedDate = DateTime.now();
  String _achievementNotes = '';

  final ApiService _apiService = ApiService();

  // Domain filter data
  static final List<Map<String, dynamic>> _domainFilters = [
    {'id': 'all', 'name': 'All', 'color': null},
    {'id': 'motor', 'name': 'Motor', 'color': AppTheme.motorColor},
    {'id': 'cognitive', 'name': 'Cognitive', 'color': AppTheme.cognitiveColor},
    {'id': 'language', 'name': 'Language', 'color': AppTheme.languageColor},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();

    setState(() {
      _child = child;
    });

    if (child != null) {
      await _loadMilestones();
    }
    await _syncWithBackend();

    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _loadMilestones() async {
    if (_child == null) return;
    try {
      final response = await _apiService.getMilestones(_child!.ageInMonths);
      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        final milestonesList = (data['milestones'] as List?) ?? (data is List ? data : []);
        setState(() {
          _allMilestones = milestonesList.map((m) {
            final domainStr = (m['domain'] ?? 'motor').toString().toLowerCase();
            final domain = DevelopmentDomain.values.firstWhere(
              (d) => d.name == domainStr,
              orElse: () => DevelopmentDomain.motor,
            );
            return Milestone(
              id: m['id'] ?? '',
              title: m['title'] ?? '',
              description: m['description'] ?? '',
              domain: domain,
              minMonths: m['minMonths'] ?? 0,
              maxMonths: m['maxMonths'] ?? 0,
              typicalMonths: m['typicalMonths'] ?? 0,
            );
          }).toList();
        });
      }
    } catch (e) {
      debugPrint('Failed to load milestones from API: $e');
    }
  }

  Future<void> _syncWithBackend() async {
    if (_child == null) return;

    try {
      final response = await _apiService.getChildMilestones(_child!.id);
      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        final achievedList = data['achievedMilestones'] as List? ?? [];

        setState(() {
          _achievedMilestones = {};
          for (var m in achievedList) {
            final achieved = AchievedMilestone.fromJson(m);
            _achievedMilestones[achieved.milestoneId] = achieved;
          }
        });
      } else {
        debugPrint('Backend unavailable, starting with empty state');
      }
    } catch (e) {
      debugPrint('Failed to sync with backend: $e');
    }
  }

  Future<void> _markAchieved(Milestone milestone) async {
    setState(() => _isSyncing = true);

    void updateState() {
      setState(() {
        _achievedMilestones[milestone.id] = AchievedMilestone(
          milestoneId: milestone.id,
          achievedDate: _selectedDate,
          confirmedBy: 'parent',
          notes: _achievementNotes.isNotEmpty ? _achievementNotes : null,
        );
      });
    }

    try {
      final response = await _apiService.markMilestoneAchieved(
        _child!.id,
        milestone.id,
        achievedDate: _selectedDate.toIso8601String(),
        notes: _achievementNotes.isNotEmpty ? _achievementNotes : null,
        confirmedBy: 'parent',
      );

      if (response['success'] == true) {
        updateState();
      } else {
        debugPrint('Backend error, updating UI only');
        updateState();
      }
    } catch (e) {
      debugPrint('Network error, updating UI only: $e');
      updateState();
    } finally {
      setState(() {
        _isSyncing = false;
        _selectedDate = DateTime.now();
        _achievementNotes = '';
      });
    }
  }

  Future<void> _unmarkAchieved(String milestoneId) async {
    setState(() => _isSyncing = true);

    void removeFromState() {
      setState(() {
        _achievedMilestones.remove(milestoneId);
      });
    }

    try {
      final response = await _apiService.unmarkMilestoneAchieved(
        _child!.id,
        milestoneId,
      );

      if (response['success'] == true) {
        removeFromState();
      } else {
        removeFromState();
      }
    } catch (e) {
      debugPrint('Network error, updating UI only: $e');
      removeFromState();
    } finally {
      setState(() => _isSyncing = false);
    }
  }

  void _showAchievementDialog(Milestone milestone) {
    _selectedDate = DateTime.now();
    _achievementNotes = '';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: AppTheme.primaryGreen,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Mark as Achieved',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Milestone info
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundV3,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      milestone.title,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      milestone.description,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Date picker
              Text(
                'When did ${_child?.displayName ?? 'your child'} achieve this?',
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: const ColorScheme.light(
                            primary: AppTheme.primaryGreen,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );
                  if (date != null) {
                    setDialogState(() => _selectedDate = date);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.borderLight),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today,
                          size: 20, color: AppTheme.textSecondary),
                      const SizedBox(width: 8),
                      Text(
                        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Notes
              const Text(
                'Notes (optional)',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: 'Any notes about this milestone...',
                  hintStyle: const TextStyle(
                    fontFamily: 'Inter',
                    color: AppTheme.textTertiary,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                        color: AppTheme.primaryGreen, width: 2),
                  ),
                  contentPadding: const EdgeInsets.all(12),
                ),
                onChanged: (value) => _achievementNotes = value,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancel',
                style: TextStyle(fontFamily: 'Inter'),
              ),
            ),
            ElevatedButton(
              onPressed: _isSyncing
                  ? null
                  : () {
                      Navigator.pop(context);
                      _markAchieved(milestone);
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                _isSyncing ? 'Saving...' : 'Confirm',
                style: const TextStyle(fontFamily: 'Inter'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundV3,
        body: const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),

            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    // Progress card
                    _buildProgressCard(),
                    const SizedBox(height: 20),
                    // Domain filter pills
                    _buildFilterPills(),
                    const SizedBox(height: 20),
                    // Milestone list
                    _buildMilestoneList(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Bottom nav
            BottomNavBar(
              currentIndex: 0,
              onTap: (index) {
                if (index != 0) Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: SizedBox(
        height: 48,
        child: Row(
          children: [
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: const Icon(
                Icons.arrow_back_rounded,
                color: AppTheme.textPrimary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Milestones',
                style: TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
            GestureDetector(
              onTap: _isSyncing ? null : () => _loadData(),
              child: Icon(
                Icons.tune_rounded,
                color: AppTheme.textPrimary,
                size: 22,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressCard() {
    if (_child == null) return const SizedBox();

    final totalCount = _allMilestones.length;
    final achievedCount =
        _allMilestones.where((m) => _achievedMilestones.containsKey(m.id)).length;
    final progress = totalCount > 0 ? achievedCount / totalCount : 0.0;
    final progressPercent = (progress * 100).toStringAsFixed(0);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadowV3,
      ),
      child: Row(
        children: [
          // Left side: text content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title row with count
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Milestone Progress',
                      style: TextStyle(
                        fontFamily: 'Nunito',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      '$achievedCount of $totalCount',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Progress bar
                Container(
                  height: 10,
                  decoration: BoxDecoration(
                    color: AppTheme.borderLight,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: progress),
                      duration: const Duration(milliseconds: 1200),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, _) {
                        return FractionallySizedBox(
                          widthFactor: value.clamp(0.0, 1.0),
                          child: Container(
                            height: 10,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  AppTheme.primaryGreen,
                                  AppTheme.primaryTeal,
                                ],
                              ),
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Subtitle
                Text(
                  '$progressPercent% achieved \u2014 keep going!',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Leo avatar
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(45),
              color: AppTheme.backgroundV3,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(45),
              child: Image.asset(
                'assets/images/leo_avatar.png',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Center(
                  child: Text(
                    '\u{1F476}',
                    style: TextStyle(fontSize: 40),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildFilterPills() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _domainFilters.length,
        itemBuilder: (context, index) {
          final filter = _domainFilters[index];
          final id = filter['id'] as String;
          final name = filter['name'] as String;
          final color = filter['color'] as Color?;
          final isSelected = _selectedDomain == id;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _selectedDomain = id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.primaryGreen
                      : (color != null
                          ? _getDomainBgColor(id)
                          : Colors.white),
                  borderRadius: BorderRadius.circular(24),
                  border: isSelected
                      ? null
                      : Border.all(color: AppTheme.borderLight, width: 1),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (color != null && !isSelected) ...[
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      name,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: isSelected
                            ? FontWeight.w600
                            : FontWeight.w500,
                        color: isSelected
                            ? Colors.white
                            : (color ?? AppTheme.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getDomainBgColor(String domainId) {
    switch (domainId) {
      case 'motor':
        return const Color(0xFFEFF6FF); // blue tint
      case 'cognitive':
        return const Color(0xFFF5F3FF); // purple tint
      case 'language':
        return const Color(0xFFFDF2F8); // pink tint
      default:
        return Colors.white;
    }
  }

  Widget _buildMilestoneList() {
    if (_child == null) return const SizedBox();

    // Filter by domain
    List<Milestone> filtered;
    if (_selectedDomain == 'all') {
      filtered = _allMilestones;
    } else {
      final domain = DevelopmentDomain.values.firstWhere(
        (d) => d.name == _selectedDomain,
        orElse: () => DevelopmentDomain.motor,
      );
      filtered = _allMilestones.where((m) => m.domain == domain).toList();
    }

    // Sort: achieved first, then upcoming
    final achieved = filtered
        .where((m) => _achievedMilestones.containsKey(m.id))
        .toList();
    final upcoming = filtered
        .where((m) => !_achievedMilestones.containsKey(m.id))
        .toList();
    final sorted = [...achieved, ...upcoming];

    if (sorted.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            const Text('\u{1F3AF}', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              'No milestones found for this filter',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 15,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: sorted.asMap().entries.map((entry) {
          final index = entry.key;
          final milestone = entry.value;
          final isAchieved = _achievedMilestones.containsKey(milestone.id);

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _buildMilestoneRow(milestone, isAchieved)
                .animate()
                .fadeIn(delay: (100 + index * 60).ms, duration: 400.ms)
                .slideY(begin: 0.05, end: 0),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMilestoneRow(Milestone milestone, bool isAchieved) {
    final domainColor = _getDomainColor(milestone.domain);
    final domainName = _getDomainShortName(milestone.domain);
    final achievementData = _achievedMilestones[milestone.id];

    return GestureDetector(
      onTap: isAchieved ? null : () => _showAchievementDialog(milestone),
      onLongPress: isAchieved ? () => _unmarkAchieved(milestone.id) : null,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        child: Row(
          children: [
            // Leading: check or empty circle
            if (isAchieved)
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: const Center(
                  child: Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              )
            else
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppTheme.borderLight,
                    width: 2,
                  ),
                ),
              ),
            const SizedBox(width: 14),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title row with domain tag
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          milestone.title,
                          style: TextStyle(
                            fontFamily: 'Nunito',
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Domain tag pill
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getDomainBadgeBg(milestone.domain),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Text(
                          domainName,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: domainColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Status text
                  if (isAchieved && achievementData != null)
                    Text(
                      'Achieved at ${achievementData.achievedDate.day}/${achievementData.achievedDate.month}/${achievementData.achievedDate.year}',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.primaryGreen,
                      ),
                    )
                  else
                    Text(
                      'Expected: ${milestone.minMonths}-${milestone.maxMonths} months',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textTertiary,
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

  // Helper methods
  Color _getDomainBadgeBg(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return const Color(0xFFEFF6FF); // blue tint
      case DevelopmentDomain.language:
        return const Color(0xFFFDF2F8); // pink tint
      case DevelopmentDomain.cognitive:
        return const Color(0xFFF5F3FF); // purple tint
      case DevelopmentDomain.social:
        return const Color(0xFFF0FDF4); // green tint
      case DevelopmentDomain.sensory:
        return AppTheme.purpleTint;
    }
  }

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
}
