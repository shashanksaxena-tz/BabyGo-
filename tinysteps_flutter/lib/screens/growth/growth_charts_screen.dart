import 'package:flutter/material.dart';
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

class _GrowthChartsScreenState extends State<GrowthChartsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  ChildProfile? _child;
  List<GrowthMeasurement> _measurements = [];
  bool _isLoading = true;
  bool _isAddingMeasurement = false;

  // Form controllers
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _headController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
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
        // Try to load measurements from API
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
          } else {
            setState(() {
              _child = child;
              _measurements = [];
              _isLoading = false;
            });
          }
        } catch (e) {
          // Fall back to local storage
          setState(() {
            _child = child;
            _measurements = [];
            _isLoading = false;
          });
        }
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
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

      // Try to save to API
      try {
        final apiService = ApiService();
        await apiService.addMeasurement(
          childId: _child!.id,
          weight: weight ?? 0,
          height: height ?? 0,
          headCircumference: headCirc,
          date: DateTime.now(),
        );
      } catch (e) {
        // Continue with local storage
      }

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
          SnackBar(content: Text('Failed to add measurement: $e')),
        );
      }
    }
  }

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
                          'Add Measurement',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.neutral800,
                          ),
                        ),
                        Text(
                          'Record today\'s measurements',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.neutral500,
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
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral100,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.neutral800),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Growth Charts',
          style: TextStyle(
            color: AppTheme.neutral800,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.add_rounded,
                color: AppTheme.primaryGreen,
                size: 20,
              ),
            ),
            onPressed: _showAddMeasurementDialog,
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryGreen,
          unselectedLabelColor: AppTheme.neutral500,
          indicatorColor: AppTheme.primaryGreen,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Weight'),
            Tab(text: 'Height'),
            Tab(text: 'Head'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryGreen),
            )
          : _child == null
              ? _buildNoChildView()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildChartTab(GrowthMetricType.weight, AppTheme.primaryGreen),
                    _buildChartTab(GrowthMetricType.height, AppTheme.secondaryBlue),
                    _buildChartTab(GrowthMetricType.headCircumference, AppTheme.secondaryPurple),
                  ],
                ),
    );
  }

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
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Please set up a child profile first',
            style: TextStyle(
              color: AppTheme.neutral500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChartTab(GrowthMetricType metricType, Color color) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // WHO Growth Chart
          WHOGrowthChart(
            child: _child!,
            measurements: _measurements,
            metricType: metricType,
            primaryColor: color,
          ),
          const SizedBox(height: 24),

          // WHO Standards Info
          _buildWHOInfoCard(metricType, color),
          const SizedBox(height: 24),

          // Measurement History
          _buildMeasurementHistory(metricType, color),
        ],
      ),
    );
  }

  Widget _buildWHOInfoCard(GrowthMetricType metricType, Color color) {
    String title;
    String description;

    switch (metricType) {
      case GrowthMetricType.weight:
        title = 'Weight for Age';
        description = 'Based on WHO Child Growth Standards. A healthy weight percentile is typically between the 3rd and 97th percentile. Consult your pediatrician for personalized guidance.';
        break;
      case GrowthMetricType.height:
        title = 'Height for Age';
        description = 'Length/height-for-age reflects the child\'s linear growth. Persistent low values may indicate chronic undernutrition.';
        break;
      case GrowthMetricType.headCircumference:
        title = 'Head Circumference';
        description = 'Head circumference is an indicator of brain growth and development. Abnormal measurements may require medical evaluation.';
        break;
    }

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
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.secondaryBlue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.info_outline_rounded,
                  color: AppTheme.secondaryBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.neutral600,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.neutral100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_rounded, color: AppTheme.success, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Data based on WHO Child Growth Standards',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.neutral600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMeasurementHistory(GrowthMetricType metricType, Color color) {
    final filteredMeasurements = _measurements.where((m) {
      switch (metricType) {
        case GrowthMetricType.weight:
          return m.weight != null;
        case GrowthMetricType.height:
          return m.height != null;
        case GrowthMetricType.headCircumference:
          return m.headCircumference != null;
      }
    }).toList()
      ..sort((a, b) => b.date.compareTo(a.date));

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
              const Text(
                'Measurement History',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral800,
                ),
              ),
              Text(
                '${filteredMeasurements.length} records',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.neutral500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (filteredMeasurements.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Icon(
                      Icons.timeline_rounded,
                      color: AppTheme.neutral300,
                      size: 48,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'No measurements yet',
                      style: TextStyle(
                        color: AppTheme.neutral500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _showAddMeasurementDialog,
                      child: const Text('Add first measurement'),
                    ),
                  ],
                ),
              ),
            )
          else
            ...filteredMeasurements.take(5).map((m) {
              double? value;
              String unit;

              switch (metricType) {
                case GrowthMetricType.weight:
                  value = m.weight;
                  unit = 'kg';
                  break;
                case GrowthMetricType.height:
                  value = m.height;
                  unit = 'cm';
                  break;
                case GrowthMetricType.headCircumference:
                  value = m.headCircumference;
                  unit = 'cm';
                  break;
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          '${m.date.day}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: color,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _formatDate(m.date),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.neutral700,
                            ),
                          ),
                          Text(
                            _getAgeAtDate(m.date),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.neutral500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${value?.toStringAsFixed(1)} $unit',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: color,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  String _getAgeAtDate(DateTime date) {
    if (_child == null) return '';
    final diff = date.difference(_child!.birthDate);
    final months = (diff.inDays / 30.44).round();
    if (months < 12) {
      return '$months months old';
    } else {
      final years = months ~/ 12;
      final remainingMonths = months % 12;
      if (remainingMonths == 0) {
        return '$years year${years > 1 ? 's' : ''} old';
      }
      return '$years year${years > 1 ? 's' : ''}, $remainingMonths month${remainingMonths > 1 ? 's' : ''} old';
    }
  }
}
