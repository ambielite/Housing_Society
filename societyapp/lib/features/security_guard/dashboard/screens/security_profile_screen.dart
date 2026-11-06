import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:housing_society_app/app/theme/app_colors.dart';

import '../../../auth/data/auth_api.dart';

class SecurityProfileScreen extends StatefulWidget {
  const SecurityProfileScreen({
    required this.user,
    required this.gateNames,
    required this.loadShiftAssignments,
    this.profilePhotoUrl,
    required this.onSignOut,
  });

  final AuthenticatedUser user;
  final List<String> gateNames;
  final Future<List<SecurityShiftAssignment>> Function() loadShiftAssignments;
  final String? profilePhotoUrl;
  final VoidCallback onSignOut;

  @override
  State<SecurityProfileScreen> createState() =>
      _SecurityProfileScreenState();
}

class SecurityShiftAssignment {
  const SecurityShiftAssignment({
    required this.shiftName,
    required this.shiftType,
    required this.startTime,
    required this.endTime,
    required this.breakMinutes,
    required this.rosterDate,
    required this.status,
    this.remarks,
  });

  final String shiftName;
  final String shiftType;
  final String startTime;
  final String endTime;
  final int breakMinutes;
  final DateTime? rosterDate;
  final String status;
  final String? remarks;
}

class _SecurityProfileScreenState extends State<SecurityProfileScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _entryController;
  List<SecurityShiftAssignment> _shiftAssignments = const [];
  bool _loadingShiftAssignments = true;
  bool _shiftAssignmentsFailed = false;

  @override
  void initState() {
    super.initState();
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
    _loadShiftAssignments();
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

  @override
  void dispose() {
    _entryController.dispose();
    super.dispose();
  }

  Widget _entry(Widget child, int index) {
    final begin = index * .14;
    final end = (begin + .62).clamp(0.0, 1.0).toDouble();
    final animation = CurvedAnimation(
      parent: _entryController,
      curve: Interval(begin, end, curve: Curves.easeOutCubic),
    );
    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: animation.drive(
          Tween<Offset>(begin: const Offset(0, .12), end: Offset.zero),
        ),
        child: child,
      ),
    );
  }

  String? get _photoUrl {
    final path = (widget.profilePhotoUrl ?? widget.user.profilePictureUrl)
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
        : 'http://10.0.2.2:5000/api/v1';
    return Uri.parse(baseUrl)
        .resolve(path.startsWith('/') ? path : '/$path')
        .toString();
  }

  String _value(String? value) =>
      value == null || value.trim().isEmpty ? 'Not provided' : value.trim();

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

  @override
  Widget build(BuildContext context) {
    final user = widget.user;
    final photoUrl = _photoUrl;
    final status = _profileHumanize((user.status ?? 'ACTIVE').toUpperCase());
    final gates = widget.gateNames.isEmpty
        ? 'No gates assigned'
        : widget.gateNames.join(', ');

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
            _entry(
              Container(
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
                      radius: 35,
                      backgroundColor: const Color(0xFFE2DEFF),
                      child: photoUrl == null
                          ? Text(
                              _profileInitials(user.name),
                              style: const TextStyle(
                                color: AppColors.indigo,
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                              ),
                            )
                          : ClipOval(
                              child: Image.network(
                                photoUrl,
                                width: 70,
                                height: 70,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => Center(
                                  child: Text(
                                    _profileInitials(user.name),
                                    style: const TextStyle(
                                      color: AppColors.indigo,
                                      fontSize: 19,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.ink,
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 5),
                          const Text(
                            'Security staff account',
                            style: TextStyle(
                              color: AppColors.inkSoft,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 9),
                          _profileStatus(status),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              0,
            ),
            const SizedBox(height: 14),
            _entry(
              _profileSection('Your contact', Icons.contact_mail_outlined, [
                _profileInfo(Icons.mail_outline_rounded, 'Email', user.email),
                _profileInfo(
                  Icons.phone_outlined,
                  'Phone',
                  _value(user.phone),
                ),
              ]),
              1,
            ),
            const SizedBox(height: 14),
            _entry(
              _profileSection('Security details', Icons.shield_outlined, [
                _profileInfo(
                  Icons.verified_user_outlined,
                  'Role',
                  'Security Head',
                ),
                _profileInfo(
                  Icons.badge_outlined,
                  'Employee code',
                  _value(user.employeeCode),
                ),
                _profileInfo(
                  Icons.door_front_door_outlined,
                  'Assigned gates',
                  gates,
                ),
              ]),
              2,
            ),
            const SizedBox(height: 14),
            _entry(_shiftAssignmentsSection(), 3),
            const SizedBox(height: 14),
            _entry(
              _profileSection('Account details', Icons.manage_accounts_outlined, [
                _profileInfo(
                  Icons.check_circle_outline_rounded,
                  'Account status',
                  status,
                ),
                _profileInfo(
                  Icons.event_outlined,
                  'Account created',
                  _date(user.createdAt),
                ),
                _profileInfo(
                  Icons.login_rounded,
                  'Last sign-in',
                  _dateTime(user.lastLoginAt),
                ),
              ]),
              4,
            ),
            const SizedBox(height: 14),
            _entry(
              _profileSection('Quick actions', Icons.bolt_rounded, [
                _profileSignOut(),
              ]),
              5,
            ),
          ],
        ),
      ),
    );
  }

  Widget _shiftAssignmentsSection() {
    if (_loadingShiftAssignments) {
      return _profileSection('Assigned shifts', Icons.schedule_rounded, [
        _profileInfo(Icons.hourglass_top_rounded, 'Schedule', 'Loading shift details'),
      ]);
    }
    if (_shiftAssignmentsFailed) {
      return _profileSection('Assigned shifts', Icons.schedule_rounded, [
        _profileInfo(Icons.error_outline_rounded, 'Schedule', 'Could not load shift details'),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: _loadShiftAssignments,
            icon: const Icon(Icons.refresh_rounded, size: 17),
            label: const Text('Try again'),
          ),
        ),
      ]);
    }
    if (_shiftAssignments.isEmpty) {
      return _profileSection('Assigned shifts', Icons.schedule_rounded, [
        _profileInfo(Icons.event_busy_rounded, 'Schedule', 'No upcoming shifts are currently assigned'),
      ]);
    }
    return _profileSection(
      'Assigned shifts',
      Icons.schedule_rounded,
      [
        for (var index = 0; index < _shiftAssignments.length; index++) ...[
          if (index > 0)
            const Padding(
              padding: EdgeInsets.only(left: 44),
              child: Divider(height: 12),
            ),
          _shiftAssignmentInfo(_shiftAssignments[index]),
        ],
      ],
    );
  }

  Widget _shiftAssignmentInfo(SecurityShiftAssignment assignment) {
    final date = assignment.rosterDate;
    final dateText = date == null
        ? 'Date unavailable'
        : '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    final breakText = assignment.breakMinutes <= 0
        ? 'No break'
        : assignment.breakMinutes % 60 == 0
            ? '${assignment.breakMinutes ~/ 60} hr break'
            : assignment.breakMinutes >= 60
                ? '${assignment.breakMinutes ~/ 60} hr ${assignment.breakMinutes % 60} min break'
                : '${assignment.breakMinutes} min break';
    final shiftLabel = assignment.shiftType.isEmpty
        ? assignment.shiftName
        : '${assignment.shiftName} · ${_profileHumanize(assignment.shiftType)}';
    return Column(
      children: [
        _profileInfo(Icons.event_outlined, 'Schedule date', dateText),
        _profileInfo(
          Icons.access_time_rounded,
          'Shift time',
          '${_profileTime(assignment.startTime)} – ${_profileTime(assignment.endTime)}',
        ),
        _profileInfo(Icons.badge_outlined, 'Shift', shiftLabel),
        _profileInfo(Icons.coffee_outlined, 'Break', breakText),
        _profileInfo(Icons.check_circle_outline_rounded, 'Schedule status', _profileHumanize(assignment.status)),
        if (assignment.remarks != null && assignment.remarks!.trim().isNotEmpty)
          _profileInfo(Icons.notes_rounded, 'Notes', assignment.remarks!.trim()),
      ],
    );
  }

  String _profileTime(String value) {
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(value.trim());
    if (match == null) return _value(value);
    final hour24 = int.tryParse(match.group(1)!) ?? 0;
    final hour = hour24 % 12 == 0 ? 12 : hour24 % 12;
    return '$hour:${match.group(2)} ${hour24 < 12 ? 'AM' : 'PM'}';
  }

  Widget _profileSection(String title, IconData icon, List<Widget> children) =>
      Container(
        padding: const EdgeInsets.fromLTRB(15, 15, 15, 9),
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

  Widget _profileInfo(IconData icon, String label, String value) => Padding(
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

  Widget _profileStatus(String status) {
    final active = status.toUpperCase() == 'ACTIVE';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: active ? const Color(0xFFE5F8EF) : const Color(0xFFFFF3E4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: active ? const Color(0xFF188754) : const Color(0xFF9B6314),
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Widget _profileSignOut() => Material(
    color: Colors.transparent,
    borderRadius: BorderRadius.circular(14),
    child: InkWell(
      onTap: widget.onSignOut,
      borderRadius: BorderRadius.circular(14),
      hoverColor: const Color(0xFFFFF0F1),
      splashColor: const Color(0xFFD84B58).withValues(alpha: .10),
      child: const Padding(
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(
          children: [
            SizedBox(
              width: 36,
              height: 36,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0xFFFFF0F1),
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                child: Icon(Icons.logout_rounded, color: Color(0xFFD84B58)),
              ),
            ),
            SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sign out',
                    style: TextStyle(
                      color: AppColors.inkSoft,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Sign out of this device',
                    style: TextStyle(color: AppColors.muted, fontSize: 10),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppColors.muted),
          ],
        ),
      ),
    ),
  );
}
String _profileInitials(String value) => value
    .trim()
    .split(RegExp(r'\s+'))
    .where((part) => part.isNotEmpty)
    .take(2)
    .map((part) => part[0].toUpperCase())
    .join();

String _profileHumanize(String value) => value
    .toLowerCase()
    .split('_')
    .map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
    .join(' ');
