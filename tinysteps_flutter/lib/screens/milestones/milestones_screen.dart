import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/who_data_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

class MilestonesScreen extends StatefulWidget {
  const MilestonesScreen({super.key});

  @override
  State<MilestonesScreen> createState() => _MilestonesScreenState();
}

class _MilestonesScreenState extends State<MilestonesScreen>
    with SingleTickerProviderStateMixin {
  ChildProfile? _child;
  bool _isLoading = true;
  String _selectedDomain = 'all';
  Set<String> _achievedMilestones = {};

  late TabController _tabController;

  final List<Map<String, dynamic>> _domains = [
    {'id': 'all', 'name': 'All', 'icon': '🌟', 'color': AppTheme.primaryGreen},
    {'id': 'motor', 'name': 'Motor', 'icon': '🏃', 'color': AppTheme.motorColor},
    {'id': 'language', 'name': 'Language', 'icon': '💬', 'color': AppTheme.languageColor},
    {'id': 'cognitive', 'name': 'Cognitive', 'icon': '🧠', 'color': AppTheme.cognitiveColor},
    {'id': 'social', 'name': 'Social', 'icon': '❤️', 'color': AppTheme.socialColor},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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

    // Load achieved milestones from storage
    final prefs = await storage.getPreferences();
    final achieved = Set<String>.from(prefs['achievedMilestones'] ?? []);

    setState(() {
      _child = child;
      _achievedMilestones = achieved;
      _isLoading = false;
    });
  }

  Future<void> _toggleMilestone(String milestoneId) async {
    final storage = StorageService();
    setState(() {
      if (_achievedMilestones.contains(milestoneId)) {
        _achievedMilestones.remove(milestoneId);
      } else {
        _achievedMilestones.add(milestoneId);
      }
    });
    await storage.savePreference('achievedMilestones', _achievedMilestones.toList());
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
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
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text('🏆', style: TextStyle(fontSize: 24)),
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
        currentMilestones.where((m) => _achievedMilestones.contains(m.id)).length;
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
        tabs: const [
          Tab(text: '🎯 Current'),
          Tab(text: '🚀 Upcoming'),
        ],
      ),
    );
  }

  Widget _buildCurrentMilestones() {
    if (_child == null) return const SizedBox();

    final ageMonths = _child!.ageInMonths;
    var milestones = _getFilteredMilestones(ageMonths, true);

    if (milestones.isEmpty) {
      return _buildEmptyState('No milestones for this age range');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: milestones.length,
      itemBuilder: (context, index) {
        final milestone = milestones[index];
        final isAchieved = _achievedMilestones.contains(milestone.id);

        return StaggeredListAnimation(
          index: index,
          child: _buildMilestoneCard(milestone, isAchieved, true),
        );
      },
    );
  }

  Widget _buildUpcomingMilestones() {
    if (_child == null) return const SizedBox();

    final ageMonths = _child!.ageInMonths;
    var milestones = _getFilteredMilestones(ageMonths, false);

    if (milestones.isEmpty) {
      return _buildEmptyState('No upcoming milestones');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: milestones.length,
      itemBuilder: (context, index) {
        final milestone = milestones[index];
        return StaggeredListAnimation(
          index: index,
          child: _buildMilestoneCard(milestone, false, false),
        );
      },
    );
  }

  List<Milestone> _getFilteredMilestones(int ageMonths, bool current) {
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

    if (current) {
      return allMilestones
          .where((m) => ageMonths >= m.minMonths && ageMonths <= m.maxMonths)
          .toList();
    } else {
      return allMilestones.where((m) => m.minMonths > ageMonths).toList();
    }
  }

  Widget _buildMilestoneCard(Milestone milestone, bool isAchieved, bool canToggle) {
    final domainColor = _getDomainColor(milestone.domain);
    final ageMonths = _child?.ageInMonths ?? 0;

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
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: canToggle ? () => _toggleMilestone(milestone.id) : null,
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
                          Text(
                            milestone.title,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: isAchieved
                                  ? AppTheme.success
                                  : AppTheme.neutral900,
                              decoration: isAchieved
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
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
                            ],
                          ),
                        ],
                      ),
                    ),
                    // Checkbox or lock
                    if (canToggle)
                      Checkbox(
                        value: isAchieved,
                        onChanged: (_) => _toggleMilestone(milestone.id),
                        activeColor: AppTheme.success,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.neutral100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.schedule_rounded,
                          size: 20,
                          color: AppTheme.neutral400,
                        ),
                      ),
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
                if (canToggle && !isAchieved) ...[
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
                                Text(
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
                // Source
                if (milestone.source != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.verified_rounded,
                          size: 12, color: AppTheme.neutral400),
                      const SizedBox(width: 4),
                      Text(
                        milestone.source!.title,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.neutral400,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
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
    }
  }
}
