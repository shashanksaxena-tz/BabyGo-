import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen>
    with SingleTickerProviderStateMixin {
  ChildProfile? _child;
  List<AnalysisResult> _analyses = [];
  List<GrowthPercentile> _percentiles = [];
  List<Map<String, dynamic>> _timelineEntries = [];
  bool _isLoading = true;

  late TabController _tabController;
  final ApiService _apiService = ApiService();

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

    if (child != null) {
      final analyses = await storage.getAnalyses(child.id);

      // Fetch growth percentiles from backend
      List<GrowthPercentile> percentiles = [];
      try {
        final response = await _apiService.getGrowthPercentiles(
          weight: child.weight,
          height: child.height,
          headCircumference: child.headCircumference,
          ageMonths: child.ageInMonths,
          gender: child.gender.name,
        );
        if (response['success'] == true && response['data'] != null) {
          final data = response['data'];
          final percentileList = (data['percentiles'] as List?) ?? (data is List ? data : []);
          percentiles = percentileList
              .map((p) => GrowthPercentile(
                    metric: p['metric'] ?? '',
                    value: (p['value'] ?? 0).toDouble(),
                    percentile: (p['percentile'] ?? 50).toDouble(),
                    interpretation: p['interpretation'] ?? 'Typical',
                    source: WHOSource(
                      title: p['source']?['title'] ?? 'WHO Child Growth Standards',
                      url: p['source']?['url'] ?? 'https://www.who.int/tools/child-growth-standards/standards',
                      description: p['source']?['description'] ?? '',
                      type: p['source']?['type'] ?? 'standard',
                    ),
                  ))
              .toList();
        }
      } catch (e) {
        debugPrint('Failed to fetch growth percentiles: $e');
      }

      // Fetch timeline entries from backend
      List<Map<String, dynamic>> timelineEntries = [];
      try {
        final timelineResponse = await _apiService.getTimeline(child.id);
        if (timelineResponse['success'] == true) {
          timelineEntries = List<Map<String, dynamic>>.from(
            timelineResponse['entries'] ?? timelineResponse['data']?['entries'] ?? []
          );
        }
      } catch (e) {
        debugPrint('Failed to fetch timeline: $e');
      }

      // Provide defaults if API call failed
      if (percentiles.isEmpty) {
        final defaultSource = WHOSource(
          title: 'WHO Child Growth Standards',
          url: 'https://www.who.int/tools/child-growth-standards/standards',
          description: 'WHO Child Growth Standards: Methods and development',
          type: 'standard',
        );
        percentiles = [
          GrowthPercentile(metric: 'weight', value: child.weight, percentile: 50, interpretation: 'Typical', source: defaultSource),
          GrowthPercentile(metric: 'height', value: child.height, percentile: 50, interpretation: 'Typical', source: defaultSource),
          if (child.headCircumference != null)
            GrowthPercentile(metric: 'headCircumference', value: child.headCircumference!, percentile: 50, interpretation: 'Typical', source: defaultSource),
        ];
      }

      setState(() {
        _child = child;
        _analyses = analyses;
        _percentiles = percentiles;
        _timelineEntries = timelineEntries;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      );
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.backgroundGradient,
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${_child?.displayName ?? "Baby"}\'s Timeline',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.neutral900,
                          ),
                        ),
                        const Text(
                          'Track growth & development',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.neutral500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _addMeasurement,
                    icon: const Icon(Icons.add_rounded),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Tabs
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
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
                  Tab(text: 'Growth Charts'),
                  Tab(text: 'History'),
                ],
              ),
            ),

            // Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildGrowthCharts(),
                  _buildHistory(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrowthCharts() {
    if (_child == null) {
      return const Center(child: Text('No child profile found'));
    }

    final defaultSource = WHOSource(
      title: 'WHO Child Growth Standards',
      url: 'https://www.who.int/tools/child-growth-standards/standards',
      description: 'WHO Child Growth Standards: Methods and development',
      type: 'standard',
    );

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Current Stats
          _buildCurrentStats(),
          const SizedBox(height: 20),

          // Weight Chart
          _buildChartCard(
            title: 'Weight Progress',
            subtitle: 'kg over time',
            color: AppTheme.secondaryBlue,
            percentile: _percentiles.firstWhere(
              (p) => p.metric == 'weight',
              orElse: () => GrowthPercentile(
                metric: 'weight',
                value: _child!.weight,
                percentile: 50,
                interpretation: 'Typical',
                source: defaultSource,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Height Chart
          _buildChartCard(
            title: 'Height Progress',
            subtitle: 'cm over time',
            color: AppTheme.primaryGreen,
            percentile: _percentiles.firstWhere(
              (p) => p.metric == 'height',
              orElse: () => GrowthPercentile(
                metric: 'height',
                value: _child!.height,
                percentile: 50,
                interpretation: 'Typical',
                source: defaultSource,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Head Circumference (if available)
          if (_child!.headCircumference != null && _child!.ageInMonths < 36)
            _buildChartCard(
              title: 'Head Circumference',
              subtitle: 'cm over time',
              color: AppTheme.secondaryPurple,
              percentile: _percentiles.firstWhere(
                (p) => p.metric == 'headCircumference',
                orElse: () => GrowthPercentile(
                  metric: 'headCircumference',
                  value: _child!.headCircumference!,
                  percentile: 50,
                  interpretation: 'Typical',
                  source: defaultSource,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCurrentStats() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryGreen.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(
            '${_child!.weight.toStringAsFixed(1)}',
            'kg',
            'Weight',
            Icons.monitor_weight_rounded,
          ),
          Container(
            width: 1,
            height: 50,
            color: Colors.white24,
          ),
          _buildStatItem(
            '${_child!.height.toStringAsFixed(1)}',
            'cm',
            'Height',
            Icons.height_rounded,
          ),
          if (_child!.headCircumference != null) ...[
            Container(
              width: 1,
              height: 50,
              color: Colors.white24,
            ),
            _buildStatItem(
              '${_child!.headCircumference!.toStringAsFixed(1)}',
              'cm',
              'Head',
              Icons.child_care_rounded,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatItem(
    String value,
    String unit,
    String label,
    IconData icon,
  ) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 24),
        const SizedBox(height: 8),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 4, left: 2),
              child: Text(
                unit,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                ),
              ),
            ),
          ],
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  Widget _buildChartCard({
    required String title,
    required String subtitle,
    required Color color,
    required GrowthPercentile percentile,
  }) {
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neutral800,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.neutral500,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${percentile.percentile.toStringAsFixed(0)}th percentile',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 150,
            child: _buildSimpleChart(color, percentile.value),
          ),
          const SizedBox(height: 12),
          Text(
            percentile.interpretation,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.neutral600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSimpleChart(Color color, double currentValue) {
    // Simple demonstration chart
    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 1,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: AppTheme.neutral200,
              strokeWidth: 1,
            );
          },
        ),
        titlesData: FlTitlesData(
          show: true,
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '${value.toInt()}mo',
                    style: const TextStyle(
                      color: AppTheme.neutral400,
                      fontSize: 11,
                    ),
                  ),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        minX: 0,
        maxX: (_child?.ageInMonths ?? 12).toDouble(),
        minY: 0,
        maxY: currentValue * 1.2,
        lineBarsData: [
          LineChartBarData(
            spots: List.generate(
              (_child?.ageInMonths ?? 12) + 1,
              (i) => FlSpot(
                i.toDouble(),
                currentValue * (0.5 + (i / ((_child?.ageInMonths ?? 12) * 2))),
              ),
            ),
            isCurved: true,
            color: color,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                if (index == (_child?.ageInMonths ?? 0)) {
                  return FlDotCirclePainter(
                    radius: 6,
                    color: color,
                    strokeWidth: 2,
                    strokeColor: Colors.white,
                  );
                }
                return FlDotCirclePainter(
                  radius: 0,
                  color: Colors.transparent,
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              color: color.withOpacity(0.1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistory() {
    if (_timelineEntries.isEmpty && _analyses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.neutral200,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.history_rounded,
                size: 40,
                color: AppTheme.neutral400,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No history yet',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral600,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Events will appear here as you use the app',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.neutral500,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _timelineEntries.length,
      itemBuilder: (context, index) {
        final entry = _timelineEntries[index];
        return StaggeredListAnimation(
          index: index,
          child: _buildTimelineEntry(entry),
        );
      },
    );
  }

  Widget _buildTimelineEntry(Map<String, dynamic> entry) {
    final type = entry['type'] as String? ?? 'note';
    final title = entry['title'] as String? ?? '';
    final description = entry['description'] as String? ?? '';
    final dateStr = entry['date'] as String? ?? entry['createdAt'] as String? ?? '';
    final date = DateTime.tryParse(dateStr) ?? DateTime.now();
    final formattedDate = '${date.day}/${date.month}/${date.year}';

    final style = _getTimelineEntryStyle(type, entry['data']?['domain'] as String?);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.softShadow,
        border: type == 'milestone'
            ? const Border(left: BorderSide(color: Color(0xFFFBBF24), width: 4))
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: style['bgColor'] as Color,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Icon(
                style['icon'] as IconData,
                size: 22,
                color: style['iconColor'] as Color,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.neutral800,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: style['bgColor'] as Color,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        style['label'] as String,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: style['iconColor'] as Color,
                        ),
                      ),
                    ),
                  ],
                ),
                if (description.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      description,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.neutral500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  formattedDate,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.neutral400,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getTimelineEntryStyle(String type, [String? domain]) {
    switch (type) {
      case 'analysis':
        return {
          'icon': Icons.analytics_rounded,
          'bgColor': AppTheme.primaryGreen.withOpacity(0.1),
          'iconColor': AppTheme.primaryGreen,
          'label': 'Analysis',
        };
      case 'milestone':
        final domainColors = {
          'motor': AppTheme.secondaryBlue,
          'language': const Color(0xFFEC4899),
          'cognitive': AppTheme.secondaryPurple,
          'social': AppTheme.primaryGreen,
          'sensory': const Color(0xFF14B8A6),
        };
        final color = domainColors[domain] ?? const Color(0xFFF59E0B);
        return {
          'icon': Icons.emoji_events_rounded,
          'bgColor': color.withOpacity(0.1),
          'iconColor': color,
          'label': domain ?? 'Milestone',
        };
      case 'measurement':
        return {
          'icon': Icons.monitor_weight_rounded,
          'bgColor': AppTheme.secondaryBlue.withOpacity(0.1),
          'iconColor': AppTheme.secondaryBlue,
          'label': 'Growth',
        };
      case 'story':
        return {
          'icon': Icons.auto_stories_rounded,
          'bgColor': const Color(0xFF6366F1).withOpacity(0.1),
          'iconColor': const Color(0xFF6366F1),
          'label': 'Story',
        };
      case 'recipe_save':
        return {
          'icon': Icons.bookmark_rounded,
          'bgColor': const Color(0xFFF97316).withOpacity(0.1),
          'iconColor': const Color(0xFFF97316),
          'label': 'Recipe',
        };
      case 'voice_recording':
        return {
          'icon': Icons.mic_rounded,
          'bgColor': const Color(0xFF06B6D4).withOpacity(0.1),
          'iconColor': const Color(0xFF06B6D4),
          'label': 'Voice',
        };
      case 'photo':
        return {
          'icon': Icons.photo_camera_rounded,
          'bgColor': const Color(0xFFEC4899).withOpacity(0.1),
          'iconColor': const Color(0xFFEC4899),
          'label': 'Photo',
        };
      case 'note':
        return {
          'icon': Icons.sticky_note_2_rounded,
          'bgColor': AppTheme.secondaryPurple.withOpacity(0.1),
          'iconColor': AppTheme.secondaryPurple,
          'label': 'Note',
        };
      default:
        return {
          'icon': Icons.circle_outlined,
          'bgColor': AppTheme.neutral200,
          'iconColor': AppTheme.neutral500,
          'label': type,
        };
    }
  }

  void _addMeasurement() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddMeasurementSheet(
        child: _child!,
        onSave: (measurement) async {
          final storage = StorageService();
          await storage.saveMeasurement(measurement);
          _loadData();
        },
      ),
    );
  }
}

class _AddMeasurementSheet extends StatefulWidget {
  final ChildProfile child;
  final Function(GrowthMeasurement) onSave;

  const _AddMeasurementSheet({
    required this.child,
    required this.onSave,
  });

  @override
  State<_AddMeasurementSheet> createState() => _AddMeasurementSheetState();
}

class _AddMeasurementSheetState extends State<_AddMeasurementSheet> {
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _headController = TextEditingController();

  @override
  void dispose() {
    _weightController.dispose();
    _heightController.dispose();
    _headController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.neutral300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Add Measurement',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral900,
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _weightController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Weight (kg)',
                prefixIcon: Icon(Icons.monitor_weight_rounded),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _heightController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Height (cm)',
                prefixIcon: Icon(Icons.height_rounded),
              ),
            ),
            if (widget.child.ageInMonths < 36) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _headController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Head Circumference (cm)',
                  prefixIcon: Icon(Icons.child_care_rounded),
                ),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (_weightController.text.isEmpty &&
                      _heightController.text.isEmpty) {
                    return;
                  }

                  final measurement = GrowthMeasurement(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    childId: widget.child.id,
                    date: DateTime.now(),
                    weight: _weightController.text.isNotEmpty
                        ? double.tryParse(_weightController.text)
                        : null,
                    height: _heightController.text.isNotEmpty
                        ? double.tryParse(_heightController.text)
                        : null,
                    headCircumference: _headController.text.isNotEmpty
                        ? double.tryParse(_headController.text)
                        : null,
                  );

                  widget.onSave(measurement);
                  Navigator.pop(context);
                },
                child: const Text('Save Measurement'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
