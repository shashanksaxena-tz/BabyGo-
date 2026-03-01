import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/language_picker.dart';
import '../../animations/custom_animations.dart';
import 'illustrated_story_screen.dart';

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
  String _selectedLanguage = 'en-IN';

  // V3 theme circles (subset matching design screenshot)
  static const List<Map<String, dynamic>> _themeCircles = [
    {'id': 'adventure', 'name': 'Adventure', 'emoji': '\u{1F9ED}', 'color': Color(0xFFD1FAE5)},
    {'id': 'animals', 'name': 'Animals', 'emoji': '\u{1F43E}', 'color': Color(0xFFFEF3C7)},
    {'id': 'space', 'name': 'Space', 'emoji': '\u{1F680}', 'color': Color(0xFFDBEAFE)},
    {'id': 'ocean', 'name': 'Nature', 'emoji': '\u{1F33F}', 'color': Color(0xFFCCFBF1)},
    {'id': 'friendship', 'name': 'Friends', 'emoji': '\u{1F495}', 'color': Color(0xFFFCE7F3)},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();

    if (child != null) {
      // Try loading from API first
      try {
        final apiService = ApiService();
        final result = await apiService.getStories(child.id);
        if (result['success'] == true && result['data'] != null) {
          final storiesList = (result['data'] as List)
              .map((s) => BedtimeStory.fromJson(s))
              .toList()
            ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
          setState(() {
            _child = child;
            _stories = storiesList;
            _isLoading = false;
          });
          return;
        }
      } catch (_) {}

      // Fallback to local storage
      final stories = await storage.getStories(child.id);
      setState(() {
        _child = child;
        _stories = stories..sort((a, b) => b.createdAt.compareTo(a.createdAt));
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _generateStoryFromTheme(String themeId) async {
    if (_child == null || _isGenerating) return;

    setState(() => _isGenerating = true);

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _GeneratingStoryDialog(),
    );

    try {
      final apiService = ApiService();
      final result = await apiService.generateStory(
        childId: _child!.id,
        themeId: themeId,
      );

      if (mounted) Navigator.of(context).pop(); // close dialog

      if (result['success'] == true && result['data'] != null) {
        final story = BedtimeStory.fromJson(result['data']);
        await _loadData();
        if (mounted) {
          _openStory(story);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? 'Failed to generate story'),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) Navigator.of(context).pop();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  void _openStory(BedtimeStory story) {
    if (_child == null) return;
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => IllustratedStoryScreen(
          story: story,
          child: _child!,
        ),
        transitionsBuilder: (_, animation, __, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
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

    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: SafeArea(
        child: Column(
          children: [
            // ---- Header ----
            _buildHeader(),

            // ---- Scrollable content ----
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    // "Tonight's Story" label
                    _buildSectionLabel("TONIGHT'S STORY"),
                    const SizedBox(height: 12),

                    // Featured story card
                    _buildFeaturedStoryCard(),
                    const SizedBox(height: 24),

                    // "Choose a Theme" section
                    _buildSectionTitle('Choose a Theme'),
                    const SizedBox(height: 12),
                    _buildThemeCircles(),
                    const SizedBox(height: 24),

                    // "Recently Read" section
                    if (_stories.length > 1) ...[
                      _buildSectionTitle('Recently Read'),
                      const SizedBox(height: 12),
                      _buildRecentlyReadList(),
                      const SizedBox(height: 24),
                    ],

                    // "Create Custom Story" button
                    _buildCreateCustomStoryButton(),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---- HEADER ----
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: const Icon(
              Icons.arrow_back_rounded,
              color: AppTheme.textPrimary,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Bedtime Stories',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          LanguagePicker(
            selectedLanguage: _selectedLanguage,
            onLanguageChanged: (code) =>
                setState(() => _selectedLanguage = code),
          ),
          const SizedBox(width: 8),
          Icon(
            Icons.nightlight_round,
            color: AppTheme.textSecondary,
            size: 22,
          ),
        ],
      ),
    );
  }

  // ---- SECTION HELPERS ----
  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontFamily: 'Nunito',
        fontSize: 14,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.0,
        color: AppTheme.textTertiary,
      ),
    );
  }

  Widget _buildSectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontFamily: 'Nunito',
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppTheme.textPrimary,
      ),
    );
  }

  // ---- FEATURED STORY CARD ----
  Widget _buildFeaturedStoryCard() {
    final featured = _stories.isNotEmpty ? _stories.first : null;
    final title = featured?.title ?? 'The Brave Little Explorer';
    final ageLabel = _child != null ? '${(_child!.ageInMonths / 12).floor()}-${((_child!.ageInMonths / 12).floor() + 1)} years' : '2-3 years';

    return GestureDetector(
      onTap: featured != null ? () => _openStory(featured) : null,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image area
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFFA7F3D0),
                    const Color(0xFF6EE7B7),
                    const Color(0xFF34D399),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: featured?.pages.isNotEmpty == true &&
                      featured!.pages.first.illustrationUrl != null
                  ? Image.network(
                      featured.pages.first.illustrationUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildCoverPlaceholder(),
                    )
                  : _buildCoverPlaceholder(),
            ),

            // Content below image
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.access_time_rounded,
                          size: 14, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        ageLabel,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const Spacer(),
                      _buildReadNowButton(featured),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildCoverPlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('\u{1F344}', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 8),
          Text(
            'A magical story awaits...',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReadNowButton(BedtimeStory? story) {
    return GestureDetector(
      onTap: story != null ? () => _openStory(story) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppTheme.primaryGreen,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.menu_book_rounded, size: 14, color: Colors.white),
            const SizedBox(width: 6),
            const Text(
              'Read Now',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---- THEME CIRCLES ----
  Widget _buildThemeCircles() {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _themeCircles.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final theme = _themeCircles[index];
          return _ThemeCircle(
            name: theme['name'] as String,
            emoji: theme['emoji'] as String,
            color: theme['color'] as Color,
            onTap: () => _generateStoryFromTheme(theme['id'] as String),
          );
        },
      ),
    );
  }

  // ---- RECENTLY READ ----
  Widget _buildRecentlyReadList() {
    // Skip the first (featured) story
    final recentStories = _stories.length > 1 ? _stories.sublist(1) : <BedtimeStory>[];
    return Column(
      children: recentStories.take(5).toList().asMap().entries.map((entry) {
        final index = entry.key;
        final story = entry.value;
        return StaggeredListAnimation(
          index: index,
          child: _buildRecentStoryItem(story),
        );
      }).toList(),
    );
  }

  Widget _buildRecentStoryItem(BedtimeStory story) {
    final timeAgo = _timeAgoString(story.createdAt);
    return GestureDetector(
      onTap: () => _openStory(story),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        child: Row(
          children: [
            // Circular thumbnail
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Color(
                  int.parse(
                    story.theme.colorHex.replaceFirst('#', '0xFF'),
                  ),
                ).withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  story.theme.emoji,
                  style: const TextStyle(fontSize: 22),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    story.title,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$timeAgo \u2022 ${story.readingTimeDisplay}',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppTheme.textTertiary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  // ---- CREATE CUSTOM STORY BUTTON ----
  Widget _buildCreateCustomStoryButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _isGenerating ? null : () => _showThemeSelector(),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryGreen,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppTheme.primaryGreen.withOpacity(0.5),
          elevation: 0,
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
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                  SizedBox(width: 12),
                  Text(
                    'Generating...',
                    style: TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              )
            : const Text(
                'Create Custom Story',
                style: TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
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
        onThemeSelected: (theme) {
          Navigator.pop(context);
          _generateStoryFromTheme(theme.id);
        },
      ),
    );
  }

  // ---- HELPERS ----
  String _timeAgoString(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()} weeks ago';
    return 'Last week';
  }
}

// ---- THEME CIRCLE WIDGET ----
class _ThemeCircle extends StatefulWidget {
  final String name;
  final String emoji;
  final Color color;
  final VoidCallback onTap;

  const _ThemeCircle({
    required this.name,
    required this.emoji,
    required this.color,
    required this.onTap,
  });

  @override
  State<_ThemeCircle> createState() => _ThemeCircleState();
}

class _ThemeCircleState extends State<_ThemeCircle>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.9).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          );
        },
        child: SizedBox(
          width: 64,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: widget.color,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    widget.emoji,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                widget.name,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---- THEME SELECTOR BOTTOM SHEET (full list) ----
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
              fontFamily: 'Nunito',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Pick a theme for your bedtime story',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 14,
              color: AppTheme.textSecondary,
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
                            fontFamily: 'Inter',
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

// ---- GENERATING STORY DIALOG ----
class _GeneratingStoryDialog extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 48,
              height: 48,
              child: CircularProgressIndicator(
                color: AppTheme.primaryGreen,
                strokeWidth: 3,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Creating your story...',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'This may take a moment',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
