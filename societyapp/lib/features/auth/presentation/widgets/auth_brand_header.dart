import 'package:flutter/material.dart';

/// Shared, edge-to-edge welcome artwork used by sign-in and recovery screens.
/// The image fades into the page canvas so it feels continuous with the form.
class AuthBrandHeader extends StatelessWidget {
  const AuthBrandHeader({
    super.key,
    required this.height,
    required this.headline,
    required this.subtitle,
    this.onBack,
    this.backLabel = 'Back',
  });

  static const canvas = Color(0xFFF7FAFD);
  static const teal = Color(0xFF12385A);

  final double height;
  final String headline;
  final String subtitle;
  final VoidCallback? onBack;
  final String backLabel;

  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 360),
    curve: Curves.easeInOutCubic,
    height: height,
    child: Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          'assets/images/shubhnivas_residence.jpg',
          fit: BoxFit.cover,
          alignment: Alignment.topCenter,
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x9912385A), Color(0x2212385A), canvas],
              stops: [0, .48, 1],
            ),
          ),
        ),
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 8, 22, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    if (onBack != null) ...[
                      IconButton(
                        onPressed: onBack,
                        tooltip: backLabel,
                        icon: const Icon(Icons.arrow_back_rounded),
                        color: Colors.white,
                      ),
                      const SizedBox(width: 2),
                    ],
                    const Spacer(),
                    const Text(
                      'ShubhNivas',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -.3,
                        shadows: [
                          Shadow(color: Color(0x55000000), blurRadius: 10),
                        ],
                      ),
                    ),
                    const Spacer(),
                    if (onBack != null) const SizedBox(width: 48),
                  ],
                ),
                const Spacer(),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  switchInCurve: Curves.easeOut,
                  switchOutCurve: Curves.easeIn,
                  transitionBuilder: (child, animation) => FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, .08),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  ),
                  child: Text(
                    headline,
                    key: ValueKey(headline),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 31,
                      height: 1.08,
                      fontWeight: FontWeight.w700,
                      shadows: [
                        Shadow(color: Color(0x66000000), blurRadius: 12),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 7),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  switchInCurve: Curves.easeOut,
                  switchOutCurve: Curves.easeIn,
                  transitionBuilder: (child, animation) => FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, .08),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  ),
                  child: Text(
                    subtitle,
                    key: ValueKey(subtitle),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Color(0xFF152B46),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                ),
                const SizedBox(height: 13),
                Center(
                  child: Container(
                    width: 42,
                    height: 3,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFD000),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}
