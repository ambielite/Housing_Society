import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../../dashboard/data/resident_dashboard_api.dart';
import 'resident_change_password_screen.dart';
import 'resident_edit_profile_screen.dart';
import '../../widgets/resident_back_button.dart';

/// Resident profile – clean, document-style layout.
///
///  1. Identity header (photo, name, residence line, status, Edit profile)
///  2. Grouped detail sections: Personal, Residence, Society, Account
///  3. Account actions: Change password, Sign out
class ResidentProfileScreen extends StatefulWidget {
  const ResidentProfileScreen({
    super.key,
    required this.user,
    required this.dashboard,
    required this.header,
    this.onBack,
    this.changePasswordHeader,
    this.onProfileUpdated,
  });

  final AuthenticatedUser user;
  final ResidentDashboardData dashboard;
  final Widget header;
  final VoidCallback? onBack;
  final Widget? changePasswordHeader;
  final ValueChanged<AuthenticatedUser>? onProfileUpdated;

  @override
  State<ResidentProfileScreen> createState() => _ResidentProfileScreenState();
}

class _ResidentProfileScreenState extends State<ResidentProfileScreen> {
  static const _soft = Color(0xFF5B6479);
  static const _border = Color(0xFFE3E7EF);

  static const _tabs = ['Personal', 'Residence', 'Society', 'Account'];

  late AuthenticatedUser _user;
  late String _residentName;
  int _tab = 0;
  int _direction = 1;
  int? _hoverTab;

  @override
  void initState() {
    super.initState();
    _user = widget.user;
    _residentName = widget.dashboard.residentName?.trim().isNotEmpty == true
        ? widget.dashboard.residentName!.trim()
        : widget.user.name;
  }

  @override
  void didUpdateWidget(covariant ResidentProfileScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final updatedName = widget.dashboard.residentName?.trim();
    if (updatedName != null &&
        updatedName.isNotEmpty &&
        updatedName != _residentName) {
      _residentName = updatedName;
    }
  }

  String? get _photoUrl {
    final path = widget.dashboard.residentPhotoUrl ?? _user.profilePictureUrl;
    if (path == null || path.trim().isEmpty) return null;
    final parsed = Uri.tryParse(path);
    if (parsed == null) return null;
    if (parsed.hasScheme) return parsed.toString();
    const configuredBaseUrl = String.fromEnvironment('API_BASE_URL');
    final baseUrl = configuredBaseUrl.isNotEmpty
        ? configuredBaseUrl
        : kIsWeb
        ? 'http://localhost:5000/api/v1'
        : 'http://localhost:5000/api/v1';
    return Uri.parse(baseUrl)
        .resolve(path.startsWith('/') ? path : '/$path')
        .toString();
  }

  void _changePassword() {
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) =>
            ResidentChangePasswordScreen(
              accessToken: _user.accessToken,
              header: widget.changePasswordHeader,
            ),
      ),
    );
  }

  Future<void> _editProfile() async {
    final savedUser = await Navigator.of(context).push<AuthenticatedUser>(
      MaterialPageRoute<AuthenticatedUser>(
        builder: (_) => ResidentEditProfileScreen(user: _user),
      ),
    );
    if (savedUser == null || !mounted) return;
    setState(() {
      _user = savedUser;
      _residentName = savedUser.name;
    });
    widget.onProfileUpdated?.call(savedUser);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentMaterialBanner();
    messenger.showMaterialBanner(
      MaterialBanner(
        content: const Text('Profile updated successfully.'),
        leading: const Icon(Icons.check_circle_outline_rounded),
        backgroundColor: const Color(0xFFE8F5EC),
        contentTextStyle: const TextStyle(
          color: Color(0xFF1E5631),
          fontWeight: FontWeight.w600,
        ),
        actions: [
          TextButton(
            onPressed: messenger.hideCurrentMaterialBanner,
            child: const Text('OK'),
          ),
        ],
      ),
    );
    Future<void>.delayed(const Duration(seconds: 2), () {
      if (mounted) messenger.hideCurrentMaterialBanner();
    });
  }

  void _returnToLogin() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.dashboard;
    final tower = d.towerName == null ? 'Not assigned' : '${d.towerName}';
    final flat = d.unitNumber == null ? 'Not assigned' : '${d.unitNumber}';

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
              child: widget.header,
            ),
            if (widget.onBack != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 0, 20, 4),
                child: Row(
                  children: [
                    ResidentBackButton(onPressed: widget.onBack!),
                    const Text(
                      'Profile',
                      style: TextStyle(
                        color: AppColors.ink,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
                    children: [
                      _identityCard(tower, flat),
                      const SizedBox(height: 16),
                      _tabBar(),
                      const SizedBox(height: 14),
                      _animatedContent(_tabContent(d, tower, flat)),
                      const SizedBox(height: 16),
                      _actions(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Identity header
  // ---------------------------------------------------------------------------

  Widget _identityCard(String tower, String flat) {
    final d = widget.dashboard;
    final photoUrl = _photoUrl;
    final residence = [
      if (d.towerName != null) tower,
      if (d.unitNumber != null) 'Flat $flat',
    ].join(' · ');

    return _box(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 34,
                backgroundColor: const Color(0xFFE8EBF5),
                backgroundImage:
                    photoUrl == null ? null : NetworkImage(photoUrl),
                onBackgroundImageError: photoUrl == null ? null : (_, __) {},
                child: photoUrl == null
                    ? Text(
                        _initials(_residentName),
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _residentName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 20,
                        height: 1.2,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      residence.isEmpty ? 'Resident' : 'Resident · $residence',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _soft,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF1E9E6A),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _label(
                            widget.dashboard.residentProfile?.status ??
                                _user.status,
                          ),
                          style: const TextStyle(
                            color: AppColors.ink,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _editProfile,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                textStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              child: const Text('Edit profile'),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Detail sections
  // ---------------------------------------------------------------------------

  /// The colour used by the screen's buttons (Edit profile), read from the
  /// app theme so the selected tab always matches it.
  Color _buttonColor(BuildContext context) {
    final theme = Theme.of(context);
    return theme.filledButtonTheme.style?.backgroundColor?.resolve(
          const <WidgetState>{},
        ) ??
        theme.colorScheme.primary;
  }

  Widget _tabBar() {
    final buttonColor = _buttonColor(context);
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE9ECF3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final tabWidth = constraints.maxWidth / _tabs.length;
          return SizedBox(
            height: 40,
            child: Stack(
              children: [
                // Selected-tab highlight in the button colour; slides to the
                // tapped tab.
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 280),
                  curve: Curves.easeOutCubic,
                  left: _tab * tabWidth,
                  top: 0,
                  bottom: 0,
                  width: tabWidth,
                  child: Container(
                    decoration: BoxDecoration(
                      color: buttonColor,
                      borderRadius: BorderRadius.circular(9),
                    ),
                  ),
                ),
                Row(
                  children: List.generate(_tabs.length, (i) {
                    final selected = i == _tab;
                    final hovered = _hoverTab == i && !selected;
                    return Expanded(
                      child: MouseRegion(
                        cursor: SystemMouseCursors.click,
                        onEnter: (_) => setState(() => _hoverTab = i),
                        onExit: (_) {
                          if (_hoverTab == i) setState(() => _hoverTab = null);
                        },
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => setState(() {
                            _direction = i > _tab ? 1 : -1;
                            _tab = i;
                          }),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            curve: Curves.easeOut,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: hovered
                                  ? buttonColor.withValues(alpha: .10)
                                  : buttonColor.withValues(alpha: 0),
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 220),
                              curve: Curves.easeOut,
                              style: TextStyle(
                                color: selected
                                    ? Colors.white
                                    : hovered
                                    ? buttonColor
                                    : _soft,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              child: Text(_tabs[i]),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Smoothly swaps tab content: the old tab fades/slides out while the new
  /// one fades/slides in, and the height animates instead of jumping.
  Widget _animatedContent(Widget content) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOutCubic,
      alignment: Alignment.topCenter,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 320),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeIn,
        layoutBuilder: (current, previous) => Stack(
          alignment: Alignment.topCenter,
          clipBehavior: Clip.none,
          children: [
            for (final old in previous)
              Positioned(top: 0, left: 0, right: 0, child: old),
            if (current != null) current,
          ],
        ),
        transitionBuilder: (child, animation) {
          final incoming = child.key == ValueKey<int>(_tab);
          final dx = (incoming ? 1 : -1) * _direction * .05;
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: Offset(dx, 0),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            ),
          );
        },
        child: KeyedSubtree(key: ValueKey<int>(_tab), child: content),
      ),
    );
  }

  Widget _tabContent(ResidentDashboardData d, String tower, String flat) {
    final resident = d.residentProfile;
    switch (_tab) {
      case 1:
        return _details([
          ('Tower', tower),
          ('Flat', flat),
          ('Floor', _value(d.floorName)),
          ('Role', 'Resident'),
        ]);
      case 2:
        return _details([
          ('Name', _value(d.societyName)),
          ('Address', _value(d.societyAddress)),
          ('Email', _value(d.societyEmail)),
          ('Phone', _value(d.societyPhone)),
        ]);
      case 3:
        return _details([
          ('Status', _label(resident?.status ?? _user.status)),
          ('Member since', _date(_user.createdAt)),
          ('Last sign-in', _dateTime(_user.lastLoginAt)),
        ]);
      default:
        return _details([
          ('Full name', _residentName),
          ('Email', _value(resident?.email ?? _user.email)),
          ('Phone', _value(resident?.phone ?? _user.phone)),
          ('Alternate phone', _value(resident?.alternatePhone)),
          (
            'Date of birth',
            _date(DateTime.tryParse(resident?.dateOfBirth ?? '')),
          ),
          ('Resident type', _label(resident?.role)),
        ]);
    }
  }

  Widget _details(List<(String, String)> rows) {
    final children = <Widget>[];
    for (var i = 0; i < rows.length; i++) {
      if (i > 0) {
        children.add(const Divider(height: 1, thickness: 1, color: _border));
      }
      children.add(_row(rows[i].$1, rows[i].$2));
    }
    return _box(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(children: children),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 108,
            child: Text(
              label,
              style: const TextStyle(
                color: _soft,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: AppColors.ink,
                fontSize: 14,
                height: 1.35,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Widget _actions() {
    return _box(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          _actionRow('Change password', _changePassword, AppColors.indigo),
          const Divider(height: 1, thickness: 1, color: _border),
          _actionRow('Sign out', _returnToLogin, AppColors.indigo),
        ],
      ),
    );
  }

  Widget _actionRow(String label, VoidCallback onTap, Color color) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 14,
              color: _soft,
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Shared
  // ---------------------------------------------------------------------------

  Widget _box({required Widget child, required EdgeInsets padding}) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _border),
      ),
      child: child,
    );
  }

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
    final initials = parts.take(2).map((part) => part[0].toUpperCase()).join();
    return initials.isEmpty ? '?' : initials;
  }
}
