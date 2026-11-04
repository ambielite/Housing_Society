import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../data/resident_dashboard_api.dart';

class ResidentProfileScreen extends StatefulWidget {
  const ResidentProfileScreen({
    super.key,
    required this.user,
    required this.dashboard,
  });

  final AuthenticatedUser user;
  final ResidentDashboardData dashboard;

  @override
  State<ResidentProfileScreen> createState() => _ResidentProfileScreenState();
}

class _ResidentProfileScreenState extends State<ResidentProfileScreen> {
  bool _working = false;

  String? get _photoUrl {
    final path =
        widget.dashboard.residentPhotoUrl ?? widget.user.profilePictureUrl;
    if (path == null || path.trim().isEmpty) return null;
    final parsed = Uri.tryParse(path);
    if (parsed == null) return null;
    if (parsed.hasScheme) return parsed.toString();
    const configuredBaseUrl = String.fromEnvironment('API_BASE_URL');
    final baseUrl = configuredBaseUrl.isNotEmpty
        ? configuredBaseUrl
        : kIsWeb
        ? 'http://localhost:5000/api/v1'
        : 'http://10.0.2.2:5000/api/v1';
    return Uri.parse(baseUrl)
        .resolve(path.startsWith('/') ? path : '/$path')
        .toString();
  }

  Future<void> _changePassword() async {
    final values = await showDialog<(String, String)>(
      context: context,
      builder: (_) => const _PasswordChangeDialog(),
    );
    if (values == null || !mounted) return;

    setState(() => _working = true);
    try {
      await AuthApi.changePassword(
        accessToken: widget.user.accessToken,
        currentPassword: values.$1,
        newPassword: values.$2,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password changed. Please sign in again.'),
        ),
      );
      _returnToLogin();
    } on AuthException catch (error) {
      if (mounted) _showMessage(error.message);
    } finally {
      if (mounted) setState(() => _working = false);
    }
  }

  Future<void> _signOutAll() async {
    setState(() => _working = true);
    try {
      await AuthApi.signOutAll(widget.user.accessToken);
      if (!mounted) return;
      _returnToLogin();
    } on AuthException catch (error) {
      if (mounted) _showMessage(error.message);
    } finally {
      if (mounted) setState(() => _working = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  void _returnToLogin() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = widget.dashboard;
    final photoUrl = _photoUrl;
    final roleLabels = widget.user.roles
        .map(
          (role) => role
              .split('_')
              .where((part) => part.isNotEmpty)
              .map((part) => '${part[0]}${part.substring(1).toLowerCase()}')
              .join(' '),
        )
        .join(', ');
    final unitLabel = [
      if (dashboard.towerName != null) dashboard.towerName,
      if (dashboard.unitNumber != null) 'Flat ${dashboard.unitNumber}',
    ].join(' · ');

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: AppColors.canvas,
        foregroundColor: AppColors.ink,
        elevation: 0,
      ),
      body: SafeArea(
        top: false,
        child: Stack(
          children: [
            ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 30),
              children: [
                _profileHero(photoUrl),
                const SizedBox(height: 16),
                _section('Your contact', [
                  _infoTile(
                    Icons.mail_outline_rounded,
                    'Email',
                    widget.user.email,
                  ),
                  _infoTile(
                    Icons.phone_outlined,
                    'Phone',
                    _value(widget.user.phone),
                  ),
                ]),
                const SizedBox(height: 14),
                _section('Society details', [
                  _infoTile(
                    Icons.apartment_rounded,
                    'Your society',
                    _value(dashboard.societyName),
                  ),
                  _infoTile(
                    Icons.location_on_outlined,
                    'Address',
                    _value(dashboard.societyAddress),
                  ),
                  _infoTile(
                    Icons.mail_outline_rounded,
                    'Society email',
                    _value(dashboard.societyEmail),
                  ),
                  _infoTile(
                    Icons.phone_outlined,
                    'Society phone',
                    _value(dashboard.societyPhone),
                  ),
                ]),
                const SizedBox(height: 14),
                _section('Resident details', [
                  _infoTile(
                    Icons.home_outlined,
                    'Home',
                    unitLabel.isEmpty ? 'Not assigned' : unitLabel,
                  ),
                  _infoTile(
                    Icons.layers_outlined,
                    'Floor',
                    _value(dashboard.floorName),
                  ),
                  _infoTile(
                    Icons.verified_user_outlined,
                    'Role',
                    roleLabels.isEmpty ? 'Resident' : roleLabels,
                  ),
                  _infoTile(
                    Icons.check_circle_outline_rounded,
                    'Account status',
                    _label(widget.user.status),
                  ),
                ]),
                const SizedBox(height: 14),
                _section('Account details', [
                  _infoTile(
                    Icons.event_outlined,
                    'Account created',
                    _date(widget.user.createdAt),
                  ),
                  _infoTile(
                    Icons.login_rounded,
                    'Last sign-in',
                    _dateTime(widget.user.lastLoginAt),
                  ),
                  _infoTile(
                    Icons.currency_rupee_rounded,
                    'Society currency',
                    dashboard.currency,
                  ),
                ]),
                const SizedBox(height: 14),
                _section('Quick actions', [
                  _actionTile(
                    Icons.key_outlined,
                    'Change password',
                    'Update your account password',
                    onTap: _changePassword,
                  ),
                  _actionTile(
                    Icons.logout_rounded,
                    'Sign out',
                    'Sign out of this device',
                    onTap: _returnToLogin,
                    isDestructive: true,
                  ),
                  _actionTile(
                    Icons.devices_outlined,
                    'Sign out on all devices',
                    'End all active sessions for this account',
                    onTap: _signOutAll,
                    isDestructive: true,
                  ),
                ]),
              ],
            ),
            if (_working)
              Positioned.fill(
                child: ColoredBox(
                  color: Colors.black.withValues(alpha: .12),
                  child: const Center(
                    child: CircularProgressIndicator(color: AppColors.indigo),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _profileHero(String? photoUrl) {
    final status = _label(widget.user.status);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE9EFFF), Color(0xFFF3F2FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F5)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 34,
            backgroundColor: const Color(0xFFE2DEFF),
            backgroundImage: photoUrl == null ? null : NetworkImage(photoUrl),
            onBackgroundImageError: photoUrl == null ? null : (_, _) {},
            child: photoUrl == null
                ? Text(
                    _initials(widget.user.name),
                    style: const TextStyle(
                      color: AppColors.indigo,
                      fontWeight: FontWeight.w800,
                      fontSize: 19,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.user.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  widget.dashboard.societyName ?? 'Housing Society resident',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.inkSoft,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 9),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5F8EF),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: const TextStyle(
                      color: Color(0xFF188754),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) => Container(
    padding: const EdgeInsets.fromLTRB(15, 15, 15, 7),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: const Color(0xFFE8ECF3)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x060F1A35),
          blurRadius: 12,
          offset: Offset(0, 4),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(2, 0, 2, 8),
          child: Text(
            title,
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        ...children,
      ],
    ),
  );

  Widget _infoTile(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: const Color(0xFFF0F2FF),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, color: AppColors.indigo, size: 17),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                value,
                style: const TextStyle(
                  color: AppColors.inkSoft,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _actionTile(
    IconData icon,
    String title,
    String subtitle, {
    required VoidCallback onTap,
    bool isDestructive = false,
  }) => InkWell(
    onTap: _working ? null : onTap,
    borderRadius: BorderRadius.circular(14),
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isDestructive
                  ? const Color(0xFFFFF0F1)
                  : const Color(0xFFEAF8F3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: isDestructive
                  ? const Color(0xFFD84B58)
                  : const Color(0xFF1C9B72),
              size: 18,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.inkSoft,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(color: AppColors.muted, fontSize: 10),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.arrow_forward_ios_rounded,
            color: AppColors.muted,
            size: 14,
          ),
        ],
      ),
    ),
  );

  String _value(String? value) =>
      value == null || value.trim().isEmpty ? 'Not provided' : value.trim();

  String _label(String? value) {
    if (value == null || value.trim().isEmpty) return 'Unknown';
    return value
        .split('_')
        .map(
          (part) => part.isEmpty
              ? part
              : '${part[0]}${part.substring(1).toLowerCase()}',
        )
        .join(' ');
  }

  String _date(DateTime? value) => value == null
      ? 'Not available'
      : '${value.day.toString().padLeft(2, '0')}/${value.month.toString().padLeft(2, '0')}/${value.year}';

  String _dateTime(DateTime? value) {
    if (value == null) return 'No previous sign-in';
    final local = value.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = local.hour < 12 ? 'AM' : 'PM';
    return '${_date(local)} · $hour:$minute $period';
  }

  String _initials(String value) {
    final parts = value
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty);
    return parts.take(2).map((part) => part[0].toUpperCase()).join();
  }
}

class _PasswordChangeDialog extends StatefulWidget {
  const _PasswordChangeDialog();

  @override
  State<_PasswordChangeDialog> createState() => _PasswordChangeDialogState();
}

class _PasswordChangeDialogState extends State<_PasswordChangeDialog> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Change password'),
    content: Form(
      key: _formKey,
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _currentController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Current password'),
              validator: (value) => value == null || value.isEmpty
                  ? 'Enter your current password'
                  : null,
            ),
            TextFormField(
              controller: _newController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New password'),
              validator: (value) => value == null || value.length < 8
                  ? 'Use at least 8 characters'
                  : null,
            ),
            TextFormField(
              controller: _confirmController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Confirm new password',
              ),
              validator: (value) => value != _newController.text
                  ? 'Passwords do not match'
                  : null,
            ),
          ],
        ),
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () {
          if (!_formKey.currentState!.validate()) return;
          Navigator.of(context)
              .pop((_currentController.text, _newController.text));
        },
        child: const Text('Update password'),
      ),
    ],
  );
}
