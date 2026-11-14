import 'dart:async';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'
    show MissingPluginException, SystemUiOverlayStyle;

import '../../../../app/session_manager.dart';
import '../../../../app/theme/app_colors.dart';
import '../../data/auth_api.dart';
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
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.sessionExpired) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Your session has expired. Please sign in again.'),
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
    super.dispose();
  }

  Future<void> _signIn() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    if (_securityLogin && _securitySelfieBytes == null) {
      setState(() => _error = 'Take a selfie before signing in as a guard.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final user = await AuthApi.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        securityCode: _securityLogin
            ? _securityCodeController.text.trim()
            : null,
        selfieBytes: _securitySelfieBytes,
        selfieMimeType: _securitySelfieMimeType,
      );
      if (!mounted) return;
      SessionManager.sessionStarted();
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => SecurityDashboardScreen(user: user),
        ),
      );
    } on AuthException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _captureSecuritySelfie() async {
    try {
      final cameras = await availableCameras();
      if (!mounted) return;
      if (cameras.isEmpty) {
        setState(() => _error = 'No camera was found on this device.');
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

      final bytes = await selfie.readAsBytes();
      final mimeType = selfie.mimeType ?? 'image/jpeg';
      if (bytes.isEmpty || !const {'image/jpeg', 'image/png'}.contains(mimeType)) {
        setState(
          () => _error =
              'The camera returned an unsupported image. Please take the selfie again.',
        );
        return;
      }
      setState(() {
        _securitySelfieBytes = bytes;
        _securitySelfieMimeType = mimeType;
        _error = null;
      });
    } on CameraException catch (error) {
      if (mounted) {
        setState(
          () => _error = _cameraAccessMessage(error),
        );
      }
    } on MissingPluginException {
      if (mounted) {
        setState(
          () => _error =
              'Camera support did not load. Stop the app, run flutter pub get, then launch it again.',
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = 'Could not start the camera: $error');
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
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarDividerColor: Colors.transparent,
        systemNavigationBarContrastEnforced: false,
        systemStatusBarContrastEnforced: false,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF8F5EC),
        body: SafeArea(
        top: false,
        bottom: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            if (constraints.maxWidth >= 860) {
              return Row(
                children: [
                  Expanded(flex: 11, child: _buildWelcomePanel()),
                  Expanded(
                    flex: 9,
                    child: Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 36),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 470),
                          child: _buildLoginForm(),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }
            final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  height:
                      (keyboardOpen ? 82.0 : 270.0) +
                      MediaQuery.viewPaddingOf(context).top,
                  child: _buildWelcomePanel(
                    compact: true,
                    keyboardOpen: keyboardOpen,
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      24,
                      14,
                      24,
                      MediaQuery.viewPaddingOf(context).bottom + 20,
                    ),
                    child: LayoutBuilder(
                      builder: (context, formConstraints) =>
                          SingleChildScrollView(
                            keyboardDismissBehavior:
                                ScrollViewKeyboardDismissBehavior.onDrag,
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                minHeight: formConstraints.maxHeight,
                              ),
                              child: IntrinsicHeight(
                                child: Center(
                                  child: ConstrainedBox(
                                    constraints: const BoxConstraints(
                                      maxWidth: 470,
                                    ),
                                    child: _buildLoginForm(
                                      compact: true,
                                      fillAvailableHeight: !keyboardOpen,
                                    ),
                                  ),
                                ),
                              ),
                            ),
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

  Widget _buildWelcomePanel({
    bool compact = false,
    bool keyboardOpen = false,
  }) {
    return ClipRRect(
      borderRadius: compact
          ? const BorderRadius.vertical(bottom: Radius.circular(30))
          : BorderRadius.zero,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/shubhnivas_residence.jpg', fit: BoxFit.cover),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xAA052D32), Color(0x55052D32), Color(0xE8052D32)],
                stops: [0, .38, 1],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              compact ? 26 : 54,
              compact ? MediaQuery.viewPaddingOf(context).top + 12 : 38,
              34,
              compact ? 25 : 54,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0x33DDB84E),
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(
                        Icons.home_rounded,
                        color: Color(0xFFFFD56A),
                        size: 27,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ShubhNivas', style: TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w700, letterSpacing: .2)),
                        SizedBox(height: 3),
                        Text('SMARTER LIVING, TOGETHER.', style: TextStyle(color: Color(0xFFD9C792), fontSize: 9, letterSpacing: 1.7, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
                if (!keyboardOpen) const Spacer(),
                if (!keyboardOpen) Container(
                  padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
                  decoration: BoxDecoration(color: const Color(0x332BB8A6), borderRadius: BorderRadius.circular(30), border: Border.all(color: const Color(0x6677C8B9))),
                  child: const Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.verified_user_outlined, size: 13, color: Color(0xFFFFD56A)), SizedBox(width: 7), Text('YOUR COMMUNITY, CONNECTED', style: TextStyle(color: Colors.white, fontSize: 9, letterSpacing: 1.1, fontWeight: FontWeight.w600))]),
                ),
                if (!keyboardOpen) const SizedBox(height: 17),
                if (!keyboardOpen) Text(
                  _securityLogin ? 'A safer home,\ntogether.' : 'Welcome\nhome.',
                  style: TextStyle(color: Colors.white, fontFamily: 'serif', fontSize: compact ? 36 : 54, height: 1.05, fontWeight: FontWeight.w400, letterSpacing: -.7),
                ),
                if (!keyboardOpen) const SizedBox(height: 10),
                if (!keyboardOpen) Text(
                  _securityLogin ? 'Every arrival matters. Sign in to begin your duty.' : 'Your people. Your place.\nEverything, a little closer.',
                  style: const TextStyle(color: Color(0xFFE3E9E4), fontSize: 14, height: 1.55),
                ),
                if (!compact) ...[
                  const SizedBox(height: 25),
                  const Row(children: [Icon(Icons.lock_outline, color: Color(0xFFD9C792), size: 15), SizedBox(width: 8), Text('A private space for your community', style: TextStyle(color: Color(0xFFE3E9E4), fontSize: 12))]),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginForm({
    bool compact = false,
    bool fillAvailableHeight = false,
  }) {
    final sectionGap = compact ? (_securityLogin ? 10.0 : 14.0) : 30.0;
    final fieldGap = compact ? (_securityLogin ? 8.0 : 12.0) : 20.0;
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_securityLogin ? 'Guard sign in' : 'Your home awaits', style: TextStyle(color: const Color(0xFF18363A), fontFamily: 'serif', fontSize: compact ? 24 : 30, fontWeight: FontWeight.w600, letterSpacing: -.7)),
                    SizedBox(height: compact ? 3 : 8),
                    Text(_securityLogin ? 'Use your employee code and capture a selfie.' : 'Sign in to your ShubhNivas community.', style: TextStyle(color: const Color(0xFF718489), fontSize: compact ? 12 : 14, height: 1.35)),
                  ],
                ),
              ),
              if (!compact)
                Container(width: 42, height: 42, decoration: BoxDecoration(color: const Color(0xFFECE5D4), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.home_work_outlined, color: Color(0xFF9A7835))),
            ],
          ),
          SizedBox(height: sectionGap),
          _FieldLabel('Email address', compact: compact),
          SizedBox(height: compact ? 4 : 8),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autocorrect: false,
            autofillHints: const [AutofillHints.username],
            decoration: _inputDecoration(hint: 'you@example.com', icon: Icons.mail_outline_rounded, compact: compact),
            validator: (value) {
              final email = value?.trim() ?? '';
              if (email.isEmpty) return 'Enter your email address';
              if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) return 'Enter a valid email address';
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
            decoration: _inputDecoration(hint: 'Enter your password', icon: Icons.lock_outline_rounded, compact: compact).copyWith(
              suffixIcon: IconButton(
                tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: const Color(0xFF8A9997)),
              ),
            ),
            validator: (value) => value == null || value.isEmpty ? 'Enter your password' : null,
          ),
          if (!_securityLogin)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _submitting ? null : () => Navigator.of(context).push<void>(MaterialPageRoute<void>(builder: (_) => const ForgotPasswordScreen())),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF81652F),
                  minimumSize: Size.fromHeight(compact ? 30 : 48),
                  padding: EdgeInsets.zero,
                  tapTargetSize: compact ? MaterialTapTargetSize.shrinkWrap : MaterialTapTargetSize.padded,
                ),
                child: const Text('Forgot password?'),
              ),
            ),
          if (_securityLogin) ...[
            SizedBox(height: fieldGap),
            _FieldLabel('Security code (employee code)', compact: compact),
            SizedBox(height: compact ? 4 : 8),
            TextFormField(
              controller: _securityCodeController,
              textCapitalization: TextCapitalization.characters,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _signIn(),
              decoration: _inputDecoration(hint: 'Enter your employee code', icon: Icons.badge_outlined, compact: compact),
              validator: (value) => value == null || value.trim().isEmpty ? 'Enter your employee code' : null,
            ),
            SizedBox(height: fieldGap),
            _FieldLabel('Selfie verification', compact: compact),
            SizedBox(height: compact ? 4 : 8),
            if (_securitySelfieBytes == null)
              OutlinedButton.icon(
                onPressed: _submitting ? null : _captureSecuritySelfie,
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Take a selfie'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF84682F),
                  minimumSize: Size.fromHeight(compact ? 40 : 52),
                  side: const BorderSide(color: Color(0xFFB79B5E)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE0D9C8))),
                child: Row(
                  children: [
                    ClipRRect(borderRadius: BorderRadius.circular(9), child: Image.memory(_securitySelfieBytes!, width: 64, height: 64, fit: BoxFit.cover)),
                    const SizedBox(width: 12),
                    const Expanded(child: Text('Selfie captured', style: TextStyle(fontWeight: FontWeight.w600))),
                    TextButton(onPressed: _submitting ? null : _captureSecuritySelfie, child: const Text('Retake')),
                  ],
                ),
              ),
            SizedBox(height: compact ? 3 : 6),
            const Text('A front-camera selfie is required for guard sign-in.', style: TextStyle(color: Color(0xFF879895), fontSize: 12)),
          ],
          if (_error != null) ...[
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(color: const Color(0xFFFFF0F0), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFFD0D0))),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline_rounded, size: 19, color: Color(0xFFC53D4B)),
                  const SizedBox(width: 9),
                  Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFF9D2635), height: 1.35))),
                ],
              ),
            ),
          ],
          if (fillAvailableHeight && !compact) const Spacer(),
          SizedBox(height: compact ? 12 : 22),
          SizedBox(
            height: compact ? (_securityLogin ? 44 : 48) : 56,
            child: FilledButton(
              onPressed: _submitting ? null : _signIn,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFDDB84E),
                foregroundColor: const Color(0xFF17383B),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _submitting
                  ? const SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Color(0xFF17383B)))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_securityLogin ? 'Sign in as guard' : 'Sign in', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                        const SizedBox(width: 10),
                        const Icon(Icons.arrow_forward_rounded, size: 19),
                      ],
                    ),
            ),
          ),
          SizedBox(height: compact ? 0 : 10),
          TextButton(
            onPressed: _submitting
                ? null
                : () => setState(() {
                    _securityLogin = !_securityLogin;
                    _securityCodeController.clear();
                    _securitySelfieBytes = null;
                    _securitySelfieMimeType = null;
                    _error = null;
                    _formKey.currentState?.reset();
                  }),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF547074),
              minimumSize: Size.fromHeight(compact ? 32 : 48),
              padding: EdgeInsets.zero,
              tapTargetSize: compact ? MaterialTapTargetSize.shrinkWrap : MaterialTapTargetSize.padded,
            ),
            child: compact
                ? Text(_securityLogin ? 'Back to resident login' : 'Security guard sign in', textAlign: TextAlign.center)
                : Text(_securityLogin ? 'Back to resident login' : 'Security guard? Sign in with employee code', textAlign: TextAlign.center),
          ),
          if (fillAvailableHeight && compact && !_securityLogin)
            const Spacer(flex: 2),
          if (fillAvailableHeight && compact && _securityLogin)
            const SizedBox(height: 10),
          if (fillAvailableHeight && !compact) const Spacer(flex: 2),
          if (!compact) ...[
            const SizedBox(height: 12),
            Text(_securityLogin ? 'Use the shared security account credentials.' : 'A secure, private place for your community.', textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF879895), fontSize: 12)),
          ],
          if (fillAvailableHeight)
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.verified_user_outlined, size: 14, color: Color(0xFF9A7835)),
                SizedBox(width: 6),
                Text(
                  'PRIVATE  •  SECURE  •  COMMUNITY',
                  style: TextStyle(
                    color: Color(0xFF879895),
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

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
    bool compact = false,
  }) => InputDecoration(
    hintText: hint,
    prefixIcon: Icon(icon, color: const Color(0xFF879895)),
    filled: true,
    fillColor: const Color(0xFFFFFEFB),
    isDense: compact,
    contentPadding: EdgeInsets.symmetric(horizontal: 15, vertical: compact ? 10 : 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFE0D9C8)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFE0D9C8)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFF9A7835), width: 1.5),
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

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text, {this.compact = false});

  final String text;
  final bool compact;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      color: Color(0xFF18363A),
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
    if (previous != null) unawaited(previous.dispose());

    final controller = CameraController(
      widget.camera,
      ResolutionPreset.medium,
      enableAudio: false,
    );
    _controller = controller;
    _initializationError = null;
    _captureError = null;
    _initialization = controller.initialize().then<void>((_) {
      if (mounted && identical(_controller, controller)) setState(() {});
    }).catchError((Object error) {
      if (mounted && identical(_controller, controller)) {
        setState(() => _initializationError = error);
      }
    });
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
    } on CameraException catch (error) {
      if (mounted) {
        setState(() => _captureError =
            error.description ?? 'Could not capture the selfie. Try again.');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _captureError = 'Could not capture the selfie. Try again.');
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
            onPressed: _takingPicture ? null : () => setState(_initializeCamera),
            child: const Text('Try again'),
          )
        else
          FilledButton.icon(
            onPressed: _takingPicture ||
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
    final message = error is CameraException &&
            (error.code.toLowerCase().contains('denied') ||
                error.code.toLowerCase().contains('permission'))
        ? 'Camera access is blocked. Allow camera access for this site in Chrome settings, then try again.'
        : error is CameraException && error.description != null
        ? error.description!
        : 'Could not start the camera. Use HTTPS or localhost and check that a camera is available.';
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.videocam_off_outlined, size: 34),
        const SizedBox(height: 10),
        Text(message, textAlign: TextAlign.center),
      ],
    );
  }
}
