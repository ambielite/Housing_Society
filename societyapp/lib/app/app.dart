import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
      builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark.copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: Colors.transparent,
          systemNavigationBarDividerColor: Colors.transparent,
          systemNavigationBarContrastEnforced: false,
          systemStatusBarContrastEnforced: false,
          statusBarIconBrightness: Brightness.dark,
          systemNavigationBarIconBrightness: Brightness.dark,
        ),
        child: child ?? const SizedBox.shrink(),
      ),
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
