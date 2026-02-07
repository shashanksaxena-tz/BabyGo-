import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/gemini_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

class BedtimeStoriesScreen extends StatefulWidget {
  const BedtimeStoriesScreen({super.key});

  @override
  State<BedtimeStoriesScreen> createState() => _BedtimeStoriesScreenState();
}

class _BedtimeStoriesScreenState extends State<BedtimeStoriesScreen> {
  ChildProfile? _child;
  List<BedtimeStory> _stories = [];
  bool _isLoading = true;
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();

    if (child != null) {
      final stories = await storage.getStories(child.id);
      setState(() {
        _child = child;
        _stories = stories;
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
                        const Text(
                          'Bedtime Stories',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.neutral900,
                          ),
                        ),
                        Text(
                          'Personalized for ${_child?.displayName ?? "your child"}',
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
                      color: AppTheme.secondaryPurple.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text(
                      '🌙',
                      style: TextStyle(fontSize: 24),
                    ),
                  ),
                ],
              ),
            ),

            // Create New Story
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _buildCreateStoryCard(),
            ),

            const SizedBox(height: 20),

            // Story List
            Expanded(
              child: _stories.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: _stories.length,
                      itemBuilder: (context, index) {
                        return StaggeredListAnimation(
                          index: index,
                          child: _buildStoryCard(_stories[index]),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreateStoryCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.secondaryPurple,
            AppTheme.secondaryPink,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.secondaryPurple.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Create a Story',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_child?.displayName ?? "Your child"} is the hero!',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
              FloatingAnimation(
                offset: 6,
                child: const Text(
                  '✨📚',
                  style: TextStyle(fontSize: 32),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isGenerating ? null : _showThemeSelector,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppTheme.secondaryPurple,
                disabledBackgroundColor: Colors.white54,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: _isGenerating
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text('Generating Story...'),
                      ],
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.auto_awesome_rounded),
                        SizedBox(width: 8),
                        Text(
                          'Generate New Story',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppTheme.secondaryPurple.withOpacity(0.1),
              borderRadius: BorderRadius.circular(32),
            ),
            child: const Center(
              child: Text('📖', style: TextStyle(fontSize: 48)),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No stories yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Generate your first personalized\nbedtime story!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.neutral500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoryCard(BedtimeStory story) {
    final themeColor = Color(
      int.parse(story.theme.colorHex.replaceFirst('#', '0xFF')),
    );

    return GestureDetector(
      onTap: () => _openStoryReader(story),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: AppTheme.softShadow,
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: themeColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(
                  story.theme.emoji,
                  style: const TextStyle(fontSize: 28),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    story.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neutral800,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: themeColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          story.theme.name,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: themeColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        story.readingTimeDisplay,
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
            Column(
              children: [
                if (story.isFavorite)
                  const Icon(
                    Icons.favorite_rounded,
                    color: AppTheme.secondaryPink,
                    size: 20,
                  ),
                const SizedBox(height: 4),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppTheme.neutral400,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showThemeSelector() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ThemeSelectorSheet(
        onThemeSelected: (theme) => _generateStory(theme),
      ),
    );
  }

  Future<void> _generateStory(StoryTheme theme) async {
    if (_child == null) return;

    Navigator.pop(context); // Close bottom sheet

    setState(() => _isGenerating = true);

    try {
      final gemini = GeminiService();
      final storage = StorageService();

      final apiKey = storage.getApiKey();
      if (apiKey == null || apiKey.isEmpty) {
        throw Exception('Please set your Gemini API key in Settings');
      }

      if (!gemini.isInitialized) {
        await gemini.initialize(apiKey);
      }

      final story = await gemini.generateBedtimeStory(
        child: _child!,
        theme: theme,
      );

      await storage.saveStory(story);

      _loadData();
      _openStoryReader(story);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to generate story: ${e.toString()}'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  void _openStoryReader(BedtimeStory story) {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => _StoryReaderScreen(story: story),
        transitionsBuilder: (_, animation, __, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }
}

class _ThemeSelectorSheet extends StatelessWidget {
  final Function(StoryTheme) onThemeSelected;

  const _ThemeSelectorSheet({required this.onThemeSelected});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.neutral300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Choose a Theme',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.neutral900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Pick a theme for your bedtime story',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.neutral500,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
              ),
              itemCount: StoryTheme.themes.length,
              itemBuilder: (context, index) {
                final theme = StoryTheme.themes[index];
                final color = Color(
                  int.parse(theme.colorHex.replaceFirst('#', '0xFF')),
                );

                return GestureDetector(
                  onTap: () => onThemeSelected(theme),
                  child: Container(
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: color.withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          theme.emoji,
                          style: const TextStyle(fontSize: 24),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          theme.name,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _StoryReaderScreen extends StatefulWidget {
  final BedtimeStory story;

  const _StoryReaderScreen({required this.story});

  @override
  State<_StoryReaderScreen> createState() => _StoryReaderScreenState();
}

class _StoryReaderScreenState extends State<_StoryReaderScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              themeColor.withOpacity(0.1),
              Colors.white,
              themeColor.withOpacity(0.05),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded),
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.neutral100,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${_currentPage + 1} / ${widget.story.pages.length}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: themeColor,
                      ),
                    ),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
              ),

              // Title
              if (_currentPage == 0)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      Text(
                        widget.story.theme.emoji,
                        style: const TextStyle(fontSize: 64),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.story.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.neutral900,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),

              // Pages
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (page) {
                    setState(() => _currentPage = page);
                  },
                  itemCount: widget.story.pages.length,
                  itemBuilder: (context, index) {
                    final page = widget.story.pages[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Center(
                        child: Text(
                          page.text,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.neutral800,
                            height: 1.8,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Page Indicators
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  widget.story.pages.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: index == _currentPage ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: index == _currentPage
                          ? themeColor
                          : themeColor.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),

              // Navigation
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    if (_currentPage > 0)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            _pageController.previousPage(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeOutCubic,
                            );
                          },
                          icon: const Icon(Icons.arrow_back_rounded),
                          label: const Text('Previous'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: themeColor,
                            side: BorderSide(color: themeColor),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      )
                    else
                      const Expanded(child: SizedBox()),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          if (_currentPage < widget.story.pages.length - 1) {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeOutCubic,
                            );
                          } else {
                            _showMoral();
                          }
                        },
                        icon: Icon(
                          _currentPage < widget.story.pages.length - 1
                              ? Icons.arrow_forward_rounded
                              : Icons.auto_awesome_rounded,
                        ),
                        label: Text(
                          _currentPage < widget.story.pages.length - 1
                              ? 'Next'
                              : 'The End',
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: themeColor,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
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

  void _showMoral() {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🌟', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              'The Moral',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral900,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              widget.story.moral,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: AppTheme.neutral600,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: themeColor,
                ),
                child: const Text('Sweet Dreams!'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
