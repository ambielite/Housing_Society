import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const String kAppName = 'ShubhNivas';
const String kTagline = 'HOME  •  COMMUNITY  •  CARE';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, this.onFinished});

  final VoidCallback? onFinished;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  static const _duration = Duration(seconds: 5);
  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  );
  late final Animation<double> _fade = CurvedAnimation(
    parent: _intro,
    curve: Curves.easeOutCubic,
  );
  Timer? _finishTimer;

  @override
  void initState() {
    super.initState();
    _intro.forward();
    _finishTimer = Timer(_duration, () {
      if (mounted) widget.onFinished?.call();
    });
  }

  @override
  void dispose() {
    _finishTimer?.cancel();
    _intro.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const background = Color(0xFFFFF8E8);
    const ink = Color(0xFF17324A);
    const gold = Color(0xFFFFC928);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: background,
        systemNavigationBarIconBrightness: Brightness.dark,
        systemNavigationBarDividerColor: background,
        systemStatusBarContrastEnforced: false,
        systemNavigationBarContrastEnforced: false,
      ),
      child: Scaffold(
        backgroundColor: background,
        body: Stack(
          fit: StackFit.expand,
          children: [
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFFFFDF5),
                    Color(0xFFFFF0C5),
                    Color(0xFFEAF6FF),
                  ],
                  stops: [0, .62, 1],
                ),
              ),
            ),
            Positioned(
              top: -110,
              right: -85,
              child: _GlowOrb(size: 280, color: gold.withValues(alpha: .24)),
            ),
            Positioned(
              bottom: -135,
              left: -105,
              child: _GlowOrb(
                size: 320,
                color: const Color(0xFF82C9F4).withValues(alpha: .20),
              ),
            ),
            SafeArea(
              child: Center(
                child: FadeTransition(
                  opacity: _fade,
                  child: AnimatedBuilder(
                    animation: _intro,
                    builder: (context, child) => Transform.translate(
                      offset: Offset(0, 14 * (1 - _fade.value)),
                      child: child,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 30),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(height: 14),
                          SizedBox(
                            width: 250,
                            height: 220,
                            child: Image.asset(
                              'assets/images/logo1.png',
                              width: 250,
                              height: 220,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Center(
                                    child: Icon(
                                      Icons.home_rounded,
                                      size: 150,
                                      color: ink,
                                    ),
                                  ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            kAppName,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: ink,
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              letterSpacing: .3,
                            ),
                          ),
                          const SizedBox(height: 9),
                          const Text(
                            kTagline,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFF596D79),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2.2,
                            ),
                          ),
                          const SizedBox(height: 34),
                          SizedBox(
                            width: 38,
                            height: 3,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: const LinearProgressIndicator(
                                backgroundColor: Color(0x6695AAB4),
                                color: Color(0xFF17324A),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)]),
      ),
    ),
  );
}
