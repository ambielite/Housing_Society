import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
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
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text('Forgot password'),
        backgroundColor: AppColors.canvas,
        foregroundColor: AppColors.ink,
        elevation: 0,
      ),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(22, 30, 22, 32),
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
    );
  }

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
                  : const [Color(0xFF8174FF), Color(0xFF5948DC)],
            ),
            borderRadius: BorderRadius.circular(25),
            boxShadow: [
              BoxShadow(
                color: (success ? const Color(0xFF159B75) : AppColors.indigo)
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
          color: AppColors.ink,
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
          color: AppColors.inkSoft,
          fontSize: 14,
          height: 1.5,
        ),
      ),
    ],
  );

  Widget _card(Widget child) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(21),
      border: Border.all(color: const Color(0xFFE3E9F3)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0C101A35),
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
                color: Colors.white,
              ),
            )
          : Icon(icon ?? Icons.send_rounded, size: 18),
      label: Text(label),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.indigo,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      ),
    ),
  );

  Widget _backToLogin() => TextButton.icon(
    onPressed: () => Navigator.of(context).pop(),
    icon: const Icon(Icons.arrow_back_rounded, size: 17),
    label: const Text('Back to sign in'),
    style: TextButton.styleFrom(foregroundColor: AppColors.indigo),
  );

  InputDecoration _decoration(String label, IconData icon) => InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon, color: AppColors.muted),
    filled: true,
    fillColor: const Color(0xFFFCFCFF),
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
  );
}
