import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/who_growth_chart.dart';

class GrowthChartsScreen extends StatefulWidget {
  const GrowthChartsScreen({super.key});

  @override
  State<GrowthChartsScreen> createState() => _GrowthChartsScreenState();
}

class _GrowthChartsScreenState extends State<GrowthChartsScreen> {
  ChildProfile? _child;
  List<GrowthMeasurement> _measurements = [];
  bool _isLoading = true;
  bool _isAddingMeasurement = false;
  int _selectedMetricIndex = 0; // 0=Weight, 1=Height, 2=Head

  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _headController = TextEditingController();

  static const List<String> _metricLabels = ['Weight', 'Height', 'Head Circ.'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _weightController.dispose();
    _heightController.dispose();
    _headController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final storage = StorageService();
      final child = await storage.getCurrentChild();

      if (child != null) {
        try {
          final apiService = ApiService();
          final result = await apiService.getMeasurements(child.id);
          if (result['success'] == true && result['data'] != null) {
            final measurementsList = (result['data'] as List)
                .map((m) => GrowthMeasurement.fromJson(m))
                .toList();
            setState(() {
              _child = child;
              _measurements = measurementsList;
              _isLoading = false;
            });
            return;
          }
        } catch (_) {}

        setState(() {
          _child = child;
          _measurements = [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _addMeasurement() async {
    if (_child == null) return;

    final weight = double.tryParse(_weightController.text);
    final height = double.tryParse(_heightController.text);
    final headCirc = double.tryParse(_headController.text);

    if (weight == null && height == null && headCirc == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter at least one measurement')),
      );
      return;
    }

    setState(() => _isAddingMeasurement = true);

    try {
      final measurement = GrowthMeasurement(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        childId: _child!.id,
        date: DateTime.now(),
        weight: weight,
        height: height,
        headCircumference: headCirc,
      );

      try {
        final apiService = ApiService();
        await apiService.addMeasurement(
          childId: _child!.id,
          weight: weight ?? 0,
          height: height ?? 0,
          headCircumference: headCirc,
          date: DateTime.now(),
        );
      } catch (_) {}

      setState(() {
        _measurements.add(measurement);
        _isAddingMeasurement = false;
      });

      _weightController.clear();
      _heightController.clear();
      _headController.clear();

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Measurement added successfully'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      setState(() => _isAddingMeasurement = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }

  GrowthMetricType get _currentMetricType {
    switch (_selectedMetricIndex) {
      case 0:
        return GrowthMetricType.weight;
      case 1:
        return GrowthMetricType.height;
      case 2:
        return GrowthMetricType.headCircumference;
      default:
        return GrowthMetricType.weight;
    }
  }

  Color get _currentColor {
    switch (_selectedMetricIndex) {
      case 0:
        return AppTheme.primaryGreen;
      case 1:
        return AppTheme.secondaryBlue;
      case 2:
        return AppTheme.secondaryPurple;
      default:
        return AppTheme.primaryGreen;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTheme.backgroundV3,
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }

    if (_child == null) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundV3,
        body: SafeArea(child: _buildNoChildView()),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(),
              const SizedBox(height: 16),

              // Current measurements row
              _buildCurrentMeasurements(),
              const SizedBox(height: 20),

              // Metric tab bar
              _buildMetricTabs(),
              const SizedBox(height: 16),

              // Chart card
              _buildChartCard(),
              const SizedBox(height: 20),

              // Current percentile section
              _buildPercentileSection(),
              const SizedBox(height: 16),

              // Last measured date
              _buildLastMeasuredDate(),
              const SizedBox(height: 16),

              // Log measurement button
              _buildLogMeasurementButton(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  // ---- HEADER ----
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: const Icon(Icons.arrow_back_rounded,
                color: AppTheme.textPrimary, size: 24),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Growth Charts',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          Icon(Icons.calendar_today_rounded,
              color: AppTheme.textSecondary, size: 20),
        ],
      ),
    );
  }

  // ---- CURRENT MEASUREMENTS ROW ----
  Widget _buildCurrentMeasurements() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _buildMeasurementStat('Weight', '${_child!.weight.toStringAsFixed(1)}', 'kg'),
          const SizedBox(width: 16),
          _buildMeasurementStat('Height', '${_child!.height.toStringAsFixed(0)}', 'cm'),
          const SizedBox(width: 16),
          _buildMeasurementStat(
            'Head',
            _child!.headCircumference != null
                ? '${_child!.headCircumference!.toStringAsFixed(0)}'
                : '--',
            'cm',
          ),
          const Spacer(),
          // Leo avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.greenTint,
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.2), width: 2),
            ),
            child: const Center(
              child: Text('\u{1F476}', style: TextStyle(fontSize: 22)),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildMeasurementStat(String label, String value, String unit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 2),
        RichText(
          text: TextSpan(
            style: const TextStyle(
              fontFamily: 'Nunito',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
            children: [
              TextSpan(text: value),
              TextSpan(
                text: ' $unit',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---- METRIC TABS ----
  Widget _buildMetricTabs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 40,
        decoration: BoxDecoration(
          color: AppTheme.neutral100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: List.generate(_metricLabels.length, (index) {
            final isSelected = _selectedMetricIndex == index;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedMetricIndex = index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primaryGreen : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      _metricLabels[index],
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? Colors.white : AppTheme.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  // ---- CHART CARD ----
  Widget _buildChartCard() {
    String chartTitle;
    switch (_selectedMetricIndex) {
      case 0:
        chartTitle = 'Weight Over Time';
        break;
      case 1:
        chartTitle = 'Height Over Time';
        break;
      case 2:
        chartTitle = 'Head Circ. Over Time';
        break;
      default:
        chartTitle = 'Weight Over Time';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title row
            Row(
              children: [
                Text(
                  chartTitle,
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const Spacer(),
                Text(
                  'WHO Standards',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Chart
            SizedBox(
              height: 220,
              child: _buildV3Chart(),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms);
  }

  Widget _buildV3Chart() {
    final maxAge = (_child!.ageInMonths + 3).clamp(6, 36);
    final color = _currentColor;

    // WHO medians for weight (boys)
    // These are approximate and used for visualization
    List<double> medians;
    double sdFactor;
    double minY, maxY;
    String unit;

    switch (_currentMetricType) {
      case GrowthMetricType.weight:
        medians = [
          3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6,
          9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2,
        ];
        sdFactor = 0.11;
        minY = 0;
        maxY = 16;
        unit = 'kg';
        break;
      case GrowthMetricType.height:
        medians = [
          49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3,
          74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1,
          86.0, 86.9, 87.8,
        ];
        sdFactor = 0.035;
        minY = 45;
        maxY = 105;
        unit = 'cm';
        break;
      case GrowthMetricType.headCircumference:
        medians = [
          34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4,
          45.8, 46.1, 46.3, 46.6, 46.8, 47.0, 47.2, 47.4, 47.5, 47.7, 47.8,
          48.0, 48.1, 48.3,
        ];
        sdFactor = 0.025;
        minY = 30;
        maxY = 55;
        unit = 'cm';
        break;
    }

    // Generate WHO percentile band data
    List<FlSpot> generatePercentileLine(double percentile) {
      final spots = <FlSpot>[];
      final zScore = _percentileToZScore(percentile);
      for (int month = 0; month <= maxAge && month < medians.length; month++) {
        final median = medians[month];
        final sd = median * sdFactor;
        spots.add(FlSpot(month.toDouble(), median + zScore * sd));
      }
      return spots;
    }

    // Child data
    List<FlSpot> childSpots = [];
    for (final m in _measurements) {
      final age = _getAgeAtDate(m.date);
      double? val;
      switch (_currentMetricType) {
        case GrowthMetricType.weight:
          val = m.weight;
          break;
        case GrowthMetricType.height:
          val = m.height;
          break;
        case GrowthMetricType.headCircumference:
          val = m.headCircumference;
          break;
      }
      if (val != null && age >= 0) {
        childSpots.add(FlSpot(age.toDouble(), val));
      }
    }
    // Add current
    double currentVal;
    switch (_currentMetricType) {
      case GrowthMetricType.weight:
        currentVal = _child!.weight;
        break;
      case GrowthMetricType.height:
        currentVal = _child!.height;
        break;
      case GrowthMetricType.headCircumference:
        currentVal = _child!.headCircumference ?? 0;
        break;
    }
    childSpots.add(FlSpot(_child!.ageInMonths.toDouble(), currentVal));
    childSpots.sort((a, b) => a.x.compareTo(b.x));

    // Percentile lines
    final p97 = generatePercentileLine(97);
    final p85 = generatePercentileLine(85);
    final p50 = generatePercentileLine(50);
    final p15 = generatePercentileLine(15);
    final p3 = generatePercentileLine(3);

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: true,
          horizontalInterval: _currentMetricType == GrowthMetricType.weight ? 2 : 10,
          verticalInterval: 6,
          getDrawingHorizontalLine: (_) => FlLine(
            color: AppTheme.neutral200,
            strokeWidth: 0.5,
          ),
          getDrawingVerticalLine: (_) => FlLine(
            color: AppTheme.neutral200,
            strokeWidth: 0.5,
          ),
        ),
        titlesData: FlTitlesData(
          rightTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 36,
              getTitlesWidget: (value, meta) {
                // Show percentile labels on right edge
                // We'll skip this for now -- too complex for inline
                return const SizedBox.shrink();
              },
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              interval: 6,
              getTitlesWidget: (value, meta) {
                final months = value.toInt();
                String label;
                if (months == 0) {
                  label = '0';
                } else {
                  label = '${months}m';
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 10,
                      color: AppTheme.textTertiary,
                    ),
                  ),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              interval: _currentMetricType == GrowthMetricType.weight ? 2 : 10,
              getTitlesWidget: (value, meta) {
                return Text(
                  value.toInt().toString(),
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 10,
                    color: AppTheme.textTertiary,
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(
          show: true,
          border: const Border(
            bottom: BorderSide(color: AppTheme.neutral300, width: 1),
            left: BorderSide(color: AppTheme.neutral300, width: 1),
          ),
        ),
        minX: 0,
        maxX: maxAge.toDouble(),
        minY: minY,
        maxY: maxY,
        lineBarsData: [
          // 97th percentile band (top)
          _whoCurve(p97, color.withOpacity(0.15), dashArray: [4, 4]),
          // 85th
          _whoCurve(p85, color.withOpacity(0.25), dashArray: [4, 4]),
          // 50th (median - solid)
          _whoCurve(p50, color.withOpacity(0.4)),
          // 15th
          _whoCurve(p15, color.withOpacity(0.25), dashArray: [4, 4]),
          // 3rd
          _whoCurve(p3, color.withOpacity(0.15), dashArray: [4, 4]),

          // Filled area between 3rd and 97th
          LineChartBarData(
            spots: p97,
            isCurved: true,
            color: Colors.transparent,
            barWidth: 0,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: color.withOpacity(0.06),
            ),
          ),

          // Child data line
          LineChartBarData(
            spots: childSpots,
            isCurved: true,
            color: color,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                return FlDotCirclePainter(
                  radius: index == childSpots.length - 1 ? 5 : 3.5,
                  color: color,
                  strokeWidth: 2,
                  strokeColor: Colors.white,
                );
              },
            ),
            belowBarData: BarAreaData(show: false),
          ),
        ],
        lineTouchData: LineTouchData(
          enabled: true,
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (spots) {
              return spots.map((spot) {
                // Only show tooltip for child data (last line)
                if (spot.barIndex == 6) {
                  return LineTooltipItem(
                    '${spot.y.toStringAsFixed(1)} $unit\n${spot.x.toInt()}m',
                    TextStyle(
                      color: color,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  );
                }
                return null;
              }).toList();
            },
          ),
        ),
      ),
    );
  }

  LineChartBarData _whoCurve(List<FlSpot> spots, Color color,
      {List<int>? dashArray}) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      color: color,
      barWidth: 1.5,
      isStrokeCapRound: true,
      dotData: const FlDotData(show: false),
      belowBarData: BarAreaData(show: false),
      dashArray: dashArray,
    );
  }

  // ---- PERCENTILE SECTION ----
  Widget _buildPercentileSection() {
    // Calculate a rough percentile based on current value
    final percentile = _estimatePercentile();
    final isHealthy = percentile >= 3 && percentile <= 97;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Current Percentile',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${percentile.toStringAsFixed(0)}${_ordinalSuffix(percentile.toInt())}',
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 40,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const Text(
                'percentile',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isHealthy
                  ? AppTheme.primaryGreen.withOpacity(0.1)
                  : AppTheme.warning.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isHealthy
                      ? Icons.check_circle_rounded
                      : Icons.info_outline_rounded,
                  size: 18,
                  color: isHealthy ? AppTheme.primaryGreen : AppTheme.warning,
                ),
                const SizedBox(width: 6),
                Text(
                  isHealthy ? 'Healthy range' : 'Monitor',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color:
                        isHealthy ? AppTheme.primaryGreen : AppTheme.warning,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms, delay: 400.ms);
  }

  // ---- LAST MEASURED DATE ----
  Widget _buildLastMeasuredDate() {
    final lastDate = _measurements.isNotEmpty
        ? _measurements
            .reduce((a, b) => a.date.isAfter(b.date) ? a : b)
            .date
        : DateTime.now();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Text(
        'Last measured: ${_formatDate(lastDate)}',
        style: const TextStyle(
          fontFamily: 'Inter',
          fontSize: 13,
          color: AppTheme.textSecondary,
        ),
      ),
    );
  }

  // ---- LOG MEASUREMENT BUTTON ----
  Widget _buildLogMeasurementButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton.icon(
          onPressed: _showAddMeasurementDialog,
          icon: const Icon(Icons.add_rounded, size: 20),
          label: const Text(
            'Log Measurement',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryGreen,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
    );
  }

  // ---- ADD MEASUREMENT DIALOG ----
  void _showAddMeasurementDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
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
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.neutral300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.add_chart_rounded,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Log Measurement',
                          style: TextStyle(
                            fontFamily: 'Nunito',
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          "Record today's measurements",
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _buildMeasurementInput(
                controller: _weightController,
                label: 'Weight',
                unit: 'kg',
                icon: Icons.monitor_weight_rounded,
                color: AppTheme.primaryGreen,
              ),
              const SizedBox(height: 16),
              _buildMeasurementInput(
                controller: _heightController,
                label: 'Height',
                unit: 'cm',
                icon: Icons.height_rounded,
                color: AppTheme.secondaryBlue,
              ),
              const SizedBox(height: 16),
              _buildMeasurementInput(
                controller: _headController,
                label: 'Head Circumference',
                unit: 'cm',
                icon: Icons.child_care_rounded,
                color: AppTheme.secondaryPurple,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isAddingMeasurement ? null : _addMeasurement,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isAddingMeasurement
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Save Measurement',
                          style: TextStyle(
                            fontFamily: 'Nunito',
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMeasurementInput({
    required TextEditingController controller,
    required String label,
    required String unit,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: label,
                labelStyle: TextStyle(color: color),
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Text(
            unit,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // ---- NO CHILD VIEW ----
  Widget _buildNoChildView() {
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
              Icons.person_outline_rounded,
              color: AppTheme.neutral400,
              size: 40,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No child profile found',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Please set up a child profile first',
            style: TextStyle(
              fontFamily: 'Inter',
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  // ---- HELPERS ----
  double _percentileToZScore(double percentile) {
    if (percentile <= 0) return -4;
    if (percentile >= 100) return 4;
    final p = percentile / 100;
    if (p == 0.5) return 0;
    final t = p < 0.5
        ? (-2 * _ln(p)).clamp(0, 100).toDouble()
        : (-2 * _ln(1 - p)).clamp(0, 100).toDouble();
    final sqrtT = _sqrt(t);

    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;

    var z = sqrtT -
        (c0 + c1 * sqrtT + c2 * sqrtT * sqrtT) /
            (1 + d1 * sqrtT + d2 * sqrtT * sqrtT + d3 * sqrtT * sqrtT * sqrtT);

    return p < 0.5 ? -z : z;
  }

  double _ln(double x) {
    if (x <= 0) return -999;
    double result = 0;
    while (x > 2) {
      x /= 2.718281828;
      result += 1;
    }
    final y = x - 1;
    var term = y;
    for (int i = 2; i <= 50; i++) {
      term *= -y;
      result += term / i;
      if (term.abs() < 1e-12) break;
    }
    return result + y;
  }

  double _sqrt(double x) => math.sqrt(x.clamp(0, double.infinity));

  int _getAgeAtDate(DateTime date) {
    final birth = _child!.dateOfBirth;
    final diff = date.difference(birth);
    return (diff.inDays / 30.44).round();
  }

  double _estimatePercentile() {
    // Simple rough percentile estimation
    // Use z-score from WHO median
    List<double> medians;
    double sdFactor;
    double currentVal;

    switch (_currentMetricType) {
      case GrowthMetricType.weight:
        medians = [
          3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6,
          9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2,
        ];
        sdFactor = 0.11;
        currentVal = _child!.weight;
        break;
      case GrowthMetricType.height:
        medians = [
          49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3,
          74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1,
          86.0, 86.9, 87.8,
        ];
        sdFactor = 0.035;
        currentVal = _child!.height;
        break;
      case GrowthMetricType.headCircumference:
        medians = [
          34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4,
          45.8, 46.1, 46.3, 46.6, 46.8, 47.0, 47.2, 47.4, 47.5, 47.7, 47.8,
          48.0, 48.1, 48.3,
        ];
        sdFactor = 0.025;
        currentVal = _child!.headCircumference ?? 0;
        break;
    }

    final age = _child!.ageInMonths.clamp(0, medians.length - 1);
    final median = medians[age];
    final sd = median * sdFactor;
    if (sd == 0) return 50;
    final zScore = (currentVal - median) / sd;

    // Convert z-score to rough percentile
    // Using a simple approximation
    if (zScore <= -3) return 0.1;
    if (zScore >= 3) return 99.9;
    // Rough lookup
    final percentile = 50 + (zScore * 15).clamp(-49.9, 49.9);
    return percentile.clamp(0.1, 99.9);
  }

  String _ordinalSuffix(int n) {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
