import 'package:flutter/material.dart';

import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/splash_screen.dart';
import 'theme/app_theme.dart';

final _appNavigatorKey = GlobalKey<NavigatorState>();

class SocietyApp extends StatelessWidget {
  const SocietyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: _appNavigatorKey,
      title: 'Housing Society',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: SplashScreen(
        onFinished: () {
          final navigator = _appNavigatorKey.currentState;
          navigator?.pushReplacement(
            MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
          );
        },
      ),
    );
  }
}
