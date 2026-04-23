import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';
import '../profile_setup/profile_setup_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  late AnimationController _backgroundController;
  late AnimationController _contentController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      title: 'Track Your\nChild\'s Growth',
      description: 'Monitor development milestones based on WHO standards with AI-powered insights',
      emoji: '📊',
      gradient: [AppTheme.primaryGreen, AppTheme.primaryTeal],
      decorations: ['👶', '📈', '✨', '🌟'],
    ),
    OnboardingPage(
      title: 'Capture\nPrecious Moments',
      description: 'Upload photos, videos, and baby voice recordings for detailed analysis',
      emoji: '📸',
      gradient: [AppTheme.secondaryBlue, AppTheme.secondaryPurple],
      decorations: ['🎥', '🎤', '💫', '🌈'],
    ),
    OnboardingPage(
      title: 'Get Personalized\nInsights',
      description: 'Receive AI recommendations, bedtime stories, and development activities',
      emoji: '✨',
      gradient: [AppTheme.secondaryPurple, AppTheme.secondaryPink],
      decorations: ['📚', '🎨', '🧸', '💝'],
    ),
    OnboardingPage(
      title: 'Begin Your\nJourney',
      description: 'Let\'s set up your child\'s profile and start tracking their amazing progress',
      emoji: '🚀',
      gradient: [AppTheme.secondaryOrange, AppTheme.secondaryYellow],
      decorations: ['🎉', '⭐', '🌟', '💫'],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();

    _contentController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _contentController,
        curve: const Interval(0, 0.6, curve: Curves.easeOut),
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _contentController,
      curve: Curves.easeOutCubic,
    ));

    _contentController.forward();
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _contentController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() => _currentPage = page);
    _contentController.reset();
    _contentController.forward();
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOutCubic,
      );
    } else {
      _getStarted();
    }
  }

  void _getStarted() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const ProfileSetupScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.1),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutCubic,
              )),
              child: child,
            ),
          );
        },
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Animated Background
          AnimatedBuilder(
            animation: _backgroundController,
            builder: (context, child) {
              return Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: _pages[_currentPage].gradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    transform: GradientRotation(
                      _backgroundController.value * 2 * math.pi * 0.1,
                    ),
                  ),
                ),
              );
            },
          ),

          // Floating Decorations
          ..._buildDecorations(),

          // Content
          SafeArea(
            child: Column(
              children: [
                // Skip Button
                Align(
                  alignment: Alignment.topRight,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: TextButton(
                      onPressed: _getStarted,
                      child: Text(
                        _currentPage < _pages.length - 1 ? 'Skip' : '',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),

                // Page Content
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: _onPageChanged,
                    itemCount: _pages.length,
                    itemBuilder: (context, index) {
                      return _buildPage(_pages[index]);
                    },
                  ),
                ),

                // Bottom Section
                Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      // Page Indicators
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _pages.length,
                          (index) => _buildIndicator(index),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Next/Get Started Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _nextPage,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: _pages[_currentPage].gradient[0],
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                _currentPage < _pages.length - 1
                                    ? 'Next'
                                    : 'Get Started',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                _currentPage < _pages.length - 1
                                    ? Icons.arrow_forward_rounded
                                    : Icons.rocket_launch_rounded,
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPage(OnboardingPage page) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Emoji with Animation
              FloatingAnimation(
                offset: 8,
                duration: const Duration(milliseconds: 2500),
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(40),
                  ),
                  child: Center(
                    child: Text(
                      page.emoji,
                      style: const TextStyle(fontSize: 64),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 48),

              // Title
              Text(
                page.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 20),

              // Description
              Text(
                page.description,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIndicator(int index) {
    final isActive = index == _currentPage;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: isActive ? 32 : 10,
      height: 10,
      decoration: BoxDecoration(
        color: isActive ? Colors.white : Colors.white38,
        borderRadius: BorderRadius.circular(5),
      ),
    );
  }

  List<Widget> _buildDecorations() {
    final decorations = _pages[_currentPage].decorations;
    final screenSize = MediaQuery.of(context).size;

    return List.generate(decorations.length, (index) {
      final random = math.Random(index);
      final startX = random.nextDouble() * screenSize.width;
      final startY = random.nextDouble() * screenSize.height;

      return AnimatedBuilder(
        animation: _backgroundController,
        builder: (context, child) {
          final offset = math.sin(
            _backgroundController.value * 2 * math.pi + index,
          ) * 20;

          return Positioned(
            left: startX,
            top: startY + offset,
            child: Opacity(
              opacity: 0.3,
              child: Text(
                decorations[index],
                style: TextStyle(fontSize: 24 + index * 4.0),
              ),
            ),
          );
        },
      );
    });
  }
}

class OnboardingPage {
  final String title;
  final String description;
  final String emoji;
  final List<Color> gradient;
  final List<String> decorations;

  const OnboardingPage({
    required this.title,
    required this.description,
    required this.emoji,
    required this.gradient,
    required this.decorations,
  });
}
