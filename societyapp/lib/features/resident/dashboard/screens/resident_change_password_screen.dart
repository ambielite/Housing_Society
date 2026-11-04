import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';

class ResidentChangePasswordScreen extends StatefulWidget {
  const ResidentChangePasswordScreen({super.key, required this.accessToken});

  final String accessToken;

  @override
  State<ResidentChangePasswordScreen> createState() =>
      _ResidentChangePasswordScreenState();
}

class _ResidentChangePasswordScreenState
    extends State<ResidentChangePasswordScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _entryController;
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _currentObscured = true;
  bool _newObscured = true;
  bool _confirmObscured = true;
  bool _submitting = false;
  bool _passwordChanged = false;

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
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _entryController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await AuthApi.changePassword(
        accessToken: widget.accessToken,
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );
      if (mounted) {
        _entryController.forward(from: 0);
        setState(() => _passwordChanged = true);
      }
    } on AuthException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _goToLogin() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text('Change password'),
        backgroundColor: AppColors.canvas,
        foregroundColor: AppColors.ink,
        elevation: 0,
      ),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 32),
              children: [
                FadeTransition(
                  opacity: CurvedAnimation(
                    parent: _entryController,
                    curve: const Interval(0, 1, curve: Curves.easeOut),
                  ),
                  child: SlideTransition(
                    position:
                        CurvedAnimation(
                          parent: _entryController,
                          curve: const Interval(
                            .08,
                            1,
                            curve: Curves.easeOutCubic,
                          ),
                        ).drive(
                          Tween<Offset>(
                            begin: const Offset(0, .14),
                            end: Offset.zero,
                          ),
                        ),
                    child: _passwordChanged
                        ? _successContent()
                        : _passwordForm(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _passwordForm() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _header(
        icon: Icons.lock_reset_rounded,
        title: 'Update your password',
        description:
            'Choose a new password to keep your resident account secure.',
      ),
      const SizedBox(height: 24),
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE4E9F2)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x080F1A35),
              blurRadius: 18,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _passwordField(
                controller: _currentPasswordController,
                label: 'Current password',
                obscured: _currentObscured,
                onToggle: () =>
                    setState(() => _currentObscured = !_currentObscured),
                validator: (value) => value == null || value.isEmpty
                    ? 'Enter your current password'
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
              const SizedBox(height: 22),
              SizedBox(
                height: 52,
                child: FilledButton.icon(
                  onPressed: _submitting ? null : _submit,
                  icon: _submitting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.check_rounded),
                  label: Text(_submitting ? 'Updating…' : 'Update password'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.indigo,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 14),
      const Text(
        'Your current password is required to confirm this change.',
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.muted, fontSize: 12),
      ),
    ],
  );

  Widget _successContent() => Column(
    children: [
      _header(
        icon: Icons.check_circle_outline_rounded,
        title: 'Password updated',
        description: 'Your password has been changed. Sign in again with your new password.',
      ),
      const SizedBox(height: 28),
      SizedBox(
        width: double.infinity,
        height: 52,
        child: FilledButton(
          onPressed: _goToLogin,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.indigo,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: const Text('Continue to sign in'),
        ),
      ),
    ],
  );

  Widget _header({
    required IconData icon,
    required String title,
    required String description,
  }) => Column(
    children: [
      ScaleTransition(
        scale: CurvedAnimation(
          parent: _entryController,
          curve: const Interval(0, .82, curve: Curves.elasticOut),
        ).drive(Tween<double>(begin: .55, end: 1)),
        child: Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFE8EFFF), Color(0xFFECE8FF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x266255E8),
                blurRadius: 20,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(
                Icons.shield_rounded,
                color: AppColors.indigo.withValues(alpha: .16),
                size: 58,
              ),
              Icon(icon, color: AppColors.indigo, size: 27),
              Positioned(
                top: 10,
                right: 10,
                child: Icon(
                  Icons.auto_awesome_rounded,
                  color: AppColors.violet,
                  size: 13,
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 18),
      Text(
        title,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: AppColors.ink,
          fontSize: 22,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(height: 8),
      Text(
        description,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: AppColors.inkSoft,
          fontSize: 14,
          height: 1.45,
        ),
      ),
    ],
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
}
