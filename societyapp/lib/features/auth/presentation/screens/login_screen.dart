import 'dart:async';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show MissingPluginException;

import '../../../../app/session_manager.dart';
import '../../../../app/theme/app_colors.dart';
import '../../data/auth_api.dart';
import 'forgot_password_screen.dart';
import '../widgets/society_brand_mark.dart';
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
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(26, 36, 26, 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: SocietyBrandMark(size: 68)),
                    const SizedBox(height: 28),
                    Text(
                      _securityLogin ? 'Security guard login' : 'Welcome back',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: AppColors.ink,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _securityLogin
                          ? 'Use the shared guard account and your employee code'
                          : 'Sign in to your Housing Society account',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium
                          ?.copyWith(color: AppColors.muted),
                    ),
                    const SizedBox(height: 34),
                    const _FieldLabel('Email address'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autocorrect: false,
                      autofillHints: const [AutofillHints.username],
                      decoration: _inputDecoration(
                        hint: 'you@example.com',
                        icon: Icons.mail_outline_rounded,
                      ),
                      validator: (value) {
                        final email = value?.trim() ?? '';
                        if (email.isEmpty) return 'Enter your email address';
                        if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                            .hasMatch(email)) {
                          return 'Enter a valid email address';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    const _FieldLabel('Password'),
                    const SizedBox(height: 8),
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
                          ).copyWith(
                            suffixIcon: IconButton(
                              tooltip: _obscurePassword
                                  ? 'Show password'
                                  : 'Hide password',
                              onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword,
                              ),
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                color: AppColors.muted,
                              ),
                            ),
                          ),
                      validator: (value) => (value == null || value.isEmpty)
                          ? 'Enter your password'
                          : null,
                    ),
                    if (!_securityLogin)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _submitting
                              ? null
                              : () => Navigator.of(context).push<void>(
                                  MaterialPageRoute<void>(
                                    builder: (_) =>
                                        const ForgotPasswordScreen(),
                                  ),
                                ),
                          child: const Text('Forgot password?'),
                        ),
                      ),
                    if (_securityLogin) ...[
                      const SizedBox(height: 20),
                      const _FieldLabel('Security code (employee code)'),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _securityCodeController,
                        textCapitalization: TextCapitalization.characters,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _signIn(),
                        decoration: _inputDecoration(
                          hint: 'Enter your employee code',
                          icon: Icons.badge_outlined,
                        ),
                        validator: (value) =>
                            _securityLogin &&
                                (value == null || value.trim().isEmpty)
                            ? 'Enter your employee code'
                            : null,
                      ),
                      const SizedBox(height: 20),
                      const _FieldLabel('Selfie verification'),
                      const SizedBox(height: 8),
                      if (_securitySelfieBytes == null)
                        OutlinedButton.icon(
                          onPressed: _submitting
                              ? null
                              : _captureSecuritySelfie,
                          icon: const Icon(Icons.camera_alt_outlined),
                          label: const Text('Take a selfie'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.indigo,
                            minimumSize: const Size.fromHeight(52),
                            side: const BorderSide(color: AppColors.indigo),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFDDE3F0)),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
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
                      const SizedBox(height: 6),
                      Text(
                        'A front-camera selfie is required for guard sign-in.',
                        style: TextStyle(color: AppColors.muted, fontSize: 12),
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 18),
                      Container(
                        padding: const EdgeInsets.all(13),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF0F0),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFFD0D0)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.error_outline_rounded,
                              size: 19,
                              color: Color(0xFFC53D4B),
                            ),
                            const SizedBox(width: 9),
                            Expanded(
                              child: Text(
                                _error!,
                                style: const TextStyle(
                                  color: Color(0xFF9D2635),
                                  height: 1.35,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 28),
                    SizedBox(
                      height: 54,
                      child: FilledButton(
                        onPressed: _submitting ? null : _signIn,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.indigo,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                        child: _submitting
                            ? const SizedBox.square(
                                dimension: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.4,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                _securityLogin ? 'Sign in as guard' : 'Sign in',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 10),
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
                      child: Text(
                        _securityLogin
                            ? '← Back to resident login'
                            : 'Security guard? Sign in with employee code',
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      _securityLogin
                          ? 'Use the shared security account credentials.'
                          : 'Use your existing society account to continue.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
  }) => InputDecoration(
    hintText: hint,
    prefixIcon: Icon(icon, color: AppColors.muted),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFDDE3F0)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFDDE3F0)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: AppColors.indigo, width: 1.6),
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
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      color: AppColors.ink,
      fontWeight: FontWeight.w700,
      fontSize: 14,
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
