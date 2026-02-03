import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/who_data_service.dart';
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
  List<GrowthMeasurement> _measurements = [];
  bool _isLoading = true;
  int _selectedTab = 0;

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() => _selectedTab = _tabController.index);
    });
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
      final measurements = await storage.getMeasurements(child.id);

      setState(() {
        _child = child;
        _analyses = analyses;
        _measurements = measurements;
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

    final percentiles = WHODataService.assessGrowth(_child!);

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
            percentile: percentiles.firstWhere(
              (p) => p.metric == 'weight',
              orElse: () => GrowthPercentile(
                metric: 'weight',
                value: _child!.weight,
                percentile: 50,
                interpretation: 'Typical',
                source: WHODataService.whoSources.first,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Height Chart
          _buildChartCard(
            title: 'Height Progress',
            subtitle: 'cm over time',
            color: AppTheme.primaryGreen,
            percentile: percentiles.firstWhere(
              (p) => p.metric == 'height',
              orElse: () => GrowthPercentile(
                metric: 'height',
                value: _child!.height,
                percentile: 50,
                interpretation: 'Typical',
                source: WHODataService.whoSources.first,
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
              percentile: percentiles.firstWhere(
                (p) => p.metric == 'headCircumference',
                orElse: () => GrowthPercentile(
                  metric: 'headCircumference',
                  value: _child!.headCircumference!,
                  percentile: 50,
                  interpretation: 'Typical',
                  source: WHODataService.whoSources.first,
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
    if (_analyses.isEmpty) {
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
              'No analysis history yet',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral600,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Run an analysis to start tracking',
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
      itemCount: _analyses.length,
      itemBuilder: (context, index) {
        final analysis = _analyses[index];
        return StaggeredListAnimation(
          index: index,
          child: _buildHistoryItem(analysis),
        );
      },
    );
  }

  Widget _buildHistoryItem(AnalysisResult analysis) {
    final date = analysis.timestamp;
    final formattedDate = '${date.day}/${date.month}/${date.year}';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.softShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: AnimatedCounter(
                value: analysis.overallScore.round(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryGreen,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Development Analysis',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.neutral800,
                  ),
                ),
                Text(
                  formattedDate,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            color: AppTheme.neutral400,
          ),
        ],
      ),
    );
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
                        ? double.parse(_weightController.text)
                        : null,
                    height: _heightController.text.isNotEmpty
                        ? double.parse(_heightController.text)
                        : null,
                    headCircumference: _headController.text.isNotEmpty
                        ? double.parse(_headController.text)
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
