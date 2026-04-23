import 'package:flutter/material.dart';
import '../services/sarvam_service.dart';
import '../utils/app_theme.dart';

/// Compact language picker widget.
/// Shows a globe icon button that opens a bottom sheet with available languages.
/// Returns the selected language code (BCP-47 format, e.g. 'hi-IN').
class LanguagePicker extends StatelessWidget {
  final String selectedLanguage;
  final ValueChanged<String> onLanguageChanged;
  final Color? iconColor;
  final double iconSize;

  const LanguagePicker({
    super.key,
    required this.selectedLanguage,
    required this.onLanguageChanged,
    this.iconColor,
    this.iconSize = 22,
  });

  @override
  Widget build(BuildContext context) {
    final isEnglish = selectedLanguage == 'en-IN';
    return GestureDetector(
      onTap: () => _showLanguageSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isEnglish
              ? AppTheme.neutral100
              : AppTheme.primaryGreen.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isEnglish
                ? AppTheme.borderLight
                : AppTheme.primaryGreen.withOpacity(0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.translate_rounded,
              size: iconSize - 4,
              color: iconColor ??
                  (isEnglish ? AppTheme.textSecondary : AppTheme.primaryGreen),
            ),
            const SizedBox(width: 4),
            Text(
              _shortLabel(selectedLanguage),
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isEnglish
                    ? AppTheme.textSecondary
                    : AppTheme.primaryGreen,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _shortLabel(String code) {
    final name = SarvamService.supportedLanguages[code] ?? 'English';
    if (name.length > 3) return name.substring(0, 3).toUpperCase();
    return name.toUpperCase();
  }

  void _showLanguageSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _LanguageSheetContent(
        selectedLanguage: selectedLanguage,
        onLanguageChanged: (code) {
          onLanguageChanged(code);
          Navigator.pop(context);
        },
      ),
    );
  }
}

class _LanguageSheetContent extends StatelessWidget {
  final String selectedLanguage;
  final ValueChanged<String> onLanguageChanged;

  const _LanguageSheetContent({
    required this.selectedLanguage,
    required this.onLanguageChanged,
  });

  @override
  Widget build(BuildContext context) {
    final languages = SarvamService.supportedLanguages.entries.toList();
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
          const SizedBox(height: 20),
          const Text(
            'Select Language',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Choose a language for translation',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 340,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: languages.length,
              separatorBuilder: (_, __) =>
                  Divider(height: 1, color: AppTheme.neutral100),
              itemBuilder: (context, index) {
                final entry = languages[index];
                final isSelected = entry.key == selectedLanguage;
                return ListTile(
                  onTap: () => onLanguageChanged(entry.key),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  tileColor:
                      isSelected ? AppTheme.primaryGreen.withOpacity(0.06) : null,
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primaryGreen.withOpacity(0.15)
                          : AppTheme.neutral100,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        entry.key.split('-').first.toUpperCase(),
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isSelected
                              ? AppTheme.primaryGreen
                              : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ),
                  title: Text(
                    entry.value,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                      color: isSelected
                          ? AppTheme.primaryGreen
                          : AppTheme.textPrimary,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(
                          Icons.check_circle_rounded,
                          color: AppTheme.primaryGreen,
                          size: 22,
                        )
                      : null,
                );
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
