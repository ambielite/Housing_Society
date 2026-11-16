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
            PageRouteBuilder<void>(
              transitionDuration: const Duration(milliseconds: 520),
              reverseTransitionDuration: const Duration(milliseconds: 320),
              pageBuilder: (_, animation, secondaryAnimation) =>
                  const LoginScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                final eased = CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                  reverseCurve: Curves.easeInCubic,
                );
                return FadeTransition(
                  opacity: eased,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, .025),
                      end: Offset.zero,
                    ).animate(eased),
                    child: child,
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
