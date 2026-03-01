import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../models/models.dart';
import '../../services/sarvam_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/language_picker.dart';

class IllustratedStoryScreen extends StatefulWidget {
  final BedtimeStory story;
  final ChildProfile child;

  const IllustratedStoryScreen({
    super.key,
    required this.story,
    required this.child,
  });

  @override
  State<IllustratedStoryScreen> createState() =>
      _IllustratedStoryScreenState();
}

class _IllustratedStoryScreenState extends State<IllustratedStoryScreen>
    with TickerProviderStateMixin {
  late PageController _pageController;
  int _currentPage = 0;
  bool _showCover = true;

  // Language & audio state
  String _selectedLanguage = 'en-IN';
  bool _isTranslating = false;
  bool _isPlayingAudio = false;
  final Map<int, String> _translatedTexts = {};
  final AudioPlayer _audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  /// Translate the current page text via Sarvam backend.
  Future<void> _translateCurrentPage() async {
    if (_selectedLanguage == 'en-IN') return;
    if (_translatedTexts.containsKey(_currentPage)) return;

    setState(() => _isTranslating = true);
    try {
      final sarvam = SarvamService();
      final originalText = widget.story.pages[_currentPage].text;
      final translated =
          await sarvam.translateText(originalText, _selectedLanguage);
      if (mounted) {
        setState(() {
          _translatedTexts[_currentPage] = translated;
          _isTranslating = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isTranslating = false);
    }
  }

  /// Play TTS audio for the current page text.
  Future<void> _playAudio() async {
    if (_isPlayingAudio) {
      await _audioPlayer.stop();
      setState(() => _isPlayingAudio = false);
      return;
    }

    setState(() => _isPlayingAudio = true);
    try {
      final sarvam = SarvamService();
      final textToSpeak = _selectedLanguage != 'en-IN' &&
              _translatedTexts.containsKey(_currentPage)
          ? _translatedTexts[_currentPage]!
          : widget.story.pages[_currentPage].text;

      final audioChunks =
          await sarvam.textToSpeech(textToSpeak, _selectedLanguage);

      for (final chunk in audioChunks) {
        if (!mounted || !_isPlayingAudio) break;
        final bytes = base64Decode(chunk);
        await _audioPlayer.play(BytesSource(bytes));
        // Wait for completion
        await _audioPlayer.onPlayerComplete.first;
      }
    } catch (_) {
      // Silently fail - audio is optional
    } finally {
      if (mounted) setState(() => _isPlayingAudio = false);
    }
  }

  void _onLanguageChanged(String code) {
    setState(() {
      _selectedLanguage = code;
      _translatedTexts.clear();
    });
    if (code != 'en-IN' && !_showCover) {
      _translateCurrentPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFECFDF5), // light green bg
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _showCover ? _buildBookCover() : _buildBookPages(),
            ),
            if (!_showCover) _buildPageDots(),
            if (!_showCover) _buildNavigation(),
          ],
        ),
      ),
    );
  }

  // ---- HEADER ----
  Widget _buildHeader() {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close_rounded),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.textSecondary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const Spacer(),
          if (!_showCover)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: AppTheme.cardShadowV3,
              ),
              child: Text(
                'Page ${_currentPage + 1} of ${widget.story.pages.length}',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: themeColor,
                ),
              ),
            ),
          const Spacer(),
          // Language picker
          LanguagePicker(
            selectedLanguage: _selectedLanguage,
            onLanguageChanged: _onLanguageChanged,
          ),
          const SizedBox(width: 4),
          // Audio button
          if (!_showCover)
            IconButton(
              onPressed: _playAudio,
              icon: Icon(
                _isPlayingAudio
                    ? Icons.stop_rounded
                    : Icons.volume_up_rounded,
              ),
              style: IconButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor:
                    _isPlayingAudio ? AppTheme.primaryGreen : AppTheme.textSecondary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ---- COVER ----
  Widget _buildBookCover() {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );
    return GestureDetector(
      onTap: () => setState(() => _showCover = false),
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          constraints: const BoxConstraints(maxWidth: 340, maxHeight: 480),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [themeColor, themeColor.withOpacity(0.75)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: themeColor.withOpacity(0.35),
                blurRadius: 30,
                offset: const Offset(0, 15),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(widget.story.theme.emoji,
                        style: const TextStyle(fontSize: 52)),
                  ),
                )
                    .animate()
                    .scale(duration: 600.ms, curve: Curves.elasticOut),
                const SizedBox(height: 28),
                Text(
                  widget.story.title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.2,
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.15, end: 0),
                const SizedBox(height: 14),
                Text(
                  'Starring ${widget.child.name}',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withOpacity(0.9),
                    fontStyle: FontStyle.italic,
                  ),
                ).animate().fadeIn(delay: 400.ms),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.menu_book_rounded, color: themeColor, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Tap to Read',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: themeColor,
                        ),
                      ),
                    ],
                  ),
                )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .fadeIn(delay: 600.ms)
                    .then()
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.04, 1.04),
                      duration: 1000.ms,
                    ),
                const SizedBox(height: 20),
                Text(
                  widget.story.readingTimeDisplay,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---- PAGES ----
  Widget _buildBookPages() {
    return PageView.builder(
      controller: _pageController,
      onPageChanged: (page) {
        setState(() => _currentPage = page);
        if (_selectedLanguage != 'en-IN') {
          _translateCurrentPage();
        }
      },
      itemCount: widget.story.pages.length,
      itemBuilder: (context, index) {
        final page = widget.story.pages[index];
        return _buildPageCard(page, index);
      },
    );
  }

  Widget _buildPageCard(StoryPage page, int index) {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );
    final hasIllustration = page.illustrationUrl != null;

    // Determine displayed text: translated or original
    final displayText = _selectedLanguage != 'en-IN' &&
            _translatedTexts.containsKey(index)
        ? _translatedTexts[index]!
        : page.text;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            // Illustration area
            if (hasIllustration || page.illustrationPrompt != null)
              Expanded(
                flex: 3,
                child: ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(24)),
                  child: hasIllustration
                      ? CachedNetworkImage(
                          imageUrl: page.illustrationUrl!,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          placeholder: (_, __) =>
                              _buildPlaceholder(themeColor),
                          errorWidget: (_, __, ___) =>
                              _buildPlaceholder(themeColor),
                        )
                      : _buildPlaceholder(themeColor),
                ),
              ),

            // Text area
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_isTranslating && index == _currentPage)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: themeColor,
                              ),
                            ),
                          ),
                        Text(
                          displayText,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontFamily: 'Nunito',
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textPrimary,
                            height: 1.7,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 350.ms).scale(begin: const Offset(0.96, 0.96));
  }

  Widget _buildPlaceholder(Color themeColor) {
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
      ),
      child: Center(
        child: Text(widget.story.theme.emoji,
            style: const TextStyle(fontSize: 56)),
      ),
    );
  }

  // ---- PAGE DOTS ----
  Widget _buildPageDots() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          widget.story.pages.length,
          (index) {
            final themeColor = Color(
              int.parse(
                  widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
            );
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: index == _currentPage ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: index == _currentPage
                    ? themeColor
                    : themeColor.withOpacity(0.3),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          },
        ),
      ),
    );
  }

  // ---- NAVIGATION ----
  Widget _buildNavigation() {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );
    final isFirstPage = _currentPage == 0;
    final isLastPage = _currentPage == widget.story.pages.length - 1;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
      child: Row(
        children: [
          Expanded(
            child: AnimatedOpacity(
              opacity: isFirstPage ? 0.4 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: OutlinedButton.icon(
                onPressed: isFirstPage
                    ? null
                    : () => _pageController.previousPage(
                          duration: const Duration(milliseconds: 400),
                          curve: Curves.easeOutCubic,
                        ),
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('Previous'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: themeColor,
                  side: BorderSide(color: themeColor.withOpacity(0.5)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: isLastPage
                  ? _showEnding
                  : () => _pageController.nextPage(
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.easeOutCubic,
                      ),
              icon: Icon(isLastPage
                  ? Icons.auto_awesome_rounded
                  : Icons.arrow_forward_rounded),
              label: Text(isLastPage ? 'The End' : 'Next'),
              style: ElevatedButton.styleFrom(
                backgroundColor: themeColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
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

  // ---- ENDING ----
  void _showEnding() {
    final themeColor = Color(
      int.parse(widget.story.theme.colorHex.replaceFirst('#', '0xFF')),
    );
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [themeColor, themeColor.withOpacity(0.7)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('\u{1F31F}', style: TextStyle(fontSize: 36)),
                ),
              )
                  .animate()
                  .scale(duration: 600.ms, curve: Curves.elasticOut),
              const SizedBox(height: 20),
              const Text(
                'The End',
                style: TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: themeColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Text(
                      'The Moral',
                      style: TextStyle(
                        fontFamily: 'Nunito',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: themeColor,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.story.moral,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 15,
                        color: AppTheme.textSecondary,
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
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
}
