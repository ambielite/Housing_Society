import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../data/auth_api.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({
    super.key,
    required this.email,
  });

  final String email;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _tokenController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  late final AnimationController _entryController;
  bool _newObscured = true;
  bool _confirmObscured = true;
  bool _submitting = false;
  bool _success = false;
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
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _tokenController.dispose();
    _entryController.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await AuthApi.resetPassword(
        token: _tokenController.text.trim(),
        newPassword: _newPasswordController.text,
      );
      if (mounted) {
        _entryController.forward(from: 0);
        setState(() => _success = true);
      }
    } on AuthException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _returnToLogin() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
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
        title: const Text('Reset password'),
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
                    child: _success ? _successContent() : _formContent(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _formContent() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _heading(
        icon: Icons.lock_reset_rounded,
        title: 'Choose a new password',
        subtitle: 'Create a strong password you haven’t used before.',
      ),
      const SizedBox(height: 26),
      _card(
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                _errorMessage(_error!),
                const SizedBox(height: 16),
              ],
              TextFormField(
                controller: _tokenController,
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.next,
                autocorrect: false,
                enableSuggestions: false,
                decoration: const InputDecoration(
                  labelText: 'Reset token',
                  prefixIcon: Icon(Icons.mark_email_read_outlined),
                ),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter the reset token from your email'
                    : null,
              ),
              const SizedBox(height: 16),
              _passwordField(
                controller: _newPasswordController,
                label: 'New password',
                obscured: _newObscured,
                onToggle: () => setState(() => _newObscured = !_newObscured),
                validator: (value) => value == null || value.length < 8
                    ? 'Use at least 8 characters'
                    : value.length > 128
                    ? 'Use 128 characters or fewer'
                    : null,
              ),
              const SizedBox(height: 16),
              _passwordField(
                controller: _confirmPasswordController,
                label: 'Confirm new password',
                obscured: _confirmObscured,
                onToggle: () =>
                    setState(() => _confirmObscured = !_confirmObscured),
                validator: (value) => value != _newPasswordController.text
                    ? 'Passwords do not match'
                    : null,
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _passwordRule(
                    icon: Icons.numbers_rounded,
                    label: '8–128 characters',
                    complete:
                        _newPasswordController.text.length >= 8 &&
                        _newPasswordController.text.length <= 128,
                  ),
                  _passwordRule(
                    icon: Icons.link_rounded,
                    label: 'Passwords match',
                    complete:
                        _confirmPasswordController.text.isNotEmpty &&
                        _confirmPasswordController.text ==
                            _newPasswordController.text,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _button(
                label: _submitting ? 'Updating…' : 'Update password',
                icon: Icons.check_rounded,
                loading: _submitting,
                onPressed: _submitting ? null : _resetPassword,
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 16),
      Text(
        'Enter the reset token sent to ${widget.email}. It expires in 30 minutes and can only be used once.',
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.muted, fontSize: 12),
      ),
    ],
  );

  Widget _successContent() => Column(
    children: [
      _heading(
        icon: Icons.verified_rounded,
        title: 'Password reset complete',
        subtitle: 'Sign in with your new password to continue.',
        success: true,
      ),
      const SizedBox(height: 28),
      _button(
        label: 'Back to sign in',
        icon: Icons.arrow_forward_rounded,
        onPressed: _returnToLogin,
      ),
    ],
  );

  Widget _heading({
    required IconData icon,
    required String title,
    required String subtitle,
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
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(
                Icons.shield_rounded,
                color: Colors.white.withValues(alpha: .22),
                size: 57,
              ),
              Icon(icon, color: Colors.white, size: 27),
              Positioned(
                top: 10,
                right: 11,
                child: Icon(
                  Icons.auto_awesome_rounded,
                  color: Colors.white.withValues(alpha: .9),
                  size: 12,
                ),
              ),
            ],
          ),
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
        subtitle,
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

  Widget _errorMessage(String message) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF0F0),
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: const Color(0xFFFFD4D4)),
    ),
    child: Text(
      message,
      style: const TextStyle(color: Color(0xFF9D2635), fontSize: 13),
    ),
  );

  Widget _passwordRule({
    required IconData icon,
    required String label,
    required bool complete,
  }) {
    final color = complete ? const Color(0xFF168B68) : AppColors.muted;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: complete ? const Color(0xFFEAF8F2) : const Color(0xFFF4F6FA),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: complete ? const Color(0xFFC8ECDC) : const Color(0xFFE5EAF2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            complete ? Icons.check_circle_rounded : icon,
            size: 15,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: complete ? const Color(0xFF168B68) : AppColors.inkSoft,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _button({
    required String label,
    required IconData icon,
    required VoidCallback? onPressed,
    bool loading = false,
  }) => SizedBox(
    width: double.infinity,
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
          : Icon(icon, size: 18),
      label: Text(label),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.indigo,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      ),
    ),
  );

  Widget _passwordField({
    required TextEditingController controller,
    required String label,
    required bool obscured,
    required VoidCallback onToggle,
    required String? Function(String?) validator,
  }) => TextFormField(
    controller: controller,
    obscureText: obscured,
    autocorrect: false,
    enableSuggestions: false,
    textInputAction: TextInputAction.next,
    onChanged: (_) => setState(() {}),
    decoration: InputDecoration(
      labelText: label,
      prefixIcon: const Icon(Icons.lock_outline_rounded),
      suffixIcon: IconButton(
        onPressed: onToggle,
        tooltip: obscured ? 'Show password' : 'Hide password',
        icon: Icon(
          obscured ? Icons.visibility_outlined : Icons.visibility_off_outlined,
        ),
      ),
    ),
    validator: validator,
  );
}
