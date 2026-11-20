import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:housing_society_app/app/theme/app_colors.dart';

import '../../../auth/data/auth_api.dart';

/// Security staff profile – plain, professional layout.
///
///  1. Flat identity header (photo, name, role)
///  2. Key-facts strip: employee code · gates · status
///  3. Segmented tabs: Profile · Shifts · Account
///     - Profile: form-style fields (label above value)
///     - Shifts : one card per assigned shift
///     - Account: account activity
///  4. Sign out button
class SecurityProfileScreen extends StatefulWidget {
  const SecurityProfileScreen({
    required this.user,
    this.guardProfile,
    required this.gateNames,
    required this.loadShiftAssignments,
    this.initialShiftAssignments,
    this.profilePhotoUrl,
    required this.onSignOut,
  });

  final AuthenticatedUser user;
  final Map<String, dynamic>? guardProfile;
  final List<String> gateNames;
  final Future<List<SecurityShiftAssignment>> Function() loadShiftAssignments;
  final List<SecurityShiftAssignment>? initialShiftAssignments;
  final String? profilePhotoUrl;
  final VoidCallback onSignOut;

  @override
  State<SecurityProfileScreen> createState() => _SecurityProfileScreenState();
}

class SecurityShiftAssignment {
  const SecurityShiftAssignment({
    required this.rosterId,
    required this.shiftName,
    required this.shiftType,
    this.scheduleType = 'DAILY',
    required this.startTime,
    required this.endTime,
    required this.breakMinutes,
    required this.rosterDate,
    required this.status,
    this.isOvernight = false,
    this.cancellationReason,
    this.cancelledAt,
    this.cancelledBy,
    this.cancelledByName,
    this.remarks,
  });

  final String rosterId;
  final String shiftName;
  final String shiftType;
  final String scheduleType;
  final String startTime;
  final String endTime;
  final int breakMinutes;
  final DateTime? rosterDate;
  final String status;
  final bool isOvernight;
  final String? cancellationReason;
  final DateTime? cancelledAt;
  final String? cancelledBy;
  final String? cancelledByName;
  final String? remarks;

  SecurityShiftAssignment copyWith({
    String? status,
    String? cancellationReason,
    DateTime? cancelledAt,
    String? cancelledBy,
    String? cancelledByName,
  }) => SecurityShiftAssignment(
    rosterId: rosterId,
    shiftName: shiftName,
    shiftType: shiftType,
    scheduleType: scheduleType,
    startTime: startTime,
    endTime: endTime,
    breakMinutes: breakMinutes,
    rosterDate: rosterDate,
    status: status ?? this.status,
    isOvernight: isOvernight,
    cancellationReason: cancellationReason ?? this.cancellationReason,
    cancelledAt: cancelledAt ?? this.cancelledAt,
    cancelledBy: cancelledBy ?? this.cancelledBy,
    cancelledByName: cancelledByName ?? this.cancelledByName,
    remarks: remarks,
  );
}

class _SecurityProfileScreenState extends State<SecurityProfileScreen> {
  static const _tabs = ['Profile', 'Shifts', 'Account'];
  static const _soft = Color(0xFF5B6479);
  static const _border = Color(0xFFE3E7EF);

  List<SecurityShiftAssignment> _shiftAssignments = const [];
  bool _loadingShiftAssignments = true;
  bool _shiftAssignmentsFailed = false;
  int _tab = 0;
  int _direction = 1;
  int? _hoverTab;

  @override
  void initState() {
    super.initState();
    final initialAssignments = widget.initialShiftAssignments;
    if (initialAssignments != null) {
      _shiftAssignments = initialAssignments;
      _loadingShiftAssignments = false;
    } else {
      _loadShiftAssignments();
    }
  }

  @override
  void didUpdateWidget(covariant SecurityProfileScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.initialShiftAssignments, widget.initialShiftAssignments) &&
        widget.initialShiftAssignments != null) {
      _shiftAssignments = widget.initialShiftAssignments!;
      _loadingShiftAssignments = false;
      _shiftAssignmentsFailed = false;
    }
  }

  Future<void> _loadShiftAssignments() async {
    setState(() {
      _loadingShiftAssignments = true;
      _shiftAssignmentsFailed = false;
    });
    try {
      final assignments = await widget.loadShiftAssignments();
      if (!mounted) return;
      setState(() {
        _shiftAssignments = assignments;
        _loadingShiftAssignments = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _shiftAssignmentsFailed = true;
        _loadingShiftAssignments = false;
      });
    }
  }

  String? get _photoUrl {
    final path = (widget.guardProfile?['photo_path']?.toString() ??
            widget.profilePhotoUrl ??
            widget.user.profilePictureUrl)
        ?.trim();
    if (path == null || path.isEmpty) return null;
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

  String _value(String? value) =>
      value == null || value.trim().isEmpty ? 'Not provided' : value.trim();

  String _staffValue(String key, String? fallback) =>
      _value(widget.guardProfile?[key]?.toString() ?? fallback);

  String get _profileName {
    final first = widget.guardProfile?['first_name']?.toString().trim() ?? '';
    final last = widget.guardProfile?['last_name']?.toString().trim() ?? '';
    final name = '$first $last'.trim();
    return name.isEmpty ? widget.user.name : name;
  }

  String _date(DateTime? value) {
    if (value == null) return 'Not available';
    final local = value.toLocal();
    return '${local.day.toString().padLeft(2, '0')}/'
        '${local.month.toString().padLeft(2, '0')}/${local.year}';
  }

  String _dateTime(DateTime? value) {
    if (value == null) return 'No previous sign-in';
    final local = value.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    return '${_date(local)} · $hour:$minute ${local.hour < 12 ? 'AM' : 'PM'}';
  }

  String _profileTime(String value) {
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(value.trim());
    if (match == null) return _value(value);
    final hour24 = int.tryParse(match.group(1)!) ?? 0;
    final hour = hour24 % 12 == 0 ? 12 : hour24 % 12;
    return '$hour:${match.group(2)} ${hour24 < 12 ? 'AM' : 'PM'}';
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
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
        // The parent dashboard already reserves the system navigation area.
        // Avoid adding a second bottom inset here, which leaves a blank strip
        // above the app's bottom tab bar on Android.
        bottom: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                _header(),
                const SizedBox(height: 18),
                _factsStrip(),
                const SizedBox(height: 18),
                _segmentedTabs(),
                const SizedBox(height: 14),
                _animatedContent(_tabContent()),
                const SizedBox(height: 22),
                _signOutButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Header and key facts
  // ---------------------------------------------------------------------------

  Widget _header() {
    final user = widget.user;
    final photoUrl = _photoUrl;
    final initials = Text(
      _profileInitials(_profileName),
      style: const TextStyle(
        color: AppColors.ink,
        fontSize: 20,
        fontWeight: FontWeight.w700,
      ),
    );

    return Row(
      children: [
        CircleAvatar(
          radius: 34,
          backgroundColor: const Color(0xFFE8EBF5),
          child: photoUrl == null
              ? initials
              : ClipOval(
                  child: Image.network(
                    photoUrl,
                    width: 68,
                    height: 68,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Center(child: initials),
                  ),
                ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _profileName,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 22,
                  height: 1.2,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Security Head',
                style: TextStyle(
                  color: _soft,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String get _status => _profileHumanize(
    (widget.guardProfile?['status']?.toString() ??
            widget.user.status ??
            'ACTIVE')
        .toUpperCase(),
  );

  Widget _factsStrip() {
    final gateCount = widget.gateNames.length;
    final gateText = gateCount == 0
        ? 'None'
        : gateCount == 1
        ? '1 gate'
        : '$gateCount gates';

    return _box(
      padding: EdgeInsets.zero,
      child: IntrinsicHeight(
        child: Row(
          children: [
            _factCell(
              'Employee code',
              _staffValue('employee_code', widget.user.employeeCode),
            ),
            const VerticalDivider(width: 1, thickness: 1, color: _border),
            _factCell('Assigned', gateText),
            const VerticalDivider(width: 1, thickness: 1, color: _border),
            _factCell('Status', _status),
          ],
        ),
      ),
    );
  }

  Widget _factCell(String label, String value) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: _soft,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.ink,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  Widget _segmentedTabs() {
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
                // Selected-tab highlight: same colour as the Sign out button,
                // slides smoothly to whichever tab is selected.
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 280),
                  curve: Curves.easeOutCubic,
                  left: _tab * tabWidth,
                  top: 0,
                  bottom: 0,
                  width: tabWidth,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.navy,
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
                                  ? AppColors.navy.withValues(alpha: .08)
                                  : AppColors.navy.withValues(alpha: 0),
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 220),
                              curve: Curves.easeOut,
                              style: TextStyle(
                                color: selected
                                    ? Colors.white
                                    : hovered
                                    ? AppColors.navy
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

  Widget _tabContent() {
    switch (_tab) {
      case 1:
        return _shiftsTab();
      case 2:
        return _accountTab();
      default:
        return _profileTab();
    }
  }

  // ---------------------------------------------------------------------------
  // Profile tab
  // ---------------------------------------------------------------------------

  Widget _profileTab() {
    final user = widget.user;
    final gates = widget.gateNames.isEmpty
        ? 'No gates assigned'
        : widget.gateNames.join(', ');

    return Column(
      children: [
        _group('Contact', [
          ('Email', _staffValue('email', user.email)),
          ('Phone', _staffValue('mobile_number', user.phone)),
        ]),
        const SizedBox(height: 14),
        _group('Assignment', [
          ('Role', 'Security Head'),
          ('Employee code', _staffValue('employee_code', user.employeeCode)),
          ('Assigned gates', gates),
        ]),
        const SizedBox(height: 14),
        _group('Staff details', [
          ('Date of birth', _staffValue('date_of_birth', null)),
          ('Joining date', _staffValue('joining_date', null)),
          ('Designation', _staffValue('designation', null)),
          ('Department', _staffValue('department', null)),
          ('Emergency contact', _staffValue('emergency_contact_name', null)),
          (
            'Emergency contact number',
            _staffValue('emergency_contact_number', null),
          ),
          ('Address', _staffValue('address', null)),
          ('Notes', _staffValue('remarks', null)),
        ]),
      ],
    );
  }

  Widget _accountTab() {
    final user = widget.user;
    return _group('Account activity', [
      ('Account status', _status),
      ('Account created', _date(user.createdAt)),
      ('Last sign-in', _dateTime(user.lastLoginAt)),
    ]);
  }

  /// Form-style group: small heading, then label-above-value fields.
  Widget _group(String title, List<(String, String)> fields) {
    final children = <Widget>[
      Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 4),
        child: Text(
          title,
          style: const TextStyle(
            color: AppColors.ink,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    ];
    for (var i = 0; i < fields.length; i++) {
      children.add(const Divider(height: 1, thickness: 1, color: _border));
      children.add(_field(fields[i].$1, fields[i].$2));
    }
    return _box(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _field(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: _soft,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          SelectableText(
            value,
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 15,
              height: 1.3,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Shifts tab
  // ---------------------------------------------------------------------------

  Widget _shiftsTab() {
    if (_loadingShiftAssignments) {
      return _box(
        padding: const EdgeInsets.all(20),
        child: const Row(
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 14),
            Text(
              'Loading shift details',
              style: TextStyle(color: _soft, fontSize: 14),
            ),
          ],
        ),
      );
    }
    if (_shiftAssignmentsFailed) {
      return _box(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Could not load shift details',
              style: TextStyle(
                color: AppColors.ink,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _loadShiftAssignments,
              child: const Text('Try again'),
            ),
          ],
        ),
      );
    }
    if (_shiftAssignments.isEmpty) {
      return _box(
        padding: const EdgeInsets.all(20),
        child: const Text(
          'No upcoming shifts are currently assigned.',
          style: TextStyle(color: _soft, fontSize: 14, height: 1.4),
        ),
      );
    }
    return Column(
      children: [
        for (var i = 0; i < _shiftAssignments.length; i++) ...[
          if (i > 0) const SizedBox(height: 12),
          _shiftCard(_shiftAssignments[i]),
        ],
      ],
    );
  }

  Widget _shiftCard(SecurityShiftAssignment a) {
    final date = a.rosterDate;
    final dateText = date == null ? 'Date unavailable' : _date(date);
    final breakText = a.breakMinutes <= 0
        ? 'No break'
        : a.breakMinutes % 60 == 0
        ? '${a.breakMinutes ~/ 60} hr break'
        : a.breakMinutes >= 60
        ? '${a.breakMinutes ~/ 60} hr ${a.breakMinutes % 60} min break'
        : '${a.breakMinutes} min break';
    final shiftLabel = [
      if (a.shiftName.isNotEmpty) a.shiftName,
      if (a.shiftType.isNotEmpty) _profileHumanize(a.shiftType),
      if (a.isOvernight) 'Overnight',
    ].join(' · ');

    return _box(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  dateText,
                  style: const TextStyle(
                    color: _soft,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              _statusBadge(_profileHumanize(a.status)),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '${_profileTime(a.startTime)} – ${_profileTime(a.endTime)}',
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (shiftLabel.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              shiftLabel,
              style: const TextStyle(
                color: AppColors.ink,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
          const SizedBox(height: 4),
          Text(breakText, style: const TextStyle(color: _soft, fontSize: 13)),
          if (a.status.toUpperCase() == 'CANCELLED')
            _note(
              'Cancelled by',
              a.cancelledBy == widget.user.userId
                  ? 'You'
                  : (a.cancelledByName ?? 'Administrator'),
            ),
          if (a.cancellationReason != null &&
              a.cancellationReason!.trim().isNotEmpty)
            _note('Cancellation reason', a.cancellationReason!.trim()),
          if (a.cancelledAt != null)
            _note('Cancelled at', _dateTime(a.cancelledAt)),
          if (a.remarks != null && a.remarks!.trim().isNotEmpty)
            _note('Notes', a.remarks!.trim()),
        ],
      ),
    );
  }

  Widget _note(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(height: 1, thickness: 1, color: _border),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              color: _soft,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 13,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    final key = status.toUpperCase();
    Color background = const Color(0xFFEEF1F7);
    Color foreground = AppColors.ink;
    if (key.contains('CANCEL')) {
      background = const Color(0xFFFFE9EB);
      foreground = const Color(0xFFB4232F);
    } else if (key.contains('COMPLET') || key == 'ACTIVE') {
      background = const Color(0xFFE3F5EC);
      foreground = const Color(0xFF136B42);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: foreground,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Shared
  // ---------------------------------------------------------------------------

  Widget _signOutButton() {
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: widget.onSignOut,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.navy,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
        child: const Text('Sign out'),
      ),
    );
  }

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
}

String _profileInitials(String value) {
  final initials = value
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .take(2)
      .map((part) => part[0].toUpperCase())
      .join();
  return initials.isEmpty ? '?' : initials;
}

String _profileHumanize(String value) => value
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
          word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}',
    )
    .join(' ');
