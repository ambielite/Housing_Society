import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract final class AppTheme {
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.indigo,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: AppColors.canvas,
        fontFamily: 'Roboto',
      );
}
