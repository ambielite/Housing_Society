import 'dart:async';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'
    show MissingPluginException, SystemUiOverlayStyle;
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/session_manager.dart';
import '../../../../app/theme/app_colors.dart';
import '../../data/auth_api.dart';
import '../../data/selfie_file_cleanup.dart';
import '../widgets/auth_brand_header.dart';
import 'forgot_password_screen.dart';
import '../../../security_guard/dashboard/screens/security_dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.sessionExpired = false});

  final bool sessionExpired;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _securityCodeController = TextEditingController();
  Uint8List? _securitySelfieBytes;
  String? _securitySelfieMimeType;
  bool _securityLogin = false;
  bool _obscurePassword = true;
  bool _submitting = false;
  bool _verifyingFace = false;
  bool _faceGuidance = false;
  String? _error;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    if (widget.sessionExpired) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'You’ve been signed out. Please sign in again to continue.',
            ),
            backgroundColor: Color(0xFF9D2635),
          ),
        );
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _securityCodeController.dispose();
    _securitySelfieBytes?.fillRange(0, _securitySelfieBytes!.length, 0);
    super.dispose();
  }

  Future<void> _signIn() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    if (_securityLogin && _securitySelfieBytes == null) {
      setState(() {
        _error = 'Take a selfie before signing in as a guard.';
        _faceGuidance = true;
      });
      return;
    }

    setState(() {
      _submitting = true;
      _verifyingFace = _securityLogin;
      _error = null;
      _successMessage = null;
      _faceGuidance = false;
    });

    final selfieForThisAttempt = _securitySelfieBytes;
    try {
      final user = await AuthApi.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        securityCode: _securityLogin
            ? _securityCodeController.text.trim()
            : null,
        selfieBytes: selfieForThisAttempt,
        selfieMimeType: _securitySelfieMimeType,
      );
      if (!mounted) return;
      if (_securityLogin) {
        setState(() {
          _verifyingFace = false;
          _successMessage = 'Face verified. Signing you in…';
        });
        await Future<void>.delayed(const Duration(seconds: 1));
        if (!mounted) return;
      }
      SessionManager.sessionStarted();
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => SecurityDashboardScreen(user: user),
        ),
      );
    } on AuthException catch (error) {
      if (mounted) {
        final lowerMessage = error.message.toLowerCase();
        final isMismatch = lowerMessage.contains('face not matched');
        final isUnclearFace = lowerMessage.contains('no clear face');
        final isProfilePhotoIssue = lowerMessage.contains('profile photo');
        final faceGuidance = _securityLogin &&
            (isMismatch || isUnclearFace || isProfilePhotoIssue);
        final shouldRetake = _securityLogin && (isMismatch || isUnclearFace);
        setState(() {
          _verifyingFace = false;
          _successMessage = null;
          _faceGuidance = faceGuidance;
          if (isMismatch) {
            _error =
                'Selfie didn’t match. Try again or ask your Society Admin to upload a clear photo.';
          } else if (isUnclearFace) {
            _error =
                'Face not clear. Please retake your selfie.';
          } else if (lowerMessage.contains('profile photo cannot be used')) {
            _error =
                'Selfie couldn’t be verified. Try again or ask your Society Admin to upload a clear photo.';
          } else if (lowerMessage.contains('profile photo')) {
            _error =
                'Selfie couldn’t be verified. Ask your Society Admin to upload a clear photo.';
          } else {
            _error = error.message;
          }
          if (shouldRetake) {
            _securitySelfieBytes = null;
            _securitySelfieMimeType = null;
          }
        });
      }
    } finally {
      selfieForThisAttempt?.fillRange(0, selfieForThisAttempt.length, 0);
      if (mounted) {
        setState(() {
          _submitting = false;
          _verifyingFace = false;
          _securitySelfieBytes = null;
          _securitySelfieMimeType = null;
        });
      }
    }
  }

  Future<void> _captureSecuritySelfie() async {
    try {
      final cameras = await availableCameras();
      if (!mounted) return;
      if (cameras.isEmpty) {
        setState(() {
          _error = 'No camera was found on this device.';
          _successMessage = null;
          _faceGuidance = false;
        });
        return;
      }
      final camera = cameras.firstWhere(
        (device) => device.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      final selfie = await showDialog<XFile>(
        context: context,
        barrierDismissible: false,
        builder: (_) => _GuardSelfieCameraDialog(camera: camera),
      );
      if (selfie == null || !mounted) return;

      late final Uint8List bytes;
      try {
        bytes = await selfie.readAsBytes();
      } finally {
        try {
          await deleteTemporarySelfie(selfie.path);
        } catch (_) {
          // Camera implementations may already remove their temporary file.
        }
      }
      final mimeType = selfie.mimeType ?? 'image/jpeg';
      if (bytes.isEmpty ||
          !const {'image/jpeg', 'image/png'}.contains(mimeType)) {
        setState(
          () {
            _error = 'The camera returned an unsupported image. Please take the selfie again.';
            _successMessage = null;
            _faceGuidance = false;
          },
        );
        return;
      }
      setState(() {
        _securitySelfieBytes?.fillRange(0, _securitySelfieBytes!.length, 0);
        _securitySelfieBytes = bytes;
        _securitySelfieMimeType = mimeType;
        _error = null;
        _successMessage = null;
        _faceGuidance = false;
      });
    } on CameraException catch (error) {
      if (mounted) {
        setState(() {
          _error = _cameraAccessMessage(error);
          _successMessage = null;
          _faceGuidance = false;
        });
      }
    } on MissingPluginException {
      if (mounted) {
        setState(
          () {
            _error = 'Camera support did not load. Stop the app, run flutter pub get, then launch it again.';
            _successMessage = null;
            _faceGuidance = false;
          },
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = 'Could not start the camera: $error';
          _successMessage = null;
          _faceGuidance = false;
        });
      }
    }
  }

  String _cameraAccessMessage(CameraException error) {
    if (error.code.toLowerCase().contains('denied') ||
        error.code.toLowerCase().contains('permission')) {
      return 'Camera access is blocked. Allow camera access for this site in Chrome settings, then try again.';
    }
    return error.description ??
        'Could not start the camera. Use HTTPS or localhost and check that a camera is available.';
  }

  @override
  Widget build(BuildContext context) {
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: const Color(0xFFF7FAFD),
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF7FAFD),
        body: SafeArea(
          top: false,
          child: LayoutBuilder(
            builder: (context, constraints) => SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AuthBrandHeader(
                        height: keyboardOpen ? 220 : 300,
                        headline: _securityLogin
                            ? 'Welcome, Guard'
                            : 'Welcome Home',
                        subtitle: _securityLogin
                            ? 'Your community. Your duty.'
                            : 'Your community, connected',
                      ),
                      Padding(
                        padding: EdgeInsets.fromLTRB(
                          constraints.maxWidth > 560 ? 34 : 24,
                          keyboardOpen ? 4 : 2,
                          constraints.maxWidth > 560 ? 34 : 24,
                          MediaQuery.viewPaddingOf(context).bottom + 22,
                        ),
                        child: _buildLoginForm(compact: true),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginForm({
    bool compact = false,
    bool fillAvailableHeight = false,
  }) {
    final sectionGap = compact ? 14.0 : 30.0;
    final fieldGap = compact ? 12.0 : 20.0;
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _roleSelector(),
          SizedBox(height: sectionGap),
          _FieldLabel('Email address', compact: compact),
          SizedBox(height: compact ? 4 : 8),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autocorrect: false,
            autofillHints: const [AutofillHints.username],
            decoration: _inputDecoration(
              hint: 'you@example.com',
              icon: Icons.mail_outline_rounded,
              compact: compact,
            ),
            validator: (value) {
              final email = value?.trim() ?? '';
              if (email.isEmpty) return 'Enter your email address';
              if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
                return 'Enter a valid email address';
              }
              return null;
            },
          ),
          SizedBox(height: fieldGap),
          _FieldLabel('Password', compact: compact),
          SizedBox(height: compact ? 4 : 8),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.password],
            onFieldSubmitted: (_) => _signIn(),
            decoration:
                _inputDecoration(
                  hint: 'Enter your password',
                  icon: Icons.lock_outline_rounded,
                  compact: compact,
                ).copyWith(
                  suffixIcon: IconButton(
                    tooltip: _obscurePassword
                        ? 'Show password'
                        : 'Hide password',
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: const Color(0xFF718096),
                    ),
                  ),
                ),
            validator: (value) =>
                value == null || value.isEmpty ? 'Enter your password' : null,
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeInOutCubic,
            alignment: Alignment.topCenter,
            child: _securityLogin
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _submitting
                            ? null
                            : () => Navigator.of(context).push<void>(
                                MaterialPageRoute<void>(
                                  builder: (_) => const ForgotPasswordScreen(),
                                ),
                              ),
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF102A43),
                          minimumSize: Size.zero,
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                          textStyle: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        child: const Text('Forgot password?'),
                      ),
                    ),
                  ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 360),
            curve: Curves.easeInOutCubic,
            alignment: Alignment.topCenter,
            child: _securityLogin
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(height: fieldGap),
                      _FieldLabel(
                        'Security code (employee code)',
                        compact: compact,
                      ),
                      SizedBox(height: compact ? 4 : 8),
                      TextFormField(
                        controller: _securityCodeController,
                        textCapitalization: TextCapitalization.characters,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _signIn(),
                        decoration: _inputDecoration(
                          hint: 'Enter your employee code',
                          icon: Icons.badge_outlined,
                          compact: compact,
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Enter your employee code'
                            : null,
                      ),
                      SizedBox(height: fieldGap),
                      _FieldLabel('Selfie verification', compact: compact),
                      SizedBox(height: compact ? 4 : 8),
                      if (_securitySelfieBytes == null)
                        OutlinedButton.icon(
                          onPressed: _submitting
                              ? null
                              : _captureSecuritySelfie,
                          icon: const Icon(Icons.camera_alt_outlined),
                          label: const Text('Take a selfie'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF2786C5),
                            minimumSize: Size.fromHeight(compact ? 40 : 52),
                            side: const BorderSide(color: Color(0xFF8CB8D2)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFDDE6EF)),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(9),
                                child: Image.memory(
                                  _securitySelfieBytes!,
                                  width: 64,
                                  height: 64,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Text(
                                  'Selfie captured',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                              ),
                              TextButton(
                                onPressed: _submitting
                                    ? null
                                    : _captureSecuritySelfie,
                                child: const Text('Retake'),
                              ),
                            ],
                          ),
                        ),
                      SizedBox(height: compact ? 3 : 6),
                      const Text(
                        'A front-camera selfie is required for guard sign-in.',
                        style: TextStyle(
                          color: Color(0xFF718096),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  )
                : const SizedBox(width: double.infinity),
          ),
          if (_verifyingFace) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF6FC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFD3E7F3)),
              ),
              child: const Row(
                children: [
                  _FaceScanIndicator(),
                  SizedBox(width: 11),
                  Expanded(
                    child: Text(
                      'Checking that your selfie matches your profile photo…',
                      style: TextStyle(
                        color: Color(0xFF355B72),
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_successMessage != null) ...[
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF8F0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFC9EBD7)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_circle_outline_rounded,
                    size: 20,
                    color: Color(0xFF21834A),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      _successMessage!,
                      style: const TextStyle(
                        color: Color(0xFF176B3A),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: _faceGuidance
                    ? const Color(0xFFEEF6FC)
                    : const Color(0xFFFFF0F0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _faceGuidance
                      ? const Color(0xFFD3E7F3)
                      : const Color(0xFFFFD0D0),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    _faceGuidance
                        ? Icons.info_outline_rounded
                        : Icons.error_outline_rounded,
                    size: 19,
                    color: _faceGuidance
                        ? const Color(0xFF3482AC)
                        : const Color(0xFFC53D4B),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _error!,
                          style: TextStyle(
                            color: _faceGuidance
                                ? const Color(0xFF355B72)
                                : const Color(0xFF9D2635),
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (fillAvailableHeight && !compact) const Spacer(),
          SizedBox(height: compact ? 12 : 22),
          SizedBox(
            height: compact ? 48 : 56,
            child: FilledButton(
              onPressed: _submitting ? null : _signIn,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFFD000),
                foregroundColor: const Color(0xFF152B46),
                disabledBackgroundColor: const Color(0xFFFFD000),
                disabledForegroundColor: const Color(0xFF152B46),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _submitting
                  ? const SizedBox.square(
                      dimension: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        color: Color(0xFF152B46),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _securityLogin ? 'Sign in as guard' : 'Sign in',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Icon(Icons.arrow_forward_rounded, size: 19),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 12),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.verified_user_outlined,
                size: 15,
                color: Color(0xFF2786C5),
              ),
              SizedBox(width: 7),
              Text(
                'SECURE ACCESS TO YOUR COMMUNITY',
                style: TextStyle(
                  color: Color(0xFF5B6E82),
                  fontSize: 10,
                  letterSpacing: .7,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          InkWell(
            borderRadius: BorderRadius.circular(4),
            onTap: () async {
              await launchUrl(
                Uri.parse('https://ambielite.in/'),
                mode: LaunchMode.externalApplication,
              );
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 2, horizontal: 4),
              child: Text(
                'Powered by Ambi Elite Pvt Ltd',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF2786C5),
                  fontSize: 10,
                  letterSpacing: .25,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          SizedBox(height: compact ? 0 : 10),
          if (fillAvailableHeight && compact && !_securityLogin)
            const Spacer(flex: 2),
          if (fillAvailableHeight && compact && _securityLogin)
            const SizedBox(height: 10),
          if (fillAvailableHeight && !compact) const Spacer(flex: 2),
          if (!compact) ...[
            const SizedBox(height: 12),
            Text(
              _securityLogin
                  ? 'Use the shared security account credentials.'
                  : 'A secure, private place for your community.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF718096), fontSize: 12),
            ),
          ],
          if (fillAvailableHeight)
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.verified_user_outlined,
                  size: 14,
                  color: Color(0xFF2786C5),
                ),
                SizedBox(width: 6),
                Text(
                  'PRIVATE  •  SECURE  •  COMMUNITY',
                  style: TextStyle(
                    color: Color(0xFF718096),
                    fontSize: 10,
                    letterSpacing: 1.1,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _roleSelector() => Container(
    padding: const EdgeInsets.all(5),
    decoration: BoxDecoration(
      color: const Color(0xFFEAF3F7),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Row(
      children: [
        _roleOption(
          'Resident',
          Icons.people_alt_outlined,
          !_securityLogin,
          () => _setLoginMode(false),
        ),
        _roleOption(
          'Security Guard',
          Icons.security_rounded,
          _securityLogin,
          () => _setLoginMode(true),
        ),
      ],
    ),
  );

  Widget _roleOption(
    String label,
    IconData icon,
    bool selected,
    VoidCallback onTap,
  ) => Expanded(
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        color: selected ? const Color(0xFFFFD324) : Colors.transparent,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: _submitting ? null : onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 19, color: const Color(0xFF152B46)),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF152B46),
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  void _setLoginMode(bool security) {
    if (_securityLogin == security || _submitting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _securitySelfieBytes?.fillRange(0, _securitySelfieBytes!.length, 0);
      _securityLogin = security;
      _securityCodeController.clear();
      _securitySelfieBytes = null;
      _securitySelfieMimeType = null;
      _error = null;
      _successMessage = null;
      _faceGuidance = false;
    });
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
    bool compact = false,
  }) => InputDecoration(
    hintText: hint,
    prefixIcon: Icon(icon, color: const Color(0xFF718096)),
    filled: true,
    fillColor: const Color(0xFFFFFFFF),
    isDense: compact,
    contentPadding: EdgeInsets.symmetric(
      horizontal: 15,
      vertical: compact ? 10 : 16,
    ),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFDDE6EF)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFDDE6EF)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFF2786C5), width: 1.5),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFC53D4B)),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFC53D4B), width: 1.5),
    ),
  );
}

class _FaceScanIndicator extends StatefulWidget {
  const _FaceScanIndicator();

  @override
  State<_FaceScanIndicator> createState() => _FaceScanIndicatorState();
}

class _FaceScanIndicatorState extends State<_FaceScanIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scanController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _scanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Container(
    width: 30,
    height: 30,
    decoration: BoxDecoration(
      color: const Color(0xFFE2F0F8),
      shape: BoxShape.circle,
      border: Border.all(color: const Color(0xFFB8D7E8)),
    ),
    child: AnimatedBuilder(
      animation: _scanController,
      builder: (context, child) => Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          const Center(
            child: Icon(
              Icons.man_2_outlined,
              size: 19,
              color: Color(0xFF3482AC),
            ),
          ),
          Positioned(
            left: 5,
            right: 5,
            top: 4 + (_scanController.value * 19),
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                color: const Color(0xFF2A91C6),
                borderRadius: BorderRadius.circular(2),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x802A91C6),
                    blurRadius: 4,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text, {this.compact = false});

  final String text;
  final bool compact;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      color: Color(0xFF102A43),
      fontWeight: FontWeight.w700,
      fontSize: compact ? 12 : 14,
    ),
  );
}

class _GuardSelfieCameraDialog extends StatefulWidget {
  const _GuardSelfieCameraDialog({required this.camera});

  final CameraDescription camera;

  @override
  State<_GuardSelfieCameraDialog> createState() =>
      _GuardSelfieCameraDialogState();
}

class _GuardSelfieCameraDialogState extends State<_GuardSelfieCameraDialog> {
  CameraController? _controller;
  Future<void>? _initialization;
  Object? _initializationError;
  String? _captureError;
  bool _takingPicture = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  void _initializeCamera() {
    final previous = _controller;
    _controller = null;
    _initializationError = null;
    _captureError = null;
    _initialization = _openCamera(previous);
  }

  Future<void> _openCamera(CameraController? previous) async {
    if (previous != null) await previous.dispose();
    if (!mounted) return;

    final controller = CameraController(
      widget.camera,
      ResolutionPreset.low,
      enableAudio: false,
    );
    _controller = controller;
    try {
      await controller.initialize();
      if (mounted && identical(_controller, controller)) setState(() {});
    } catch (error) {
      await controller.dispose();
      if (mounted && identical(_controller, controller)) {
        setState(() {
          _controller = null;
          _initializationError = error;
        });
      }
    }
  }

  Future<void> _takePicture() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;
    setState(() {
      _takingPicture = true;
      _captureError = null;
    });
    try {
      final picture = await controller.takePicture();
      if (mounted) Navigator.of(context).pop(picture);
    } on CameraException {
      if (mounted) {
        setState(
          () => _captureError = 'Could not take the selfie. Please try again.',
        );
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _captureError = 'Could not capture the selfie. Try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _takingPicture = false);
    }
  }

  @override
  void dispose() {
    final controller = _controller;
    if (controller != null) unawaited(controller.dispose());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    return AlertDialog(
      title: const Text('Take a selfie'),
      content: SizedBox(
        width: 340,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_initializationError != null)
              _cameraErrorContent(_initializationError!)
            else if (_initialization == null || controller == null)
              const Center(child: CircularProgressIndicator())
            else
              FutureBuilder<void>(
                future: _initialization,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const SizedBox(
                      height: 220,
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  if (_initializationError != null) {
                    return _cameraErrorContent(_initializationError!);
                  }
                  return Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        maxWidth: 320,
                        maxHeight: 300,
                      ),
                      child: AspectRatio(
                        aspectRatio: controller.value.aspectRatio,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: CameraPreview(controller),
                        ),
                      ),
                    ),
                  );
                },
              ),
            if (_captureError != null) ...[
              const SizedBox(height: 10),
              Text(
                _captureError!,
                style: const TextStyle(color: Color(0xFF9D2635)),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _takingPicture ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        if (_initializationError != null)
          TextButton(
            onPressed: _takingPicture
                ? null
                : () => setState(_initializeCamera),
            child: const Text('Try again'),
          )
        else
          FilledButton.icon(
            onPressed:
                _takingPicture ||
                    controller == null ||
                    !controller.value.isInitialized
                ? null
                : _takePicture,
            icon: _takingPicture
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.camera_alt_outlined),
            label: const Text('Capture'),
          ),
      ],
    );
  }

  Widget _cameraErrorContent(Object error) {
    final isPermissionError = error is CameraException &&
        (error.code.toLowerCase().contains('denied') ||
            error.code.toLowerCase().contains('permission'));
    final message = isPermissionError
        ? 'Allow camera access in your phone settings, then try again.'
        : 'The camera could not start. Tap Try again. If it continues, check camera access in your phone settings.';
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.videocam_off_outlined, size: 34),
        const SizedBox(height: 10),
        Text(
          message,
          textAlign: TextAlign.center,
          maxLines: 4,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}
