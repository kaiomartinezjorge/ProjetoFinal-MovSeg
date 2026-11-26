import 'package:flutter/material.dart';

class DeepSeaColors {
  static const Color primary = Color(0xFF0D1321);
  static const Color primaryContainer = Color(0xFF1F2B42);
  static const Color secondary = Color(0xFF405A74);
  static const Color secondaryCobalt = secondary;
  static const Color secondaryContainer = Color(0xFFD6DFEB);
  static const Color tertiaryContainer = primary;
  static const Color accent = Color(0xFFEEEBDA);
  static const Color glacialBlue = Color(0xFF768AA7);
  static const Color border = Color(0xFFD4DCE7);
  static const Color surface = Color(0xFFF7F5EB);
  static const Color surfaceLow = Color(0xFFF1F4F8);
  static const Color surfaceHigh = Color(0xFFE7ECF2);
  static const Color onSurface = primary;
  static const Color onSurfaceVariant = Color(0xFF52647D);
  static const Color success = Color(0xFF17634E);
  static const Color alert = Color(0xFF9F5C31);
  static const Color error = Color(0xFF993D30);
}

ThemeData buildDeepSeaTheme() {
  final fieldRadius = BorderRadius.circular(10);
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: DeepSeaColors.surface,
    colorScheme: const ColorScheme.light(
      primary: DeepSeaColors.primaryContainer,
      onPrimary: DeepSeaColors.accent,
      primaryContainer: DeepSeaColors.accent,
      onPrimaryContainer: DeepSeaColors.primary,
      secondary: DeepSeaColors.secondary,
      onSecondary: Colors.white,
      secondaryContainer: DeepSeaColors.secondaryContainer,
      onSecondaryContainer: DeepSeaColors.primary,
      surface: DeepSeaColors.surface,
      onSurface: DeepSeaColors.onSurface,
      error: DeepSeaColors.error,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: DeepSeaColors.primaryContainer,
      foregroundColor: DeepSeaColors.accent,
      elevation: 0,
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: DeepSeaColors.surfaceLow,
      indicatorColor: DeepSeaColors.secondaryContainer,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: DeepSeaColors.surfaceLow,
      labelStyle: const TextStyle(color: DeepSeaColors.onSurfaceVariant),
      enabledBorder: OutlineInputBorder(
        borderRadius: fieldRadius,
        borderSide: const BorderSide(color: DeepSeaColors.glacialBlue),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: fieldRadius,
        borderSide: const BorderSide(color: DeepSeaColors.secondary, width: 2),
      ),
      border: OutlineInputBorder(borderRadius: fieldRadius),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: DeepSeaColors.border),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: DeepSeaColors.primaryContainer,
        foregroundColor: DeepSeaColors.accent,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
  );
}
