import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const String kAppName = 'Housing Society';
const String kTagline = 'HOME · COMMUNITY · CARE';

const _navyTop = Color(0xFF090F28);
const _electricBlue = Color(0xFF1268D9);
const _electricViolet = Color(0xFF6929C4);
const _neonCyan = Color(0xFF59F2E3);
const _hotPink = Color(0xFFFF4FA3);
const _sunYellow = Color(0xFFFFE66D);
const _building = Color(0xFF101D43);
const _buildingEdge = Color(0xFF426EE8);
const _windowGlow = Color(0xFF8DF8FF);

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, this.onFinished});

  /// Called shortly after the intro ends (e.g. navigate to login).
  final VoidCallback? onFinished;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  static const double _totalSeconds = 3.0;

  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: (_totalSeconds * 1000).round()),
  );
  late final AnimationController _energy = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 9),
  )..repeat();

  bool _reduceMotionHandled = false;

  @override
  void initState() {
    super.initState();
    _intro.forward().whenComplete(() {
      Future<void>.delayed(const Duration(milliseconds: 600), () {
        if (mounted) widget.onFinished?.call();
      });
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_reduceMotionHandled && MediaQuery.disableAnimationsOf(context)) {
      _reduceMotionHandled = true;
      _intro.value = 1;
      _energy.stop();
    }
  }

  @override
  void dispose() {
    _intro.dispose();
    _energy.dispose();
    super.dispose();
  }

  /// Progress (0..1) of something that starts at [startSec] and lasts [durSec].
  double _p(double startSec, double durSec, Curve curve) {
    final elapsed = _intro.value * _totalSeconds;
    final raw = ((elapsed - startSec) / durSec).clamp(0.0, 1.0).toDouble();
    return curve.transform(raw);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: _building,
      ),
      child: Scaffold(
        body: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [_navyTop, _electricBlue, _electricViolet],
              stops: [0, 0.58, 1],
            ),
          ),
          child: AnimatedBuilder(
            animation: Listenable.merge([_intro, _energy]),
            builder: (context, _) {
              final sunSize = size.width * 0.78;
              final sunRise = _p(0, 2.2, Curves.easeOut);
              final wm = _p(1.6, 0.9, Curves.easeOut);
              final tg = _p(2.0, 0.9, Curves.easeOut);
              final skylineHeight = size.width * 0.9;
              final energy = _energy.value;
              final pulse = (math.sin(energy * math.pi * 2) + 1) / 2;
              final orbitSize = sunSize * 1.18;
              final sunBottom = -sunSize * 0.38 + sunSize * 0.45 * sunRise;

              return Stack(
                children: [
                  // Drifting neon dust gives the dark sky a little movement.
                  Positioned.fill(
                    child: IgnorePointer(
                      child: CustomPaint(
                        painter: _SparkFieldPainter(progress: energy),
                      ),
                    ),
                  ),

                  // A rotating orbit and satellite accents frame the sunrise.
                  Positioned(
                    left: (size.width - orbitSize) / 2,
                    bottom: sunBottom - (orbitSize - sunSize) / 2,
                    width: orbitSize,
                    height: orbitSize,
                    child: IgnorePointer(
                      child: Transform.rotate(
                        angle: energy * math.pi * 2,
                        child: CustomPaint(
                          painter: _OrbitPainter(pulse: pulse),
                        ),
                      ),
                    ),
                  ),

                  // Rising sun.
                  Positioned(
                    left: (size.width - sunSize) / 2,
                    bottom: sunBottom,
                    child: IgnorePointer(
                      child: Container(
                        width: sunSize,
                        height: sunSize,
                        // The glow is animated, so this decoration must be
                        // rebuilt with the current pulse value.
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [_sunYellow, _hotPink, Color(0x00FF4FA3)],
                            stops: [0, 0.55, 0.72],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: _hotPink.withValues(
                                alpha: 0.12 + pulse * 0.14,
                              ),
                              blurRadius: 48 + pulse * 32,
                              spreadRadius: 2 + pulse * 7,
                            ),
                            BoxShadow(
                              color: _neonCyan.withValues(
                                alpha: 0.08 + pulse * 0.08,
                              ),
                              blurRadius: 80,
                              spreadRadius: 4,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Wordmark and tagline.
                  Align(
                    alignment: const Alignment(0, -0.5),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Opacity(
                          opacity: wm,
                          child: Transform.translate(
                            offset: Offset(0, (1 - wm) * 14),
                            child: Transform.rotate(
                              angle: math.sin(energy * math.pi * 2) * 0.018,
                              child: Transform.scale(
                                scale: 1 + pulse * 0.025,
                                child: ShaderMask(
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                        colors: [
                                          Colors.white,
                                          _neonCyan,
                                          Color(0xFFFFB8DE),
                                        ],
                                      ).createShader(bounds),
                                  child: const Text(
                                    kAppName,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 8,
                                      shadows: [
                                        Shadow(
                                          color: _neonCyan,
                                          blurRadius: 22,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Opacity(
                          opacity: tg,
                          child: Transform.translate(
                            offset: Offset(0, (1 - tg) * 14),
                            child: const Text(
                              kTagline,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFFD7F8FF),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.8,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Skyline.
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: skylineHeight,
                    child: ClipRect(
                      child: CustomPaint(
                        painter: _SkylinePainter(
                          elapsed: _intro.value * _totalSeconds,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _BuildingSpec {
  const _BuildingSpec(this.left, this.width, this.height);
  final double left, width, height; // design units (design width = 226)
}

class _Win {
  const _Win(this.x, this.y, this.delay);
  final double x, y, delay; // x from building left, y from building bottom
}

class _SkylinePainter extends CustomPainter {
  _SkylinePainter({required this.elapsed});

  final double elapsed; // seconds since intro start

  static const _designWidth = 226.0;
  static const _specs = [
    _BuildingSpec(10, 70, 90),
    _BuildingSpec(38, 46, 130),
    _BuildingSpec(70, 60, 100),
    _BuildingSpec(104, 40, 150),
    _BuildingSpec(140, 56, 110),
    _BuildingSpec(190, 50, 85),
  ];

  // Same easing as the web concept: cubic-bezier(.2,.9,.3,1.1)
  static const _pop = Cubic(0.2, 0.9, 0.3, 1.1);

  static final List<List<_Win>> _windows = _buildWindows();

  static List<List<_Win>> _buildWindows() {
    final rnd = math.Random(7);
    return List.generate(_specs.length, (i) {
      final s = _specs[i];
      final out = <_Win>[];
      for (var r = 0; r < (s.height / 16).floor(); r++) {
        for (var k = 0; k < (s.width / 14).floor(); k++) {
          if ((r + k + i) % 3 == 0) {
            out.add(
              _Win(6.0 + k * 14, 8.0 + r * 16, 1.0 + rnd.nextDouble() * 0.9),
            );
          }
        }
      }
      return out;
    });
  }

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / _designWidth;
    final fill = Paint();
    final edge = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = _buildingEdge;

    for (var i = 0; i < _specs.length; i++) {
      final spec = _specs[i];
      final local = ((elapsed - i * 0.18) / 0.9).clamp(0.0, 1.0).toDouble();
      if (local <= 0) continue;
      final eased = _pop.transform(local);

      final w = spec.width * s;
      final h = spec.height * s;
      final rect = Rect.fromLTWH(
        spec.left * s,
        size.height - h + (1 - eased) * h,
        w,
        h,
      );
      final rrect = RRect.fromRectAndCorners(
        rect,
        topLeft: Radius.circular(3 * s),
        topRight: Radius.circular(3 * s),
      );
      canvas.drawRRect(rrect, fill..color = _building);
      canvas.drawRRect(rrect, edge);

      for (final win in _windows[i]) {
        final a = ((elapsed - win.delay) / 0.5).clamp(0.0, 1.0).toDouble();
        if (a <= 0) continue;
        final wr = Rect.fromLTWH(
          rect.left + win.x * s,
          rect.bottom - (win.y + 6) * s,
          5 * s,
          6 * s,
        );
        canvas.drawRect(wr, fill..color = _windowGlow.withValues(alpha: a));
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SkylinePainter old) => old.elapsed != elapsed;
}

class _OrbitPainter extends CustomPainter {
  const _OrbitPainter({required this.pulse});

  final double pulse;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final rect = Rect.fromCenter(
      center: center,
      width: size.width * 0.88,
      height: size.height * 0.58,
    );

    canvas.drawOval(
      rect,
      Paint()
        ..color = _neonCyan.withValues(alpha: 0.14 + pulse * 0.08)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );

    canvas.drawArc(
      rect.inflate(8),
      math.pi * 0.12,
      math.pi * 0.34,
      false,
      Paint()
        ..color = _hotPink.withValues(alpha: 0.72)
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = 2.4,
    );

    canvas.drawArc(
      rect.inflate(15),
      math.pi * 1.05,
      math.pi * 0.2,
      false,
      Paint()
        ..color = const Color(0xFFFFE66D).withValues(alpha: 0.82)
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = 2,
    );

    final satelliteAngle = math.pi * 2 * pulse;
    final satellite = Offset(
      center.dx + math.cos(satelliteAngle) * rect.width * 0.5,
      center.dy + math.sin(satelliteAngle) * rect.height * 0.5,
    );
    canvas.drawCircle(
      satellite,
      4 + pulse * 1.5,
      Paint()
        ..color = _neonCyan
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6),
    );
    canvas.drawCircle(satellite, 2.4, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant _OrbitPainter oldDelegate) =>
      oldDelegate.pulse != pulse;
}

class _SparkFieldPainter extends CustomPainter {
  const _SparkFieldPainter({required this.progress});

  final double progress;

  static final List<_Spark> _sparks = List.generate(38, (index) {
    final random = math.Random(index * 31 + 7);
    return _Spark(
      random.nextDouble(),
      random.nextDouble(),
      0.7 + random.nextDouble() * 1.7,
      random.nextDouble() * math.pi * 2,
      index % 3,
    );
  });

  @override
  void paint(Canvas canvas, Size size) {
    const colors = [_neonCyan, _hotPink, _sunYellow];
    for (final spark in _sparks) {
      final phase = progress * math.pi * 2 + spark.phase;
      final x = (spark.x + math.sin(phase) * 0.012) * size.width;
      final driftY = (spark.y - progress * 0.025) % 1;
      final y = (driftY < 0 ? driftY + 1 : driftY) * size.height;
      final glow = (math.sin(phase * 1.4) + 1) / 2;
      final color = colors[spark.colorIndex];

      canvas.drawCircle(
        Offset(x, y),
        spark.radius * (0.7 + glow * 0.55),
        Paint()
          ..color = color.withValues(alpha: 0.16 + glow * 0.48)
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, 2 + glow * 4),
      );

      if (spark.radius > 1.8 && glow > 0.82) {
        final sparklePaint = Paint()
          ..color = Colors.white.withValues(alpha: glow * 0.7)
          ..strokeWidth = 0.8
          ..strokeCap = StrokeCap.round;
        canvas.drawLine(Offset(x - 3, y), Offset(x + 3, y), sparklePaint);
        canvas.drawLine(Offset(x, y - 3), Offset(x, y + 3), sparklePaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SparkFieldPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _Spark {
  const _Spark(this.x, this.y, this.radius, this.phase, this.colorIndex);

  final double x;
  final double y;
  final double radius;
  final double phase;
  final int colorIndex;
}
