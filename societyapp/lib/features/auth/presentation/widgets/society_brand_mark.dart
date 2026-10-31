import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class SocietyBrandMark extends StatefulWidget {
  const SocietyBrandMark({super.key, this.size = 54, this.animate = true});

  final double size;
  final bool animate;

  @override
  State<SocietyBrandMark> createState() => _SocietyBrandMarkState();
}

class _SocietyBrandMarkState extends State<SocietyBrandMark>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2200),
  );

  @override
  void initState() {
    super.initState();
    if (widget.animate) _pulse.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant SocietyBrandMark oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animate && !_pulse.isAnimating) {
      _pulse.repeat(reverse: true);
    } else if (!widget.animate) {
      _pulse.stop();
      _pulse.value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    final radius = BorderRadius.circular(size * 0.32);

    return AnimatedBuilder(
      animation: _pulse,
      builder: (context, child) {
        final t = Curves.easeInOut.transform(_pulse.value);
        return Transform.scale(
          scale: 1 + 0.035 * t,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              borderRadius: radius,
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.violet, AppColors.indigo],
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.indigo.withValues(alpha: 0.28 + 0.24 * t),
                  blurRadius: 24 + 14 * t,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: child,
          ),
        );
      },
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Soft gloss highlight in the top-left corner.
            Positioned(
              top: -size * 0.35,
              left: -size * 0.2,
              child: Container(
                width: size * 0.9,
                height: size * 0.7,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.white.withValues(alpha: 0.22),
                      Colors.white.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
            Icon(
              Icons.apartment_rounded,
              color: Colors.white,
              size: size * 0.55,
            ),
          ],
        ),
      ),
    );
  }
}