import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

/// V3 Child Header Card - compact rounded card with avatar, name, age, status badge
/// Matches design: white card with subtle shadow, green avatar ring,
/// "On Track" pill badge, and toddler illustration
class ChildHeaderCard extends StatelessWidget {
  final String childName;
  final String ageText;
  final String statusText;
  final String? avatarUrl;

  const ChildHeaderCard({
    super.key,
    required this.childName,
    required this.ageText,
    required this.statusText,
    this.avatarUrl,
  });

  Color get _statusColor {
    switch (statusText.toLowerCase()) {
      case 'on track':
        return AppTheme.primaryGreen;
      case 'emerging':
        return AppTheme.warning;
      case 'needs support':
        return AppTheme.error;
      default:
        return AppTheme.primaryGreen;
    }
  }

  Color get _statusBgColor {
    switch (statusText.toLowerCase()) {
      case 'on track':
        return AppTheme.greenTint;
      case 'emerging':
        return const Color(0xFFFEF3C7);
      case 'needs support':
        return const Color(0xFFFEE2E2);
      default:
        return AppTheme.greenTint;
    }
  }

  @override
  Widget build(BuildContext context) {
    final initial = childName.isNotEmpty ? childName[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadowV3,
      ),
      child: Row(
        children: [
          // Avatar with green ring
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.greenTint,
              border: Border.all(color: AppTheme.primaryGreen, width: 2),
            ),
            child: Center(
              child: avatarUrl != null
                  ? ClipOval(
                      child: Image.network(
                        avatarUrl!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Text(
                          initial,
                          style: const TextStyle(
                            fontFamily: 'Nunito',
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                    )
                  : Text(
                      initial,
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 14),

          // Name & age info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "$childName's Growth",
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$ageText \u2022 $statusText',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          // Status badge pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _statusBgColor,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _statusColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  statusText,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _statusColor == AppTheme.primaryGreen
                        ? const Color(0xFF059669)
                        : _statusColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
