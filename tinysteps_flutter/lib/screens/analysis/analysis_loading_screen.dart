import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/gemini_service.dart';
import '../../services/storage_service.dart';
import '../../utils/app_theme.dart';
import 'analysis_results_screen.dart';

class AnalysisLoadingScreen extends StatefulWidget {
  final ChildProfile child;
  final List<File> mediaFiles;
  final File? audioFile;

  const AnalysisLoadingScreen({
    super.key,
    required this.child,
    required this.mediaFiles,
    this.audioFile,
  });

  @override
  State<AnalysisLoadingScreen> createState() => _AnalysisLoadingScreenState();
}

class _AnalysisLoadingScreenState extends State<AnalysisLoadingScreen>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _pulseController;
  late AnimationController _progressController;

  int _currentStep = 0;
  String _statusMessage = 'Preparing analysis...';
  bool _hasError = false;
  String? _errorMessage;

  final List<String> _steps = [
    'Preparing media...',
    'Analyzing images and videos...',
    'Processing audio (if available)...',
    'Comparing with WHO milestones...',
    'Generating personalized insights...',
    'Finalizing report...',
  ];

  final List<String> _funFacts = [
    'Babies can recognize their mother\'s voice at birth',
    'Newborns can see clearly about 8-12 inches away',
    'Babies learn language even before they can speak',
    'Touch is the first sense to develop in babies',
    'Babies smile socially around 6-8 weeks old',
    'Music helps brain development in infants',
  ];

  late String _currentFunFact;

  @override
  void initState() {
    super.initState();

    _currentFunFact = _funFacts[math.Random().nextInt(_funFacts.length)];

    _rotationController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat();

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _progressController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _startAnalysis();
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _pulseController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  Future<void> _startAnalysis() async {
    try {
      // Step 1: Preparing
      await _updateStep(0, 'Preparing media files...');
      await Future.delayed(const Duration(milliseconds: 800));

      // Step 2: Analyzing media
      await _updateStep(1, 'Analyzing images and videos...');
      await Future.delayed(const Duration(milliseconds: 500));

      // Step 3: Audio (if available)
      if (widget.audioFile != null) {
        await _updateStep(2, 'Processing baby voice recording...');
        await Future.delayed(const Duration(milliseconds: 500));
      }

      // Step 4: WHO comparison
      await _updateStep(3, 'Comparing with WHO developmental milestones...');

      // Perform actual analysis
      final gemini = GeminiService();
      final storage = StorageService();

      // Check if API key exists
      final apiKey = storage.getApiKey();
      if (apiKey == null || apiKey.isEmpty) {
        throw Exception('Please set your Gemini API key in Settings');
      }

      if (!gemini.isInitialized) {
        await gemini.initialize(apiKey);
      }

      // Step 5: Generate insights
      await _updateStep(4, 'Generating personalized insights...');

      final result = await gemini.analyzeDevelopment(
        child: widget.child,
        mediaFiles: widget.mediaFiles,
        audioFile: widget.audioFile,
      );

      // Step 6: Finalizing
      await _updateStep(5, 'Finalizing your report...');

      // Save result
      await storage.saveAnalysis(result);

      // Navigate to results
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => AnalysisResultsScreen(
              child: widget.child,
              result: result,
            ),
            transitionsBuilder: (_, animation, __, child) {
              return FadeTransition(opacity: animation, child: child);
            },
            transitionDuration: const Duration(milliseconds: 500),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _hasError = true;
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _updateStep(int step, String message) async {
    setState(() {
      _currentStep = step;
      _statusMessage = message;
    });
    _progressController.forward(from: 0);
    await Future.delayed(const Duration(milliseconds: 300));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Back button (only if error)
                if (_hasError)
                  Align(
                    alignment: Alignment.topLeft,
                    child: IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                  ),

                const Spacer(),

                // Main animation
                _buildMainAnimation(),

                const SizedBox(height: 48),

                // Status
                if (_hasError)
                  _buildErrorView()
                else
                  _buildProgressView(),

                const Spacer(),

                // Fun fact
                if (!_hasError) _buildFunFact(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMainAnimation() {
    return SizedBox(
      width: 200,
      height: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer rotating ring
          AnimatedBuilder(
            animation: _rotationController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _rotationController.value * 2 * math.pi,
                child: Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppTheme.primaryGreen.withOpacity(0.3),
                      width: 3,
                    ),
                    gradient: SweepGradient(
                      colors: [
                        AppTheme.primaryGreen.withOpacity(0.0),
                        AppTheme.primaryGreen,
                        AppTheme.primaryGreen.withOpacity(0.0),
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                  ),
                ),
              );
            },
          ),

          // Inner pulsing circle
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              return Transform.scale(
                scale: 0.9 + (_pulseController.value * 0.1),
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppTheme.primaryGreen.withOpacity(0.3),
                        AppTheme.primaryGreen.withOpacity(0.1),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),

          // Center content
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryGreen.withOpacity(0.2),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Center(
              child: _hasError
                  ? const Icon(
                      Icons.error_outline_rounded,
                      size: 48,
                      color: AppTheme.error,
                    )
                  : const Text(
                      '🧒',
                      style: TextStyle(fontSize: 48),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressView() {
    return Column(
      children: [
        Text(
          'Analyzing ${widget.child.displayName}',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppTheme.neutral900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _statusMessage,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 16,
            color: AppTheme.neutral600,
          ),
        ),
        const SizedBox(height: 32),

        // Progress indicator
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppTheme.softShadow,
          ),
          child: Column(
            children: List.generate(_steps.length, (index) {
              final isActive = index == _currentStep;
              final isDone = index < _currentStep;

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone
                            ? AppTheme.success
                            : isActive
                                ? AppTheme.primaryGreen
                                : AppTheme.neutral200,
                      ),
                      child: Center(
                        child: isDone
                            ? const Icon(Icons.check_rounded,
                                color: Colors.white, size: 16)
                            : isActive
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(
                                    '${index + 1}',
                                    style: const TextStyle(
                                      color: AppTheme.neutral500,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _steps[index].replaceAll('...', ''),
                        style: TextStyle(
                          fontSize: 14,
                          color: isDone || isActive
                              ? AppTheme.neutral800
                              : AppTheme.neutral400,
                          fontWeight:
                              isActive ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorView() {
    return Column(
      children: [
        const Text(
          'Analysis Failed',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppTheme.error,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.error.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            _errorMessage ?? 'An unexpected error occurred',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.error,
            ),
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Go Back'),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _hasError = false;
                  _errorMessage = null;
                  _currentStep = 0;
                });
                _startAnalysis();
              },
              child: const Text('Try Again'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFunFact() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.secondaryPurple.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lightbulb_rounded,
                  color: AppTheme.secondaryPurple, size: 20),
              SizedBox(width: 8),
              Text(
                'Did you know?',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.secondaryPurple,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _currentFunFact,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.secondaryPurple.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }
}
