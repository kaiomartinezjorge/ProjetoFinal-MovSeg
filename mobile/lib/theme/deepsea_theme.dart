import 'package:flutter/material.dart';

class DeepSeaColors {
  static const Color primary = Color(0xFF001026);
  static const Color primaryContainer = Color(0xFF0B2545);
  static const Color secondary = Color(0xFF395F95);
  static const Color secondaryCobalt = Color(0xFF134074);
  static const Color secondaryContainer = Color(0xFF9DC3FF);
  static const Color tertiaryContainer = Color(0xFF06273D);
  static const Color glacialBlue = Color(0xFF8DA9C4);
  static const Color surface = Color(0xFFF4FAFE);
  static const Color surfaceLow = Color(0xFFEEF4F8);
  static const Color surfaceHigh = Color(0xFFE3E9ED);
  static const Color onSurface = Color(0xFF161C1F);
  static const Color onSurfaceVariant = Color(0xFF44474E);
  static const Color success = Color(0xFF2A9D8F);
  static const Color alert = Color(0xFFE76F51);
  static const Color error = Color(0xFFBA1A1A);
}

ThemeData buildDeepSeaTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: DeepSeaColors.surface,
    colorScheme: const ColorScheme.light(
      primary: DeepSeaColors.primaryContainer,
      onPrimary: Colors.white,
      secondary: DeepSeaColors.secondary,
      onSecondary: Colors.white,
      surface: DeepSeaColors.surface,
      onSurface: DeepSeaColors.onSurface,
      error: DeepSeaColors.error,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: DeepSeaColors.primaryContainer,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: DeepSeaColors.glacialBlue.withValues(alpha: 0.35)),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: DeepSeaColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    ),
  );
}
