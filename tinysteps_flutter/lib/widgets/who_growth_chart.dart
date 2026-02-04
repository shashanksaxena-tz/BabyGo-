import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/models.dart';
import '../services/who_data_service.dart';
import '../utils/app_theme.dart';

/// Enhanced growth chart widget with WHO percentile curves overlay
class WHOGrowthChart extends StatelessWidget {
  final ChildProfile child;
  final List<GrowthMeasurement> measurements;
  final GrowthMetricType metricType;
  final Color primaryColor;

  const WHOGrowthChart({
    super.key,
    required this.child,
    required this.measurements,
    required this.metricType,
    this.primaryColor = AppTheme.primaryGreen,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getMetricIcon(),
                  color: primaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getMetricTitle(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.neutral800,
                      ),
                    ),
                    Text(
                      'WHO ${child.gender.name} growth standards',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.neutral500,
                      ),
                    ),
                  ],
                ),
              ),
              _buildCurrentValue(),
            ],
          ),
          const SizedBox(height: 16),
          // Legend
          _buildLegend(),
          const SizedBox(height: 12),
          // Chart
          Expanded(
            child: _buildChart(),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentValue() {
    final currentValue = _getCurrentValue();
    final percentile = _getCurrentPercentile();
    final unit = metricType == GrowthMetricType.weight ? 'kg' : 'cm';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          '${currentValue.toStringAsFixed(1)} $unit',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: primaryColor,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: _getPercentileColor(percentile).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '${percentile.toStringAsFixed(0)}th percentile',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: _getPercentileColor(percentile),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildLegendItem('3rd', AppTheme.neutral300),
        _buildLegendItem('15th', AppTheme.neutral400),
        _buildLegendItem('50th', AppTheme.neutral500),
        _buildLegendItem('85th', AppTheme.neutral400),
        _buildLegendItem('97th', AppTheme.neutral300),
        _buildLegendItem('Child', primaryColor, isChild: true),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color, {bool isChild = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: isChild ? 8 : 16,
            height: 3,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          if (isChild)
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(left: -4),
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: color,
              fontWeight: isChild ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChart() {
    final maxAge = (child.ageInMonths + 3).clamp(6, 36);
    final whoData = _getWHOPercentileData(maxAge);
    final childData = _getChildDataPoints();

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: true,
          horizontalInterval: _getYInterval(),
          verticalInterval: 3,
          getDrawingHorizontalLine: (value) => FlLine(
            color: AppTheme.neutral200,
            strokeWidth: 1,
            dashArray: [5, 5],
          ),
          getDrawingVerticalLine: (value) => FlLine(
            color: AppTheme.neutral200,
            strokeWidth: 1,
            dashArray: [5, 5],
          ),
        ),
        titlesData: FlTitlesData(
          show: true,
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            axisNameWidget: const Text(
              'Age (months)',
              style: TextStyle(fontSize: 10, color: AppTheme.neutral500),
            ),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              interval: 3,
              getTitlesWidget: (value, meta) {
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '${value.toInt()}',
                    style: const TextStyle(
                      color: AppTheme.neutral400,
                      fontSize: 10,
                    ),
                  ),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(
            axisNameWidget: Text(
              _getMetricUnit(),
              style: const TextStyle(fontSize: 10, color: AppTheme.neutral500),
            ),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              interval: _getYInterval(),
              getTitlesWidget: (value, meta) {
                return Text(
                  value.toStringAsFixed(0),
                  style: const TextStyle(
                    color: AppTheme.neutral400,
                    fontSize: 10,
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(
          show: true,
          border: Border(
            bottom: BorderSide(color: AppTheme.neutral300, width: 1),
            left: BorderSide(color: AppTheme.neutral300, width: 1),
          ),
        ),
        minX: 0,
        maxX: maxAge.toDouble(),
        minY: _getMinY(),
        maxY: _getMaxY(),
        lineTouchData: LineTouchData(
          enabled: true,
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                final isChildData = spot.barIndex == whoData.length;
                if (isChildData) {
                  return LineTooltipItem(
                    '${spot.y.toStringAsFixed(1)} ${_getMetricUnit()}\n${spot.x.toInt()} months',
                    TextStyle(
                      color: primaryColor,
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
        lineBarsData: [
          // WHO percentile curves
          ...whoData,
          // Child's actual data
          _buildChildDataLine(childData),
        ],
      ),
    );
  }

  List<LineChartBarData> _getWHOPercentileData(int maxAge) {
    final percentiles = [3.0, 15.0, 50.0, 85.0, 97.0];
    final colors = [
      AppTheme.neutral300,
      AppTheme.neutral400,
      AppTheme.neutral500,
      AppTheme.neutral400,
      AppTheme.neutral300,
    ];

    return List.generate(percentiles.length, (index) {
      final percentile = percentiles[index];
      final spots = _generateWHOCurve(percentile, maxAge);

      return LineChartBarData(
        spots: spots,
        isCurved: true,
        color: colors[index],
        barWidth: percentile == 50 ? 2 : 1,
        isStrokeCapRound: true,
        dotData: const FlDotData(show: false),
        belowBarData: BarAreaData(show: false),
        dashArray: percentile == 50 ? null : [5, 5],
      );
    });
  }

  List<FlSpot> _generateWHOCurve(double percentile, int maxAge) {
    final spots = <FlSpot>[];

    // Get WHO median data based on gender and metric
    final medians = _getWHOMedians();
    final sdFactor = _getSDFactor();

    // Calculate z-score for the percentile
    final zScore = _percentileToZScore(percentile);

    for (int month = 0; month <= maxAge && month < medians.length; month++) {
      final median = medians[month];
      final sd = median * sdFactor;
      final value = median + (zScore * sd);
      spots.add(FlSpot(month.toDouble(), value));
    }

    return spots;
  }

  LineChartBarData _buildChildDataLine(List<FlSpot> childData) {
    return LineChartBarData(
      spots: childData,
      isCurved: true,
      color: primaryColor,
      barWidth: 3,
      isStrokeCapRound: true,
      dotData: FlDotData(
        show: true,
        getDotPainter: (spot, percent, barData, index) {
          final isLatest = index == childData.length - 1;
          return FlDotCirclePainter(
            radius: isLatest ? 6 : 4,
            color: primaryColor,
            strokeWidth: isLatest ? 3 : 2,
            strokeColor: Colors.white,
          );
        },
      ),
      belowBarData: BarAreaData(
        show: true,
        color: primaryColor.withOpacity(0.1),
      ),
    );
  }

  List<FlSpot> _getChildDataPoints() {
    final spots = <FlSpot>[];

    // Add historical measurements
    for (final measurement in measurements) {
      final ageAtMeasurement = _getAgeAtDate(measurement.date);
      final value = _getMeasurementValue(measurement);
      if (value != null && ageAtMeasurement >= 0) {
        spots.add(FlSpot(ageAtMeasurement.toDouble(), value));
      }
    }

    // Add current value
    spots.add(FlSpot(child.ageInMonths.toDouble(), _getCurrentValue()));

    // Sort by age
    spots.sort((a, b) => a.x.compareTo(b.x));

    return spots;
  }

  int _getAgeAtDate(DateTime date) {
    final birth = child.birthDate;
    final diff = date.difference(birth);
    return (diff.inDays / 30.44).round();
  }

  double? _getMeasurementValue(GrowthMeasurement measurement) {
    switch (metricType) {
      case GrowthMetricType.weight:
        return measurement.weight;
      case GrowthMetricType.height:
        return measurement.height;
      case GrowthMetricType.headCircumference:
        return measurement.headCircumference;
    }
  }

  double _getCurrentValue() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return child.weight;
      case GrowthMetricType.height:
        return child.height;
      case GrowthMetricType.headCircumference:
        return child.headCircumference ?? 0;
    }
  }

  double _getCurrentPercentile() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return WHODataService.calculateWeightPercentile(
          weightKg: child.weight,
          ageMonths: child.ageInMonths,
          gender: child.gender,
        );
      case GrowthMetricType.height:
        return WHODataService.calculateHeightPercentile(
          heightCm: child.height,
          ageMonths: child.ageInMonths,
          gender: child.gender,
        );
      case GrowthMetricType.headCircumference:
        return WHODataService.calculateHeadCircumferencePercentile(
          headCircumferenceCm: child.headCircumference ?? 0,
          ageMonths: child.ageInMonths,
          gender: child.gender,
        );
    }
  }

  List<double> _getWHOMedians() {
    final isFemale = child.gender == Gender.female;

    switch (metricType) {
      case GrowthMetricType.weight:
        return isFemale
            ? WHODataService.girlsWeightMedian
            : WHODataService.boysWeightMedian;
      case GrowthMetricType.height:
        return isFemale
            ? WHODataService.girlsHeightMedian
            : WHODataService.boysHeightMedian;
      case GrowthMetricType.headCircumference:
        return isFemale
            ? WHODataService.girlsHCMedian
            : WHODataService.boysHCMedian;
    }
  }

  double _getSDFactor() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return 0.11;
      case GrowthMetricType.height:
        return 0.035;
      case GrowthMetricType.headCircumference:
        return 0.025;
    }
  }

  double _percentileToZScore(double percentile) {
    // Approximation of inverse normal CDF
    if (percentile <= 0) return -4;
    if (percentile >= 100) return 4;

    final p = percentile / 100;
    if (p == 0.5) return 0;

    // Use approximation
    final t = p < 0.5
        ? (-2 * _ln(p)).sqrt()
        : (-2 * _ln(1 - p)).sqrt();

    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;

    var z = t - (c0 + c1 * t + c2 * t * t) /
        (1 + d1 * t + d2 * t * t + d3 * t * t * t);

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
    for (int i = 2; i <= 100; i++) {
      term *= -y;
      result += term / i;
      if (term.abs() < 1e-15) break;
    }
    return result + y;
  }

  IconData _getMetricIcon() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return Icons.monitor_weight_rounded;
      case GrowthMetricType.height:
        return Icons.height_rounded;
      case GrowthMetricType.headCircumference:
        return Icons.child_care_rounded;
    }
  }

  String _getMetricTitle() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return 'Weight for Age';
      case GrowthMetricType.height:
        return 'Height for Age';
      case GrowthMetricType.headCircumference:
        return 'Head Circumference';
    }
  }

  String _getMetricUnit() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return 'kg';
      case GrowthMetricType.height:
        return 'cm';
      case GrowthMetricType.headCircumference:
        return 'cm';
    }
  }

  double _getMinY() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return 2;
      case GrowthMetricType.height:
        return 45;
      case GrowthMetricType.headCircumference:
        return 30;
    }
  }

  double _getMaxY() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return 18;
      case GrowthMetricType.height:
        return 105;
      case GrowthMetricType.headCircumference:
        return 55;
    }
  }

  double _getYInterval() {
    switch (metricType) {
      case GrowthMetricType.weight:
        return 2;
      case GrowthMetricType.height:
        return 10;
      case GrowthMetricType.headCircumference:
        return 5;
    }
  }

  Color _getPercentileColor(double percentile) {
    if (percentile < 3 || percentile > 97) {
      return AppTheme.error;
    } else if (percentile < 15 || percentile > 85) {
      return AppTheme.warning;
    }
    return AppTheme.success;
  }
}

enum GrowthMetricType {
  weight,
  height,
  headCircumference,
}

// Extension to expose WHO data from service
extension WHODataServiceExtension on WHODataService {
  static List<double> get boysWeightMedian => WHODataService.boysWeightMedian;
  static List<double> get girlsWeightMedian => WHODataService.girlsWeightMedian;
  static List<double> get boysHeightMedian => WHODataService.boysHeightMedian;
  static List<double> get girlsHeightMedian => WHODataService.girlsHeightMedian;
  static List<double> get boysHCMedian => WHODataService.boysHCMedian;
  static List<double> get girlsHCMedian => WHODataService.girlsHCMedian;
}

// Add these static getters to the WHODataService class
extension WHODataServiceStaticAccess on WHODataService {
  static const List<double> boysWeightMedian = [
    3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6,
    9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2,
    12.4, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.8, 14.0, 14.2, 14.3,
  ];

  static const List<double> girlsWeightMedian = [
    3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9,
    9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5,
    11.7, 11.9, 12.1, 12.3, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.9,
  ];

  static const List<double> boysHeightMedian = [
    49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7,
    76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8,
    88.0, 88.8, 89.6, 90.4, 91.2, 91.9, 92.7, 93.4, 94.1, 94.8, 95.4, 96.1,
  ];

  static const List<double> girlsHeightMedian = [
    49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0,
    75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4,
    86.6, 87.4, 88.3, 89.1, 89.9, 90.7, 91.4, 92.2, 92.9, 93.6, 94.4, 95.1,
  ];

  static const List<double> boysHCMedian = [
    34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1,
    46.3, 46.6, 46.8, 47.0, 47.2, 47.4, 47.5, 47.7, 47.8, 48.0, 48.1, 48.3,
    48.4, 48.5, 48.6, 48.8, 48.9, 49.0, 49.1, 49.2, 49.3, 49.4, 49.5, 49.6,
  ];

  static const List<double> girlsHCMedian = [
    33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9,
    45.2, 45.4, 45.7, 45.9, 46.1, 46.2, 46.4, 46.6, 46.7, 46.9, 47.0, 47.2,
    47.3, 47.4, 47.5, 47.6, 47.8, 47.9, 48.0, 48.1, 48.2, 48.3, 48.4, 48.5,
  ];
}
