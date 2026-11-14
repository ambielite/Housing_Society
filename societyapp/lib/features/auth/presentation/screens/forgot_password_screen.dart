import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../data/auth_api.dart';
import 'reset_password_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  late final AnimationController _entryController;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 850),
    )..forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _entryController.dispose();
    super.dispose();
  }

  Future<void> _requestReset() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await AuthApi.forgotPassword(
        email: _emailController.text.trim(),
      );
      if (mounted) {
        Navigator.of(context).push<void>(
          MaterialPageRoute<void>(
            builder: (_) => ResetPasswordScreen(
              email: _emailController.text.trim(),
            ),
          ),
        );
      }
    } on AuthException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final entrance = CurvedAnimation(
      parent: _entryController,
      curve: Curves.easeOutCubic,
    );
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
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
        child: Column(
          children: [
            SizedBox(
              height:
                  (keyboardOpen ? 96.0 : 190.0) +
                  MediaQuery.viewPaddingOf(context).top,
              child: _recoveryHero(),
            ),
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 500),
                  child: ListView(
                    padding: EdgeInsets.fromLTRB(
                      22,
                      22,
                      22,
                      MediaQuery.viewPaddingOf(context).bottom + 24,
                    ),
                    children: [
                      FadeTransition(
                        opacity: entrance,
                        child: SlideTransition(
                          position: entrance.drive(
                            Tween<Offset>(
                              begin: const Offset(0, .12),
                              end: Offset.zero,
                            ),
                          ),
                          child: _requestContent(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }

  Widget _recoveryHero() => Stack(
    fit: StackFit.expand,
    children: [
      Image.asset('assets/images/shubhnivas_residence.jpg', fit: BoxFit.cover),
      const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xC8052D32), Color(0xE8052D32)],
          ),
        ),
      ),
      Padding(
        padding: EdgeInsets.fromLTRB(
          22,
          MediaQuery.viewPaddingOf(context).top +
              (MediaQuery.viewInsetsOf(context).bottom == 0 ? 12 : 0),
          22,
          MediaQuery.viewInsetsOf(context).bottom == 0 ? 12 : 0,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                  color: Colors.white,
                  tooltip: 'Back to sign in',
                ),
                const SizedBox(width: 6),
                const Text(
                  'Account recovery',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ],
            ),
            if (MediaQuery.viewInsetsOf(context).bottom == 0) ...[
              const Spacer(),
              const Text(
                'A secure way back in.',
                style: TextStyle(color: Color(0xFFFFD56A), fontFamily: 'serif', fontSize: 25),
              ),
              const SizedBox(height: 4),
              const Text('Your community account stays protected.', style: TextStyle(color: Color(0xFFE3E9E4), fontSize: 12)),
            ],
          ],
        ),
      ),
    ],
  );

  Widget _requestContent() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _heading(
        icon: Icons.mark_email_unread_rounded,
        title: 'Recover your account',
        message: 'Enter your account email to continue resetting your password.',
      ),
      const SizedBox(height: 26),
      _card(
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                _message(_error!, isError: true),
                const SizedBox(height: 16),
              ],
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.done,
                autocorrect: false,
                onFieldSubmitted: (_) => _requestReset(),
                decoration: _decoration(
                  'Email address',
                  Icons.mail_outline_rounded,
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
              const SizedBox(height: 20),
              _primaryButton(
                label: _submitting ? 'Continuing...' : 'Continue',
                loading: _submitting,
                onPressed: _submitting ? null : _requestReset,
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 18),
      _backToLogin(),
    ],
  );

  Widget _heading({
    required IconData icon,
    required String title,
    required String message,
    bool success = false,
  }) => Column(
    children: [
      ScaleTransition(
        scale: CurvedAnimation(
          parent: _entryController,
          curve: const Interval(0, .85, curve: Curves.elasticOut),
        ).drive(Tween<double>(begin: .55, end: 1)),
        child: Container(
          width: 76,
          height: 76,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: success
                  ? const [Color(0xFF39C89A), Color(0xFF159B75)]
                  : const [Color(0xFF0D5354), Color(0xFF082F36)],
            ),
            borderRadius: BorderRadius.circular(25),
            boxShadow: [
              BoxShadow(
                color: (success ? const Color(0xFF159B75) : const Color(0xFF0D5354))
                    .withValues(alpha: .22),
                blurRadius: 22,
                offset: const Offset(0, 9),
              ),
            ],
          ),
          child: Icon(icon, color: Colors.white, size: 35),
        ),
      ),
      const SizedBox(height: 20),
      Text(
        title,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Color(0xFF18363A),
          fontFamily: 'serif',
          fontSize: 23,
          fontWeight: FontWeight.w800,
          letterSpacing: -.3,
        ),
      ),
      const SizedBox(height: 9),
      Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Color(0xFF718489),
          fontSize: 14,
          height: 1.5,
        ),
      ),
    ],
  );

  Widget _card(Widget child) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: Color(0xFFFFFEFB),
      borderRadius: BorderRadius.circular(21),
      border: Border.all(color: Color(0xFFE0D9C8)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x14052D32),
          blurRadius: 20,
          offset: Offset(0, 7),
        ),
      ],
    ),
    child: child,
  );

  Widget _message(String message, {required bool isError}) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: isError ? const Color(0xFFFFF0F0) : const Color(0xFFEAF8F2),
      borderRadius: BorderRadius.circular(13),
      border: Border.all(
        color: isError ? const Color(0xFFFFD4D4) : const Color(0xFFC7EEDD),
      ),
    ),
    child: Text(
      message,
      style: TextStyle(
        color: isError ? const Color(0xFF9D2635) : const Color(0xFF188754),
        fontSize: 13,
      ),
    ),
  );

  Widget _primaryButton({
    required String label,
    required VoidCallback? onPressed,
    bool loading = false,
    IconData? icon,
  }) => SizedBox(
    height: 52,
    child: FilledButton.icon(
      onPressed: onPressed,
      icon: loading
          ? const SizedBox.square(
              dimension: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: const Color(0xFF17383B),
              ),
            )
          : Icon(icon ?? Icons.send_rounded, size: 18),
      label: Text(label),
      style: FilledButton.styleFrom(
        backgroundColor: const Color(0xFFDDB84E),
        foregroundColor: const Color(0xFF17383B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      ),
    ),
  );

  Widget _backToLogin() => TextButton.icon(
    onPressed: () => Navigator.of(context).pop(),
    icon: const Icon(Icons.arrow_back_rounded, size: 17),
    label: const Text('Back to sign in'),
    style: TextButton.styleFrom(foregroundColor: const Color(0xFF84682F)),
  );

  InputDecoration _decoration(String label, IconData icon) => InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon, color: Color(0xFF879895)),
    filled: true,
    fillColor: const Color(0xFFFFFEFB),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFE0D9C8)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFE0D9C8)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFF9A7835), width: 1.5),
    ),
  );
}
