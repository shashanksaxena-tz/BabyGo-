import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../services/who_data_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

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

class _MilestonesScreenState extends State<MilestonesScreen>
    with SingleTickerProviderStateMixin {
  ChildProfile? _child;
  bool _isLoading = true;
  bool _isSyncing = false;
  String _selectedDomain = 'all';

  // Milestone tracking state - in-memory only
  Map<String, AchievedMilestone> _achievedMilestones = {};
  Set<String> _watchedMilestones = {};

  // Date picker state
  DateTime _selectedDate = DateTime.now();
  String _achievementNotes = '';

  late TabController _tabController;
  final ApiService _apiService = ApiService();

  final List<Map<String, dynamic>> _domains = [
    {'id': 'all', 'name': 'All', 'icon': '🌟', 'color': AppTheme.primaryGreen},
    {'id': 'motor', 'name': 'Motor', 'icon': '🏃', 'color': AppTheme.motorColor},
    {'id': 'language', 'name': 'Language', 'icon': '💬', 'color': AppTheme.languageColor},
    {'id': 'cognitive', 'name': 'Cognitive', 'icon': '🧠', 'color': AppTheme.cognitiveColor},
    {'id': 'social', 'name': 'Social', 'icon': '❤️', 'color': AppTheme.socialColor},
    {'id': 'sensory', 'name': 'Sensory', 'icon': '✨', 'color': AppTheme.accentPurple},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();

    setState(() {
      _child = child;
    });

    // Sync with backend
    await _syncWithBackend();

    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _syncWithBackend() async {
    if (_child == null) return;

    try {
      final response = await _apiService.getChildMilestones(_child!.id);
      if (response['success'] == true && response['data'] != null) {
        // Backend success - use backend data
        final data = response['data'];
        final achievedList = data['achievedMilestones'] as List? ?? [];
        final watchedList = data['watchedMilestones'] as List? ?? [];

        setState(() {
          _achievedMilestones = {};
          for (var m in achievedList) {
            final achieved = AchievedMilestone.fromJson(m);
            _achievedMilestones[achieved.milestoneId] = achieved;
          }

          _watchedMilestones = {};
          for (var m in watchedList) {
            _watchedMilestones.add(m['milestoneId'] ?? '');
          }
        });
      } else {
        // API returned an error - keep state empty (in-memory only)
        debugPrint('Backend unavailable, starting with empty state');
      }
    } catch (e) {
      // Network error - keep state empty (in-memory only)
      debugPrint('Failed to sync with backend: $e');
    }
  }

  Future<void> _markAchieved(Milestone milestone) async {
    setState(() => _isSyncing = true);

    // Helper to update UI state only
    void updateState() {
      setState(() {
        _achievedMilestones[milestone.id] = AchievedMilestone(
          milestoneId: milestone.id,
          achievedDate: _selectedDate,
          confirmedBy: 'parent',
          notes: _achievementNotes.isNotEmpty ? _achievementNotes : null,
        );
        _watchedMilestones.remove(milestone.id);
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
        // API error - update UI only (in-memory)
        debugPrint('Backend error, updating UI only');
        updateState();
      }
    } catch (e) {
      // Network error - update UI only (in-memory)
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
        // API error - update UI only
        debugPrint('Backend error, updating UI only');
        removeFromState();
      }
    } catch (e) {
      // Network error - update UI only
      debugPrint('Network error, updating UI only: $e');
      removeFromState();
    } finally {
      setState(() => _isSyncing = false);
    }
  }

  Future<void> _toggleWatch(String milestoneId) async {
    final isWatching = _watchedMilestones.contains(milestoneId);
    setState(() => _isSyncing = true);

    void updateWatchState(bool add) {
      setState(() {
        if (add) {
          _watchedMilestones.add(milestoneId);
        } else {
          _watchedMilestones.remove(milestoneId);
        }
      });
    }

    try {
      if (isWatching) {
        final response = await _apiService.unwatchMilestone(_child!.id, milestoneId);
        if (response['success'] == true) {
          updateWatchState(false);
        } else {
          updateWatchState(false);
        }
      } else {
        final response = await _apiService.watchMilestone(_child!.id, milestoneId);
        if (response['success'] == true) {
          updateWatchState(true);
        } else {
          updateWatchState(true);
        }
      }
    } catch (e) {
      // Network error - update UI only
      debugPrint('Network error, updating UI only: $e');
      updateWatchState(!isWatching);
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.success.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('🏆', style: TextStyle(fontSize: 24)),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Mark as Achieved',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
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
                  color: AppTheme.neutral100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      milestone.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      milestone.description,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.neutral600,
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
                    border: Border.all(color: AppTheme.neutral300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 20, color: AppTheme.neutral500),
                      const SizedBox(width: 8),
                      Text(
                        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                        style: const TextStyle(fontSize: 15),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Notes
              const Text(
                'Notes (optional)',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              TextField(
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: 'Any notes about this milestone...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
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
              child: const Text('Cancel'),
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
              child: Text(_isSyncing ? 'Saving...' : 'Confirm'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }

    return Container(
      decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
      child: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildProgressOverview(),
            _buildDomainFilter(),
            _buildTabBar(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildCurrentMilestones(),
                  _buildUpcomingMilestones(),
                  _buildAchievedMilestones(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_rounded),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
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
                  'Milestones',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.neutral900,
                  ),
                ),
                Text(
                  'Track ${_child?.displayName ?? "your child"}\'s development',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
          // Refresh button
          IconButton(
            onPressed: _isSyncing ? null : () => _loadData(),
            icon: _isSyncing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppTheme.primaryGreen,
                    ),
                  )
                : const Icon(Icons.refresh_rounded),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen.withOpacity(0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressOverview() {
    if (_child == null) return const SizedBox();

    final ageMonths = _child!.ageInMonths;
    final allMilestones = WHODataService.getMilestonesForAge(ageMonths);
    final currentMilestones = allMilestones
        .where((m) => ageMonths >= m.minMonths && ageMonths <= m.maxMonths)
        .toList();
    final achievedCount =
        currentMilestones.where((m) => _achievedMilestones.containsKey(m.id)).length;
    final totalCount = currentMilestones.length;
    final progress = totalCount > 0 ? achievedCount / totalCount : 0.0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
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
          // Progress ring
          SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              children: [
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: progress),
                  duration: const Duration(milliseconds: 1500),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, _) {
                    return CircularProgressIndicator(
                      value: value,
                      strokeWidth: 8,
                      backgroundColor: Colors.white24,
                      valueColor: const AlwaysStoppedAnimation(Colors.white),
                    );
                  },
                ),
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$achievedCount/$totalCount',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Current Milestones',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${(progress * 100).toStringAsFixed(0)}% achieved',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Age: ${_child!.displayAge}',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ),
          // Total achieved badge
          Column(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('🏆', style: TextStyle(fontSize: 28)),
              ),
              const SizedBox(height: 4),
              Text(
                '${_achievedMilestones.length} total',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.2, end: 0);
  }

  Widget _buildDomainFilter() {
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _domains.length,
        itemBuilder: (context, index) {
          final domain = _domains[index];
          final isSelected = _selectedDomain == domain['id'];

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              selected: isSelected,
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(domain['icon']),
                  const SizedBox(width: 6),
                  Text(domain['name']),
                ],
              ),
              onSelected: (selected) {
                setState(() => _selectedDomain = domain['id']);
              },
              selectedColor: (domain['color'] as Color).withOpacity(0.2),
              backgroundColor: Colors.white,
              labelStyle: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? domain['color'] : AppTheme.neutral600,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected ? domain['color'] : AppTheme.neutral200,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppTheme.neutral100,
        borderRadius: BorderRadius.circular(16),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: AppTheme.softShadow,
        ),
        labelColor: AppTheme.primaryGreen,
        unselectedLabelColor: AppTheme.neutral500,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600),
        dividerColor: Colors.transparent,
        tabs: [
          const Tab(text: '🎯 Current'),
          const Tab(text: '🚀 Upcoming'),
          Tab(text: '🏆 Achieved (${_achievedMilestones.length})'),
        ],
      ),
    );
  }

  Widget _buildCurrentMilestones() {
    if (_child == null) return const SizedBox();

    final ageMonths = _child!.ageInMonths;
    final milestones = _getFilteredMilestones(ageMonths, 'current');

    if (milestones.isEmpty) {
      return _buildEmptyState('No milestones for this age range');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: milestones.length,
      itemBuilder: (context, index) {
        final milestone = milestones[index];
        final isAchieved = _achievedMilestones.containsKey(milestone.id);

        return StaggeredListAnimation(
          index: index,
          child: _buildMilestoneCard(milestone, isAchieved, 'current'),
        );
      },
    );
  }

  Widget _buildUpcomingMilestones() {
    if (_child == null) return const SizedBox();

    final ageMonths = _child!.ageInMonths;
    final milestones = _getFilteredMilestones(ageMonths, 'upcoming');

    if (milestones.isEmpty) {
      return _buildEmptyState('No upcoming milestones');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: milestones.length,
      itemBuilder: (context, index) {
        final milestone = milestones[index];
        final isAchieved = _achievedMilestones.containsKey(milestone.id);
        final isWatching = _watchedMilestones.contains(milestone.id);

        return StaggeredListAnimation(
          index: index,
          child: _buildMilestoneCard(milestone, isAchieved, 'upcoming', isWatching: isWatching),
        );
      },
    );
  }

  Widget _buildAchievedMilestones() {
    if (_child == null) return const SizedBox();

    final ageMonths = _child!.ageInMonths;
    final allMilestones = WHODataService.getMilestonesForAge(ageMonths);
    var milestones = allMilestones
        .where((m) => _achievedMilestones.containsKey(m.id))
        .toList();

    // Apply domain filter
    if (_selectedDomain != 'all') {
      milestones = milestones
          .where((m) => m.domain.name == _selectedDomain)
          .toList();
    }

    if (milestones.isEmpty) {
      return _buildEmptyState(
        _achievedMilestones.isEmpty
            ? 'No achievements yet\nStart marking milestones!'
            : 'No achievements in this domain',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: milestones.length,
      itemBuilder: (context, index) {
        final milestone = milestones[index];
        return StaggeredListAnimation(
          index: index,
          child: _buildMilestoneCard(milestone, true, 'achieved'),
        );
      },
    );
  }

  List<Milestone> _getFilteredMilestones(int ageMonths, String tab) {
    List<Milestone> allMilestones;

    if (_selectedDomain == 'all') {
      allMilestones = WHODataService.getMilestonesForAge(ageMonths);
    } else {
      final domain = DevelopmentDomain.values.firstWhere(
        (d) => d.name == _selectedDomain,
        orElse: () => DevelopmentDomain.motor,
      );
      allMilestones = WHODataService.getMilestonesByDomain(domain, ageMonths);
    }

    if (tab == 'current') {
      return allMilestones
          .where((m) =>
              !_achievedMilestones.containsKey(m.id) &&
              ageMonths >= m.minMonths &&
              ageMonths <= m.maxMonths)
          .toList();
    } else if (tab == 'upcoming') {
      return allMilestones
          .where((m) =>
              !_achievedMilestones.containsKey(m.id) &&
              m.minMonths > ageMonths)
          .toList();
    }
    return allMilestones;
  }

  Widget _buildMilestoneCard(
    Milestone milestone,
    bool isAchieved,
    String tab, {
    bool isWatching = false,
  }) {
    final domainColor = _getDomainColor(milestone.domain);
    final ageMonths = _child?.ageInMonths ?? 0;
    final achievementData = _achievedMilestones[milestone.id];

    // Calculate progress within milestone window
    final windowStart = milestone.minMonths;
    final windowEnd = milestone.maxMonths;
    final progress = ((ageMonths - windowStart) / (windowEnd - windowStart))
        .clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
        border: isAchieved
            ? Border.all(color: AppTheme.success, width: 2)
            : isWatching
                ? Border.all(color: Colors.amber, width: 2)
                : null,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: tab == 'current' && !isAchieved
              ? () => _showAchievementDialog(milestone)
              : null,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Domain indicator
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: domainColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(
                          _getDomainEmoji(milestone.domain),
                          style: const TextStyle(fontSize: 24),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  milestone.title,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: isAchieved
                                        ? AppTheme.success
                                        : AppTheme.neutral900,
                                  ),
                                ),
                              ),
                              if (isWatching && !isAchieved)
                                const Icon(Icons.visibility,
                                    size: 16, color: Colors.amber),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: domainColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  milestone.domain.name,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: domainColor,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${milestone.minMonths}-${milestone.maxMonths} months',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.neutral500,
                                ),
                              ),
                              if (isAchieved && achievementData != null) ...[
                                const SizedBox(width: 8),
                                Icon(Icons.check_circle,
                                    size: 14, color: AppTheme.success),
                                const SizedBox(width: 2),
                                Text(
                                  '${achievementData.achievedDate.day}/${achievementData.achievedDate.month}/${achievementData.achievedDate.year}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.success,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    // Action buttons
                    _buildActionButtons(milestone, isAchieved, tab, isWatching),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  milestone.description,
                  style: TextStyle(
                    fontSize: 14,
                    color: isAchieved ? AppTheme.neutral400 : AppTheme.neutral600,
                    height: 1.4,
                  ),
                ),
                // Achievement notes
                if (isAchieved && achievementData?.notes != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.notes, size: 14, color: AppTheme.success),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '"${achievementData!.notes}"',
                            style: TextStyle(
                              fontSize: 13,
                              fontStyle: FontStyle.italic,
                              color: AppTheme.success,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (tab == 'current' && !isAchieved) ...[
                  const SizedBox(height: 12),
                  // Progress indicator
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Expected window',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.neutral500,
                                  ),
                                ),
                                Text(
                                  'Typical: ${milestone.typicalMonths}mo',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: domainColor,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Stack(
                              children: [
                                // Background
                                Container(
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: AppTheme.neutral200,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                                // Progress
                                FractionallySizedBox(
                                  widthFactor: progress,
                                  child: Container(
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: domainColor,
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
                // Clickable source link
                const SizedBox(height: 8),
                InkWell(
                  onTap: () => _launchUrl(milestone.source.url),
                  child: Row(
                    children: [
                      Icon(Icons.verified_rounded,
                          size: 12, color: Colors.blue.shade400),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          milestone.source.title,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.blue.shade400,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                      Icon(Icons.open_in_new,
                          size: 12, color: Colors.blue.shade400),
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

  Widget _buildActionButtons(
    Milestone milestone,
    bool isAchieved,
    String tab,
    bool isWatching,
  ) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Watch button for upcoming
        if (tab == 'upcoming' && !isAchieved)
          IconButton(
            onPressed: _isSyncing ? null : () => _toggleWatch(milestone.id),
            icon: Icon(
              isWatching ? Icons.visibility_off : Icons.visibility,
              color: isWatching ? Colors.amber : AppTheme.neutral400,
            ),
            style: IconButton.styleFrom(
              backgroundColor:
                  isWatching ? Colors.amber.withOpacity(0.1) : AppTheme.neutral100,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            tooltip: isWatching ? 'Stop watching' : 'Watch milestone',
          ),
        // Mark achieved button for current & upcoming
        if ((tab == 'current' || tab == 'upcoming') && !isAchieved)
          IconButton(
            onPressed: _isSyncing ? null : () => _showAchievementDialog(milestone),
            icon: const Icon(Icons.check, color: AppTheme.neutral400),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.neutral100,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            tooltip: 'Mark as achieved',
          ),
        // Unmark button for achieved
        if (isAchieved)
          IconButton(
            onPressed: _isSyncing ? null : () => _unmarkAchieved(milestone.id),
            icon: const Icon(Icons.check, color: Colors.white),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.success,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            tooltip: 'Remove achievement',
          ),
      ],
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🎯', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 16,
              color: AppTheme.neutral500,
            ),
          ),
        ],
      ),
    );
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
        return AppTheme.accentPurple;
    }
  }

  String _getDomainEmoji(DevelopmentDomain domain) {
    switch (domain) {
      case DevelopmentDomain.motor:
        return '🏃';
      case DevelopmentDomain.language:
        return '💬';
      case DevelopmentDomain.cognitive:
        return '🧠';
      case DevelopmentDomain.social:
        return '❤️';
      case DevelopmentDomain.sensory:
        return '✨';
    }
  }
}
