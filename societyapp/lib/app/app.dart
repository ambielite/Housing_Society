import 'dart:async';

import 'package:flutter/material.dart';

import 'session_manager.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/splash_screen.dart';
import 'theme/app_theme.dart';

final _appNavigatorKey = GlobalKey<NavigatorState>();

class SocietyApp extends StatefulWidget {
  const SocietyApp({super.key});

  @override
  State<SocietyApp> createState() => _SocietyAppState();
}

class _SocietyAppState extends State<SocietyApp> {
  late final StreamSubscription<void> _sessionSubscription;

  @override
  void initState() {
    super.initState();
    _sessionSubscription = SessionManager.onExpired.listen((_) {
      _appNavigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute<void>(
          builder: (_) => const LoginScreen(sessionExpired: true),
        ),
        (_) => false,
      );
    });
  }

  @override
  void dispose() {
    _sessionSubscription.cancel();
    super.dispose();
  }

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
