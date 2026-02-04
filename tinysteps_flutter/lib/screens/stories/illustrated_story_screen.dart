import 'dart:math';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/gemini_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

class IllustratedStoryScreen extends StatefulWidget {
  final BedtimeStory story;
  final ChildProfile child;

  const IllustratedStoryScreen({
    super.key,
    required this.story,
    required this.child,
  });

  @override
  State<IllustratedStoryScreen> createState() => _IllustratedStoryScreenState();
}

class _IllustratedStoryScreenState extends State<IllustratedStoryScreen>
    with TickerProviderStateMixin {
  late PageController _pageController;
  int _currentPage = 0;
  bool _showCover = true;
  bool _isGeneratingImages = false;
  Map<int, String> _generatedImages = {};

  late AnimationController _pageFlipController;
  late Animation<double> _pageFlipAnimation;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _pageFlipController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _pageFlipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _pageFlipController, curve: Curves.easeInOutCubic),
    );

    // Start generating illustrations
    _generateIllustrations();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _pageFlipController.dispose();
    super.dispose();
  }

  Future<void> _generateIllustrations() async {
    setState(() => _isGeneratingImages = true);

    // Generate images for each page using Gemini
    final gemini = GeminiService();
    final storage = StorageService();
    final apiKey = storage.getApiKey();

    if (apiKey == null || !gemini.isInitialized) {
      if (apiKey != null) {
        await gemini.initialize(apiKey);
      } else {
        setState(() => _isGeneratingImages = false);
        return;
      }
    }

    for (int i = 0; i < widget.story.pages.length; i++) {
      final page = widget.story.pages[i];
      if (page.illustrationPrompt != null) {
        try {
          // Generate illustration based on the prompt and child's appearance
          final imageUrl = await gemini.generateStoryIllustration(
            prompt: page.illustrationPrompt!,
            childName: widget.child.name,
            childPhotoUrl: widget.child.photoUrl,
            theme: widget.story.theme,
          );

          if (mounted && imageUrl != null) {
            setState(() {
              _generatedImages[i] = imageUrl;
            });
          }
        } catch (e) {
          // Continue without image for this page
          debugPrint('Failed to generate image for page $i: $e');
        }
      }
    }

    if (mounted) {
      setState(() => _isGeneratingImages = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );

    return Scaffold(
      backgroundColor: _getBackgroundColor(themeColor),
      body: SafeArea(
        child: Stack(
          children: [
            // Background decorations
            _buildBackgroundDecorations(themeColor),

            // Main content
            Column(
              children: [
                // Header
                _buildHeader(themeColor),

                // Book view
                Expanded(
                  child: _showCover
                      ? _buildBookCover(themeColor)
                      : _buildBookPages(themeColor),
                ),

                // Navigation
                if (!_showCover) _buildNavigation(themeColor),
              ],
            ),

            // Loading overlay for image generation
            if (_isGeneratingImages)
              Positioned(
                top: 100,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Creating illustrations...',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ],
                  ),
                ).animate().fadeIn(),
              ),
          ],
        ),
      ),
    );
  }

  Color _getBackgroundColor(Color themeColor) {
    // Create a warm, cozy background based on theme
    return Color.lerp(themeColor.withOpacity(0.1), Colors.white, 0.7)!;
  }

  Widget _buildBackgroundDecorations(Color themeColor) {
    return Stack(
      children: [
        // Stars for night themes
        if (widget.story.theme.id == 'space' || widget.story.theme.id == 'dreams')
          ...List.generate(20, (index) {
            final random = Random(index);
            return Positioned(
              left: random.nextDouble() * MediaQuery.of(context).size.width,
              top: random.nextDouble() * MediaQuery.of(context).size.height * 0.5,
              child: Icon(
                Icons.star,
                size: random.nextDouble() * 12 + 4,
                color: Colors.amber.withOpacity(0.3 + random.nextDouble() * 0.3),
              ).animate(
                onPlay: (c) => c.repeat(reverse: true),
              ).fadeIn(
                delay: Duration(milliseconds: random.nextInt(1000)),
                duration: Duration(milliseconds: 1000 + random.nextInt(1000)),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildHeader(Color themeColor) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close_rounded),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.neutral700,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const Spacer(),
          if (!_showCover)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: AppTheme.softShadow,
              ),
              child: Text(
                'Page ${_currentPage + 1} of ${widget.story.pages.length}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: themeColor,
                ),
              ),
            ),
          const Spacer(),
          IconButton(
            onPressed: () => _toggleFavorite(),
            icon: Icon(
              widget.story.isFavorite
                  ? Icons.favorite_rounded
                  : Icons.favorite_border_rounded,
            ),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: widget.story.isFavorite
                  ? AppTheme.secondaryPink
                  : AppTheme.neutral400,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookCover(Color themeColor) {
    return GestureDetector(
      onTap: () {
        setState(() => _showCover = false);
      },
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          constraints: const BoxConstraints(maxWidth: 350, maxHeight: 500),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                themeColor,
                themeColor.withOpacity(0.8),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: themeColor.withOpacity(0.4),
                blurRadius: 30,
                offset: const Offset(0, 15),
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(5, 5),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Book spine effect
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                width: 20,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withOpacity(0.3),
                        Colors.transparent,
                      ],
                    ),
                    borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(16),
                    ),
                  ),
                ),
              ),

              // Cover content
              Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Theme emoji with glow
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          widget.story.theme.emoji,
                          style: const TextStyle(fontSize: 56),
                        ),
                      ),
                    ).animate().scale(
                      duration: const Duration(milliseconds: 600),
                      curve: Curves.elasticOut,
                    ),

                    const SizedBox(height: 32),

                    // Title
                    Text(
                      widget.story.title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        height: 1.2,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),

                    const SizedBox(height: 16),

                    // Starring
                    Text(
                      'Starring ${widget.child.name}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(0.9),
                        fontStyle: FontStyle.italic,
                      ),
                    ).animate().fadeIn(delay: 400.ms),

                    const Spacer(),

                    // Tap to start
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.menu_book_rounded, color: themeColor),
                          const SizedBox(width: 8),
                          Text(
                            'Tap to Read',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: themeColor,
                            ),
                          ),
                        ],
                      ),
                    ).animate(
                      onPlay: (c) => c.repeat(reverse: true),
                    ).fadeIn(delay: 600.ms).then().scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.05, 1.05),
                      duration: const Duration(milliseconds: 1000),
                    ),

                    const SizedBox(height: 24),

                    // Reading time
                    Text(
                      widget.story.readingTimeDisplay,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBookPages(Color themeColor) {
    return PageView.builder(
      controller: _pageController,
      onPageChanged: (page) => setState(() => _currentPage = page),
      itemCount: widget.story.pages.length,
      itemBuilder: (context, index) {
        final page = widget.story.pages[index];
        final hasImage = _generatedImages.containsKey(index);

        return _buildBookSpread(page, index, themeColor, hasImage);
      },
    );
  }

  Widget _buildBookSpread(StoryPage page, int index, Color themeColor, bool hasImage) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: LayoutBuilder(
        builder: (context, constraints) {
          // Book spread layout
          final isLandscape = constraints.maxWidth > constraints.maxHeight;

          if (isLandscape && hasImage) {
            // Two-page spread: illustration left, text right
            return Row(
              children: [
                // Left page - Illustration
                Expanded(
                  child: _buildIllustrationPage(index, themeColor),
                ),
                const SizedBox(width: 8),
                // Right page - Text
                Expanded(
                  child: _buildTextPage(page, index, themeColor),
                ),
              ],
            );
          } else {
            // Single page with illustration above text
            return _buildSinglePageLayout(page, index, themeColor, hasImage);
          }
        },
      ),
    );
  }

  Widget _buildSinglePageLayout(StoryPage page, int index, Color themeColor, bool hasImage) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Page texture
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white,
                    themeColor.withOpacity(0.03),
                  ],
                ),
              ),
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Illustration area
                if (hasImage || page.illustrationPrompt != null)
                  Expanded(
                    flex: 3,
                    child: _buildIllustrationArea(index, themeColor),
                  ),

                const SizedBox(height: 20),

                // Text area
                Expanded(
                  flex: 2,
                  child: _buildTextContent(page, themeColor),
                ),

                // Page number
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: themeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${index + 1}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: themeColor,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Decorative corner
          Positioned(
            top: 0,
            right: 0,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: themeColor.withOpacity(0.1),
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(24),
                  bottomLeft: Radius.circular(60),
                ),
              ),
              child: Center(
                child: Text(
                  widget.story.theme.emoji,
                  style: const TextStyle(fontSize: 20),
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildIllustrationPage(int index, Color themeColor) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(5, 5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: _buildIllustrationArea(index, themeColor),
      ),
    );
  }

  Widget _buildIllustrationArea(int index, Color themeColor) {
    if (_generatedImages.containsKey(index)) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: CachedNetworkImage(
          imageUrl: _generatedImages[index]!,
          fit: BoxFit.cover,
          placeholder: (context, url) => _buildImagePlaceholder(themeColor),
          errorWidget: (context, url, error) => _buildImagePlaceholder(themeColor),
        ),
      );
    }

    return _buildImagePlaceholder(themeColor);
  }

  Widget _buildImagePlaceholder(Color themeColor) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            themeColor.withOpacity(0.1),
            themeColor.withOpacity(0.2),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              widget.story.theme.emoji,
              style: const TextStyle(fontSize: 64),
            ),
            if (_isGeneratingImages) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: themeColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Creating magic...',
                style: TextStyle(
                  fontSize: 12,
                  color: themeColor.withOpacity(0.7),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTextPage(StoryPage page, int index, Color themeColor) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(-5, 5),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Expanded(
            child: _buildTextContent(page, themeColor),
          ),
          Text(
            '${index + 1}',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: themeColor.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextContent(StoryPage page, Color themeColor) {
    return Center(
      child: SingleChildScrollView(
        child: Text(
          page.text,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w500,
            color: AppTheme.neutral800,
            height: 1.8,
            fontFamily: 'Nunito',
          ),
        ),
      ),
    );
  }

  Widget _buildNavigation(Color themeColor) {
    final isFirstPage = _currentPage == 0;
    final isLastPage = _currentPage == widget.story.pages.length - 1;

    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          // Previous button
          Expanded(
            child: AnimatedOpacity(
              opacity: isFirstPage ? 0.5 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: OutlinedButton.icon(
                onPressed: isFirstPage ? null : _previousPage,
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('Previous'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: themeColor,
                  side: BorderSide(color: themeColor.withOpacity(0.5)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Next button or finish
          Expanded(
            child: ElevatedButton.icon(
              onPressed: isLastPage ? _showEnding : _nextPage,
              icon: Icon(isLastPage ? Icons.auto_awesome_rounded : Icons.arrow_forward_rounded),
              label: Text(isLastPage ? 'The End' : 'Next'),
              style: ElevatedButton.styleFrom(
                backgroundColor: themeColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _previousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    );
  }

  void _nextPage() {
    _pageController.nextPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    );
  }

  void _showEnding() {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );

    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(32),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [themeColor, themeColor.withOpacity(0.7)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('🌟', style: TextStyle(fontSize: 40)),
                ),
              ).animate().scale(
                duration: 600.ms,
                curve: Curves.elasticOut,
              ),
              const SizedBox(height: 24),
              const Text(
                'The End',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.neutral900,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: themeColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Text(
                      '✨ The Moral ✨',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: themeColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.story.moral,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        color: AppTheme.neutral700,
                        height: 1.5,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        setState(() {
                          _showCover = true;
                          _currentPage = 0;
                        });
                        _pageController.jumpToPage(0);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: themeColor,
                        side: BorderSide(color: themeColor),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Read Again'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: themeColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Sweet Dreams'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _toggleFavorite() async {
    final storage = StorageService();
    final updated = widget.story.copyWith(isFavorite: !widget.story.isFavorite);
    await storage.saveStory(updated);
    // Note: In a real app, you'd update the state through a provider/bloc
  }
}
