import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import 'illustrated_story_screen.dart';

class CustomStoryScreen extends StatefulWidget {
  const CustomStoryScreen({super.key});

  @override
  State<CustomStoryScreen> createState() => _CustomStoryScreenState();
}

class _CustomStoryScreenState extends State<CustomStoryScreen> {
  ChildProfile? _child;
  bool _isGenerating = false;

  final _settingController = TextEditingController();
  final _actionController = TextEditingController();
  final _promptController = TextEditingController();
  final List<TextEditingController> _characterControllers = [
    TextEditingController(),
  ];

  @override
  void initState() {
    super.initState();
    _loadChild();
  }

  Future<void> _loadChild() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();
    if (child != null) setState(() => _child = child);
  }

  @override
  void dispose() {
    _settingController.dispose();
    _actionController.dispose();
    _promptController.dispose();
    for (final c in _characterControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _addCharacter() {
    if (_characterControllers.length >= 5) return;
    setState(() {
      _characterControllers.add(TextEditingController());
    });
  }

  void _removeCharacter(int index) {
    if (_characterControllers.length <= 1) return;
    setState(() {
      _characterControllers[index].dispose();
      _characterControllers.removeAt(index);
    });
  }

  Future<void> _generateStory() async {
    if (_child == null || _isGenerating) return;

    setState(() => _isGenerating = true);

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 16),
            const CircularProgressIndicator(color: AppTheme.primaryGreen),
            const SizedBox(height: 20),
            const Text(
              'Creating your custom story...',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This may take a moment',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );

    try {
      final apiService = ApiService();
      final characters = _characterControllers
          .map((c) => c.text.trim())
          .where((t) => t.isNotEmpty)
          .toList();

      final result = await apiService.generateCustomStory(
        childId: _child!.id,
        customPrompt: _promptController.text.trim(),
        characters: characters,
        setting: _settingController.text.trim(),
        action: _actionController.text.trim(),
      );

      if (!mounted) return;
      Navigator.of(context).pop(); // close loading dialog

      if (result['success'] == true && result['data'] != null) {
        final story = BedtimeStory.fromJson(result['data']);
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => IllustratedStoryScreen(story: story, child: _child!),
          ),
        );
      } else {
        _showError(result['error']?.toString() ?? 'Failed to generate story');
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop(); // close loading dialog
        _showError('Failed to generate story. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red.shade400,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionTitle('Story Setting', Icons.landscape_rounded),
                    const SizedBox(height: 8),
                    _buildTextField(
                      controller: _settingController,
                      hint: 'e.g., A magical forest, Under the sea, A cozy treehouse...',
                      maxLines: 2,
                    ),
                    const SizedBox(height: 24),

                    _buildSectionTitle('What happens?', Icons.auto_stories_rounded),
                    const SizedBox(height: 8),
                    _buildTextField(
                      controller: _actionController,
                      hint: 'e.g., Goes on a treasure hunt, Makes new friends, Learns to fly...',
                      maxLines: 2,
                    ),
                    const SizedBox(height: 24),

                    _buildSectionTitle('Characters', Icons.people_rounded),
                    const SizedBox(height: 8),
                    ..._characterControllers.asMap().entries.map((entry) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: entry.value,
                                hint: entry.key == 0
                                    ? 'e.g., A friendly dragon named Spark'
                                    : 'Another character...',
                              ),
                            ),
                            if (_characterControllers.length > 1)
                              Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: GestureDetector(
                                  onTap: () => _removeCharacter(entry.key),
                                  child: Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      color: Colors.red.shade50,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(Icons.close_rounded,
                                        size: 18, color: Colors.red.shade400),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    }),
                    if (_characterControllers.length < 5)
                      GestureDetector(
                        onTap: _addCharacter,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.add_circle_outline_rounded,
                                  size: 18, color: AppTheme.primaryGreen),
                              const SizedBox(width: 6),
                              Text(
                                'Add another character',
                                style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 24),

                    _buildSectionTitle('Additional Details', Icons.edit_note_rounded),
                    const SizedBox(height: 8),
                    _buildTextField(
                      controller: _promptController,
                      hint: 'Any other details for the story? e.g., Include a lesson about sharing, Make it rhyme...',
                      maxLines: 3,
                    ),
                    const SizedBox(height: 32),

                    // Generate button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isGenerating ? null : _generateStory,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B5CF6),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: _isGenerating
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.auto_awesome_rounded, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Generate My Story',
                                    style: TextStyle(
                                      fontFamily: 'Nunito',
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
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

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: const Icon(Icons.arrow_back_rounded,
                color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '\u{2728} Custom Story Builder',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Create a unique bedtime story',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.textPrimary),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Nunito',
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 14,
          color: AppTheme.textTertiary,
        ),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: AppTheme.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: AppTheme.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      style: const TextStyle(
        fontFamily: 'Inter',
        fontSize: 14,
        color: AppTheme.textPrimary,
      ),
    );
  }
}
