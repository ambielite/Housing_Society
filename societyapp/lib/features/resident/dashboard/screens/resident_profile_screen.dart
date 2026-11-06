import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../data/resident_dashboard_api.dart';
import 'resident_change_password_screen.dart';

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

class _ResidentProfileScreenState extends State<ResidentProfileScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _entryController;

  @override
  void initState() {
    super.initState();
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1050),
    )..forward();
  }

  @override
  void dispose() {
    _entryController.dispose();
    super.dispose();
  }

  Widget _entry(Widget child, int index) {
    final start = index * .13;
    final end = (start + .58).clamp(0.0, 1.0).toDouble();
    final animation = CurvedAnimation(
      parent: _entryController,
      curve: Interval(start, end, curve: Curves.easeOutCubic),
    );
    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: animation.drive(
          Tween<Offset>(begin: const Offset(0, .16), end: Offset.zero),
        ),
        child: child,
      ),
    );
  }

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

  void _changePassword() {
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) =>
            ResidentChangePasswordScreen(accessToken: widget.user.accessToken),
      ),
    );
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
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 30),
          children: [
            _entry(_profileHero(photoUrl), 0),
            const SizedBox(height: 16),
            _entry(
              _section('Your contact', Icons.contact_mail_outlined, [
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
              1,
            ),
            const SizedBox(height: 14),
            _entry(
              _section('Society details', Icons.apartment_rounded, [
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
              2,
            ),
            const SizedBox(height: 14),
            _entry(
              _section('Resident details', Icons.home_work_outlined, [
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
                _infoTile(Icons.verified_user_outlined, 'Role', 'Resident'),
              ]),
              3,
            ),
            const SizedBox(height: 14),
            _entry(
              _section('Account details', Icons.manage_accounts_outlined, [
                _infoTile(
                  Icons.check_circle_outline_rounded,
                  'Account status',
                  _label(widget.user.status),
                ),
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
              ]),
              4,
            ),
            const SizedBox(height: 14),
            _entry(
              _section('Quick actions', Icons.bolt_rounded, [
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
              ]),
              5,
            ),
          ],
        ),
      ),
    );
  }

  Widget _profileHero(String? photoUrl) {
    final status = _label(widget.user.status);
    final fullName = widget.dashboard.residentName?.trim().isNotEmpty == true
        ? widget.dashboard.residentName!.trim()
        : widget.user.name;
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
          ScaleTransition(
            scale: CurvedAnimation(
              parent: _entryController,
              curve: const Interval(0, .72, curve: Curves.elasticOut),
            ).drive(Tween<double>(begin: .55, end: 1)),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x306255E8),
                    blurRadius: 16,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: 34,
                backgroundColor: const Color(0xFFE2DEFF),
                backgroundImage: photoUrl == null
                    ? null
                    : NetworkImage(photoUrl),
                onBackgroundImageError: photoUrl == null ? null : (_, _) {},
                child: photoUrl == null
                    ? Text(
                        _initials(fullName),
                        style: const TextStyle(
                          color: AppColors.indigo,
                          fontWeight: FontWeight.w800,
                          fontSize: 19,
                        ),
                      )
                    : null,
              ),
            ),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fullName,
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

  Widget _section(String title, IconData icon, List<Widget> children) =>
      Container(
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
              child: Row(
                children: [
                  Container(
                    width: 31,
                    height: 31,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEAF0FF), Color(0xFFF0EDFF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: AppColors.indigo, size: 17),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
            ...children,
          ],
        ),
      );

  Widget _infoTile(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
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
  }) => _ProfileActionTile(
    icon: icon,
    title: title,
    subtitle: subtitle,
    onTap: onTap,
    isDestructive: isDestructive,
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

class _ProfileActionTile extends StatefulWidget {
  const _ProfileActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.isDestructive,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final bool isDestructive;

  @override
  State<_ProfileActionTile> createState() => _ProfileActionTileState();
}

class _ProfileActionTileState extends State<_ProfileActionTile> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final accent = widget.isDestructive
        ? const Color(0xFFD84B58)
        : const Color(0xFF1C9B72);
    const hoverBackground = Color(0xFFEAF1FF);

    return MouseRegion(
      opaque: true,
      cursor: widget.onTap == null
          ? SystemMouseCursors.basic
          : SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        margin: const EdgeInsets.symmetric(vertical: 3),
        transform: Matrix4.translationValues(0, _hovered ? -1 : 0, 0),
        decoration: BoxDecoration(
          color: _hovered ? hoverBackground : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _hovered ? const Color(0xFF8FB2FF) : Colors.transparent,
          ),
          boxShadow: _hovered
              ? const [
                  BoxShadow(
                    color: Color(0x182C5FD5),
                    blurRadius: 12,
                    offset: Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            onTap: widget.onTap,
            borderRadius: BorderRadius.circular(14),
            hoverColor: hoverBackground,
            splashColor: accent.withValues(alpha: .10),
            highlightColor: accent.withValues(alpha: .06),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: widget.isDestructive
                          ? const Color(0xFFFFF0F1)
                          : const Color(0xFFEAF8F3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(widget.icon, color: accent, size: 18),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: const TextStyle(
                            color: AppColors.inkSoft,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.subtitle,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: _hovered ? accent : AppColors.muted,
                    size: 14,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
