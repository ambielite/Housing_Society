import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:housing_society_app/app/session_manager.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../../../resident/dashboard/screens/resident_home_screen.dart';
import '../profile/security_profile_screen.dart';
import '../../visitor_check_in/security_register_visitor_screen.dart';

part '../../visitor_check_in/security_visitors_screen.dart';
part '../../gate_log/security_gate_log_screen.dart';
part '../../deliveries/security_deliveries_screen.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

const _residentActionGreenBg = Color(0xFFE4F7F1);
const _residentActionGreen = Color(0xFF229B78);
const _residentActionOrangeBg = Color(0xFFFFF1E5);
const _residentActionOrange = Color(0xFFE68A36);
const _residentActionBlueBg = Color(0xFFE8F1FF);
const _residentActionBlue = Color(0xFF4784DB);

const _deliveryTransitions = <String, List<String>>{
  'EXPECTED': ['ARRIVED', 'CANCELLED'],
  'ARRIVED': ['INSIDE', 'LEFT_AT_GATE', 'CANCELLED'],
  'INSIDE': ['PICKED_UP', 'EXITED', 'OVERSTAY', 'CANCELLED'],
  'LEFT_AT_GATE': ['PICKED_UP', 'OVERSTAY'],
  'OVERSTAY': ['PICKED_UP', 'EXITED'],
  'PICKED_UP': ['EXITED'],
  'EXITED': [],
  'CANCELLED': [],
};

String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    : kIsWeb
    ? 'http://localhost:5000/api/v1'
    : 'http://localhost:5000/api/v1';

String? _optionalString(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty || text == 'null' ? null : text;
}

String? _imageUrl(Object? value) {
  final path = _optionalString(value);
  if (path == null) return null;
  final uri = Uri.tryParse(path);
  if (uri == null) return null;
  return uri.hasScheme
      ? uri.toString()
      : Uri.parse(_apiBaseUrl).resolve(path).toString();
}

/// Routes residents to their existing home and opens the security dashboard
/// for the security login flow.
class SecurityDashboardScreen extends StatelessWidget {
  const SecurityDashboardScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  Widget build(BuildContext context) {
    const residentRoles = {
      'RESIDENT_APP',
      'RESIDENT',
      'OWNER',
      'PRIMARY_OWNER',
      'CO_OWNER',
      'TENANT',
      'FAMILY_MEMBER',
    };
    final isResidentAccount =
        user.employeeCode == null &&
        (user.roles.isEmpty ||
            user.roles.any(
              (role) => residentRoles.contains(role.trim().toUpperCase()),
            ));

    if (isResidentAccount) return ResidentHomeScreen(user: user);
    final isSecurityAccount =
        user.employeeCode?.trim().isNotEmpty == true &&
        user.roles.any((role) => role.trim().toUpperCase() == 'SECURITY_HEAD');
    if (isSecurityAccount) return _SecurityHome(user: user);
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.badge_outlined,
                color: AppColors.indigo,
                size: 42,
              ),
              const SizedBox(height: 12),
              const Text(
                'Security login required',
                style: TextStyle(
                  color: AppColors.ink,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Sign in using the security option and your employee code.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
                  (_) => false,
                ),
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('Back to sign in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SecurityHome extends StatefulWidget {
  const _SecurityHome({required this.user});

  final AuthenticatedUser user;

  @override
  State<_SecurityHome> createState() => _SecurityHomeState();
}

class _SecurityHomeState extends State<_SecurityHome>
    with WidgetsBindingObserver {
  int _tab = 0;
  int _deliveryTab = 0;
  String _visitorFilter = 'ALL';
  late Future<_GuardSnapshot> _snapshot;
  _GuardSnapshot? _loadedSnapshot;
  Timer? _deliverySyncTimer;
  Timer? _visitorPassSyncTimer;
  Timer? _securityEventsReconnectTimer;
  StreamSubscription<String>? _securityEventsSubscription;
  http.Client? _securityEventsClient;
  Duration _securityEventsRetryDelay = const Duration(seconds: 2);
  List<_GuardNotification> _notifications = const [];
  bool _deliverySyncRunning = false;
  bool _visitorPassSyncRunning = false;
  bool _shiftSyncRunning = false;
  Map<String, dynamic>? _guardAttendanceRecord;
  bool _attendanceLoading = false;
  bool _attendanceBusy = false;
  bool _attendanceStaffAvailable = false;
  String? _attendanceError;
  final ValueNotifier<int> _deliveryRevision = ValueNotifier(0);
  final ValueNotifier<int> _shiftRevision = ValueNotifier(0);
  final ValueNotifier<DateTime> _shiftClock = ValueNotifier(DateTime.now());
  Timer? _shiftClockTimer;

  void _selectDeliveryTab(int index) {
    if (_deliveryTab == index) return;
    setState(() => _deliveryTab = index);
  }

  void _selectVisitorFilter(String filter) {
    if (_visitorFilter == filter) return;
    setState(() => _visitorFilter = filter);
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _snapshot = _GuardApi.load(widget.user);
    _shiftClockTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      _shiftClock.value = DateTime.now();
    });
    _loadNotifications();
    _connectSecurityEvents();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _restartSecurityEvents();
  }

  void _restartSecurityEvents() {
    _securityEventsReconnectTimer?.cancel();
    _securityEventsSubscription?.cancel();
    _securityEventsSubscription = null;
    _securityEventsClient?.close();
    _securityEventsClient = null;
    _connectSecurityEvents();
  }

  Future<void> _connectSecurityEvents() async {
    if (!mounted || _securityEventsSubscription != null) return;
    final client = http.Client();
    try {
      final request = http.Request(
        'GET',
        Uri.parse('$_apiBaseUrl/gates/notifications/stream'),
      )..headers['Authorization'] = 'Bearer ${widget.user.accessToken}';
      final response = await client
          .send(request)
          .timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) {
        client.close();
        _scheduleSecurityEventsReconnect();
        return;
      }
      _securityEventsClient = client;
      _securityEventsRetryDelay = const Duration(seconds: 2);
      _securityEventsSubscription = response.stream
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen(
            (line) {
              if (!line.startsWith('data:')) return;
              try {
                final event = jsonDecode(line.substring(5).trim());
                if (event is Map && event['type'] == 'roster-updated') {
                  unawaited(_refreshShiftAssignments());
                  unawaited(_loadNotifications());
                } else if (event is Map &&
                    event['type'] == 'profile-updated') {
                  unawaited(_refreshGuardProfile());
                  unawaited(_loadNotifications());
                }
              } catch (_) {
                // Ignore malformed stream messages and keep the connection open.
              }
            },
            onError: (_) => _onSecurityEventsDisconnected(client),
            onDone: () => _onSecurityEventsDisconnected(client),
            cancelOnError: true,
          );
      // Catch changes made while the app was backgrounded or before this
      // event stream reconnected; ongoing updates arrive through the stream.
      unawaited(_loadNotifications());
      unawaited(_refreshGuardProfile());
    } catch (_) {
      client.close();
      _scheduleSecurityEventsReconnect();
    }
  }

  void _onSecurityEventsDisconnected(http.Client client) {
    if (!identical(client, _securityEventsClient)) return;
    _securityEventsSubscription = null;
    _securityEventsClient = null;
    client.close();
    _scheduleSecurityEventsReconnect();
  }

  void _scheduleSecurityEventsReconnect() {
    if (!mounted || (_securityEventsReconnectTimer?.isActive ?? false)) return;
    final delay = _securityEventsRetryDelay;
    final nextSeconds = (_securityEventsRetryDelay.inSeconds * 2)
        .clamp(2, 60)
        .toInt();
    _securityEventsRetryDelay = Duration(seconds: nextSeconds);
    _securityEventsReconnectTimer = Timer(delay, () {
      _securityEventsReconnectTimer = null;
      _connectSecurityEvents();
    });
  }

  Future<void> _refresh() async {
    final request = _GuardApi.load(widget.user);
    setState(() => _snapshot = request);
    await request;
  }

  Future<void> _refreshDeliveries({bool showErrors = true}) async {
    final snapshot = _loadedSnapshot;
    if (snapshot == null || _deliverySyncRunning) return;
    _deliverySyncRunning = true;
    try {
      final updated = await _GuardApi.loadDeliveries(widget.user);
      if (!mounted) return;
      snapshot.deliveries
        ..clear()
        ..addAll(updated.deliveries);
      snapshot.parcels
        ..clear()
        ..addAll(updated.parcels);
      _deliveryRevision.value++;
    } on _GuardApiException catch (error) {
      if (showErrors && mounted) _showError(error.message);
    } catch (_) {
      if (showErrors && mounted) {
        _showError('Could not refresh deliveries. Please try again.');
      }
    } finally {
      _deliverySyncRunning = false;
    }
  }

  Future<void> _refreshShiftAssignments({bool showResult = false}) async {
    final snapshot = _loadedSnapshot;
    if (!mounted || snapshot == null || _shiftSyncRunning) return;
    _shiftSyncRunning = true;
    _shiftRevision.value++;
    try {
      final assignments = await _GuardApi.loadShiftAssignments(widget.user);
      if (!mounted) return;
      snapshot.shiftAssignments = List.of(assignments);
      snapshot.shiftLoadError = null;
      // Refresh only the shift card; keep the rest of the dashboard in place.
      _shiftRevision.value++;
      if (showResult && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              assignments.isEmpty
                  ? 'No shift is currently assigned to you.'
                  : 'Shift details refreshed.',
            ),
          ),
        );
      }
    } on _GuardApiException catch (error) {
      snapshot.shiftLoadError = error.message;
      if (showResult && mounted) _showError(error.message);
    } catch (_) {
      snapshot.shiftLoadError = 'Could not load your shift details.';
      // Keep the last successful assignment visible through transient errors.
      if (showResult && mounted) {
        _showError('Could not refresh shift details. Please try again.');
      }
    } finally {
      _shiftSyncRunning = false;
      if (mounted) _shiftRevision.value++;
    }
  }

  Future<void> _loadNotifications() async {
    try {
      final notifications = await _GuardApi.loadNotifications(widget.user);
      if (!mounted) return;
      final oldIds = _notifications.map((item) => item.id).join('|');
      final newIds = notifications.map((item) => item.id).join('|');
      if (oldIds != newIds) setState(() => _notifications = notifications);
    } catch (_) {
      // Notifications are supplementary; keep the dashboard usable offline.
    }
  }

  Future<void> _refreshGuardProfile() async {
    try {
      final profile = await _GuardApi.loadGuardProfile(widget.user);
      if (!mounted || _loadedSnapshot == null) return;
      _loadedSnapshot!.guardProfile = profile;
      setState(() {});
    } catch (_) {
      // Keep the last displayed profile if a refresh request fails.
    }
  }

  Future<void> _markNotificationRead(String id) async {
    if (!mounted) return;
    setState(() {
      _notifications = _notifications
          .where((notification) => notification.id != id)
          .toList(growable: false);
    });
    try {
      await _GuardApi.markNotificationRead(widget.user, id);
    } catch (_) {
      // Keep the item dismissed locally for this session if the server is offline.
    }
  }

  void _selectTab(int index) {
    _deliverySyncTimer?.cancel();
    _deliverySyncTimer = null;
    _visitorPassSyncTimer?.cancel();
    _visitorPassSyncTimer = null;
    if (index == 4) {
      unawaited(_openProfile());
      return;
    }
    setState(() => _tab = index);
    if (index == 1) {
      unawaited(_refreshVisitorPasses());
      _visitorPassSyncTimer = Timer.periodic(
        const Duration(seconds: 5),
        (_) => _refreshVisitorPasses(),
      );
    }
    if (index == 3) {
      unawaited(_refreshDeliveries(showErrors: false));
      _deliverySyncTimer = Timer.periodic(
        const Duration(seconds: 3),
        (_) => unawaited(_refreshDeliveries(showErrors: false)),
      );
    }
  }

  Future<void> _openProfile() async {
    _deliverySyncTimer?.cancel();
    _deliverySyncTimer = null;
    _visitorPassSyncTimer?.cancel();
    _visitorPassSyncTimer = null;
    if (mounted) {
      setState(() => _tab = 4);
      unawaited(_refreshShiftAssignments());
      unawaited(_refreshGuardAttendance());
    }
  }

  Future<void> _refreshGuardAttendance() async {
    final guard = _loadedSnapshot?.guardProfile;
    final staffId = (guard?['staff_id'] ?? guard?['staffId'])?.toString();
    if (staffId == null || staffId.isEmpty) {
      if (!mounted) return;
      setState(() {
        _attendanceStaffAvailable = false;
        _attendanceLoading = false;
        _attendanceError = 'Your login is not linked to an employee record.';
      });
      return;
    }

    setState(() {
      _attendanceStaffAvailable = true;
      _attendanceLoading = true;
      _attendanceError = null;
    });
    try {
      final records = await _GuardApi._get(
        '/staff-attendance/staff/${Uri.encodeComponent(staffId)}',
        widget.user.accessToken,
      );
      final today = _localAttendanceDate(DateTime.now());
      Map<String, dynamic>? openRecord;
      Map<String, dynamic>? todayRecord;
      for (final record in records) {
        final date = (record['attendanceDate'] ?? record['attendance_date'])
            ?.toString();
        final checkIn = record['checkInTime'] ?? record['check_in_time'];
        final checkOut = record['checkOutTime'] ?? record['check_out_time'];
        if (date != null && date.length >= 10 && date.substring(0, 10) == today) {
          todayRecord = record;
        }
        if (checkIn != null && checkOut == null) {
          if (openRecord == null) {
            openRecord = record;
          } else {
            final currentDate = (openRecord['attendanceDate'] ??
                    openRecord['attendance_date'])
                ?.toString() ?? '';
            if (date != null && date.compareTo(currentDate) > 0) {
              openRecord = record;
            }
          }
        }
      }
      if (!mounted) return;
      setState(() {
        _guardAttendanceRecord = openRecord ?? todayRecord;
        _attendanceLoading = false;
        _attendanceError = null;
      });
    } on _GuardApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _attendanceLoading = false;
        _attendanceError = error.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _attendanceLoading = false;
        _attendanceError = 'Could not load your attendance. Try again.';
      });
    }
  }

  Future<void> _changeGuardAttendance(bool checkIn) async {
    final guard = _loadedSnapshot?.guardProfile;
    final staffId = (guard?['staff_id'] ?? guard?['staffId'])?.toString();
    if (staffId == null || staffId.isEmpty || _attendanceBusy) return;
    final now = DateTime.now();
    final snapshot = _loadedSnapshot;
    if (checkIn &&
        (snapshot == null || _activeAssignedShift(snapshot, now) == null)) {
      _showError('Attendance actions are available only during your assigned shift.');
      return;
    }
    final currentRecord = _guardAttendanceRecord;
    final storedDate = (currentRecord?['attendanceDate'] ??
            currentRecord?['attendance_date'])
        ?.toString();
    final attendanceDate = checkIn
        ? _localAttendanceDate(now)
        : storedDate != null && storedDate.length >= 10
        ? storedDate.substring(0, 10)
        : _localAttendanceDate(now);

    setState(() {
      _attendanceBusy = true;
      _attendanceError = null;
    });
    try {
      final result = await _GuardApi.post(
        checkIn ? '/staff-attendance/check-in' : '/staff-attendance/check-out',
        {
          'staffId': staffId,
          'attendanceDate': attendanceDate,
          if (checkIn) 'checkInTime': now.toIso8601String(),
          if (!checkIn) 'checkOutTime': now.toIso8601String(),
        },
        widget.user.accessToken,
      );
      if (!mounted) return;
      setState(() => _guardAttendanceRecord = result);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            checkIn ? 'Attendance checked in.' : 'Attendance checked out.',
          ),
        ),
      );
    } on _GuardApiException catch (error) {
      if (mounted) {
        _showError(error.message);
        await _refreshGuardAttendance();
      }
    } finally {
      if (mounted) setState(() => _attendanceBusy = false);
    }
  }

  String _localAttendanceDate(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  Future<void> _cancelAssignedShift(
    SecurityShiftAssignment assignment,
    _GuardSnapshot data,
  ) async {
    final reasonController = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancel assigned shift'),
        content: TextField(
          controller: reasonController,
          autofocus: true,
          minLines: 3,
          maxLines: 5,
          maxLength: 1000,
          decoration: const InputDecoration(
            labelText: 'Reason for cancellation',
            hintText: 'Describe the emergency or reason',
            border: OutlineInputBorder(),
            alignLabelWithHint: true,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Keep shift'),
          ),
          FilledButton(
            onPressed: () {
              final value = reasonController.text.trim();
              if (value.length < 5) {
                ScaffoldMessenger.of(dialogContext).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Enter at least 5 characters for the reason.',
                    ),
                  ),
                );
                return;
              }
              Navigator.pop(dialogContext, value);
            },
            child: const Text('Submit cancellation'),
          ),
        ],
      ),
    );
    if (reason == null || !mounted) {
      reasonController.dispose();
      return;
    }
    try {
      await _GuardApi.post(
        '/rosters/${Uri.encodeComponent(assignment.rosterId)}/cancel',
        {'reason': reason},
        widget.user.accessToken,
      );
      final index = data.shiftAssignments.indexWhere(
        (item) => item.rosterId == assignment.rosterId,
      );
      if (index >= 0) {
        data.shiftAssignments[index] = assignment.copyWith(
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: DateTime.now(),
          cancelledBy: widget.user.userId,
        );
        _shiftRevision.value++;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Shift cancelled. Your administrator has been notified.',
            ),
          ),
        );
      }
    } on _GuardApiException catch (error) {
      if (mounted) _showError(error.message);
    } catch (error) {
      debugPrint('Shift cancellation failed: $error');
      if (mounted) {
        _showError('Could not cancel this shift. Please try again.');
      }
    } finally {
      reasonController.dispose();
    }
  }

  Future<void> _refreshVisitorPasses() async {
    final snapshot = _loadedSnapshot;
    if (!mounted || snapshot == null || _visitorPassSyncRunning || _tab != 1) {
      return;
    }
    _visitorPassSyncRunning = true;
    try {
      final passes = await _GuardApi.loadPasses(widget.user, snapshot.gates);
      if (!mounted) return;
      snapshot.passes
        ..clear()
        ..addAll(passes);
      snapshot.passes.sort(
        (a, b) => (b.createdAt ?? DateTime(1970)).compareTo(
          a.createdAt ?? DateTime(1970),
        ),
      );
      setState(() {});
    } catch (_) {
      // Keep the last visitor pass states visible on transient errors.
    } finally {
      _visitorPassSyncRunning = false;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _deliverySyncTimer?.cancel();
    _visitorPassSyncTimer?.cancel();
    _securityEventsReconnectTimer?.cancel();
    _securityEventsSubscription?.cancel();
    _securityEventsClient?.close();
    _deliveryRevision.dispose();
    _shiftClockTimer?.cancel();
    _shiftRevision.dispose();
    _shiftClock.dispose();
    super.dispose();
  }

  Future<void> _changePass(
    _GuardPass pass,
    String action,
    _GuardSnapshot data,
  ) async {
    try {
      Map<String, dynamic> response;
      if (action == 'ARRIVAL') {
        response = await _GuardApi.patch(
          '/visitors/passes/${pass.id}/arrival',
          const {},
          widget.user.accessToken,
        );
      } else if (action == 'ENTRY') {
        response = await _GuardApi.patch('/visitors/passes/${pass.id}/entry', {
          'capturedBy': widget.user.userId,
        }, widget.user.accessToken);
      } else if (action == 'CANCEL') {
        response = await _GuardApi.patch(
          '/visitors/passes/${pass.id}/cancel',
          const {},
          widget.user.accessToken,
        );
      } else {
        response = await _GuardApi.patch('/visitors/passes/${pass.id}/exit', {
          'capturedBy': widget.user.userId,
        }, widget.user.accessToken);
      }
      if (!mounted) return;
      final updatedPass = _GuardPass.fromJson(response);
      final eventType = action == 'ENTRY'
          ? 'ENTRY'
          : action == 'EXIT'
          ? 'EXIT'
          : null;
      setState(() {
        final index = data.passes.indexWhere((item) => item.id == pass.id);
        if (index >= 0) data.passes[index] = updatedPass;
        if (eventType != null) {
          data.events.insert(
            0,
            _GateEvent(
              type: eventType,
              passId: pass.id,
              gateId: pass.gateId,
              at: DateTime.now(),
            ),
          );
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            action == 'ARRIVAL'
                ? 'Visitor arrival recorded.'
                : action == 'ENTRY'
                ? 'Visitor entry recorded.'
                : 'Visitor exit recorded.',
          ),
        ),
      );
    } on _GuardApiException catch (error) {
      if (mounted) _showError(error.message);
    }
  }

  Future<void> _registerWalkIn(_GuardSnapshot data) async {
    if (data.gates.isEmpty) {
      _showError('There is no active gate configured for this society.');
      return;
    }
    final created = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => SecurityRegisterVisitorScreen(
          destinations: data.destinations
              .map(
                (destination) => SecurityVisitorDestination(
                  unitId: destination.unitId,
                  residentId: destination.residentId,
                  label: destination.label,
                ),
              )
              .toList(growable: false),
          gates: data.gates
              .map((gate) => SecurityVisitorGate(id: gate.id, name: gate.name))
              .toList(growable: false),
          onRegister: (registration) async {
            final profile = await _GuardApi.post('/visitors/profiles', {
              'societyId': widget.user.societyId,
              'name': registration.name,
              'visitorType': registration.visitorType,
              'employeeCode': registration.employeeCode,
              'phone': registration.phone,
              'idType': registration.idType,
              'vehicleNo': registration.vehicleNo,
              'deliveryCompany': registration.deliveryCompany,
            }, widget.user.accessToken);
            final profileId = profile['id']?.toString();
            if (profileId == null || profileId.isEmpty) {
              throw const _GuardApiException(
                'The server did not return a visitor record.',
              );
            }
            final pass = await _GuardApi.post('/visitors/passes', {
              'visitorProfileId': profileId,
              'gateId': registration.gateId,
              'unitId': registration.unitId,
              'residentId': registration.residentId,
              'passNo': 'WALKIN-${DateTime.now().millisecondsSinceEpoch}',
            }, widget.user.accessToken);
            if ('${pass['id'] ?? ''}'.isEmpty) {
              throw const _GuardApiException(
                'The server did not return the visitor pass.',
              );
            }
            return {'profile': profile, 'pass': pass};
          },
        ),
      ),
    );
    if (created == null || !mounted) return;
    final profile = _Visitor.fromJson(
      Map<String, dynamic>.from(created['profile'] as Map),
    );
    final pass = _GuardPass.fromJson(
      Map<String, dynamic>.from(created['pass'] as Map),
    );
    setState(() {
      data.profiles[profile.id] = profile;
      data.passes.removeWhere((item) => item.id == pass.id);
      data.passes.insert(0, pass);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Visitor registered. Record their arrival when they reach the gate.',
        ),
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF9D2635),
      ),
    );
  }

  void _signOut() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  void _openNotifications() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => SafeArea(
        top: false,
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(sheetContext).height * .78,
          ),
          decoration: const BoxDecoration(
            color: Color(0xFFF7F8FC),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 11),
              Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFD9DEEA),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 18, 14),
                child: Row(
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Notifications',
                            style: TextStyle(
                              color: AppColors.ink,
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Updates for your security post',
                            style: TextStyle(color: Colors.black, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Close',
                      onPressed: () => Navigator.of(sheetContext).pop(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              if (_notifications.isEmpty)
                const Padding(
                  padding: EdgeInsets.fromLTRB(24, 28, 24, 36),
                  child: Column(
                    children: [
                      Icon(
                        Icons.notifications_none_rounded,
                        color: Color(0xFF9AA4B4),
                        size: 38,
                      ),
                      SizedBox(height: 10),
                      Text(
                        'You’re all caught up',
                        style: TextStyle(
                          color: AppColors.ink,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'New notifications will appear here.',
                        style: TextStyle(color: Colors.black, fontSize: 12),
                      ),
                    ],
                  ),
                )
              else
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 9),
                    itemBuilder: (context, index) {
                      final notification = _notifications[index];
                      return Material(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () {
                            Navigator.of(sheetContext).pop();
                            unawaited(_markNotificationRead(notification.id));
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEAF0FF),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.notifications_active_outlined,
                                    size: 19,
                                    color: AppColors.navy,
                                  ),
                                ),
                                const SizedBox(width: 11),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        notification.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: AppColors.ink,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13,
                                        ),
                                      ),
                                      const SizedBox(height: 5),
                                      Text(
                                        notification.message,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.black,
                                          height: 1.4,
                                          fontSize: 11,
                                        ),
                                      ),
                                      if (notification.createdAt != null) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          'Received ${_formatNotificationDateTime(notification.createdAt!)}',
                                          style: const TextStyle(
                                            color: Color(0xFF5B6479),
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 5),
                                const Icon(
                                  Icons.chevron_right_rounded,
                                  color: Color(0xFF9AA4B4),
                                  size: 19,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatNotificationDateTime(DateTime value) {
    final local = value.toLocal();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = local.hour < 12 ? 'AM' : 'PM';
    return '${local.day.toString().padLeft(2, '0')} ${months[local.month - 1]} '
        '${local.year}, $hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFF5F7FB),
    body: SafeArea(
      bottom: false,
      child: FutureBuilder<_GuardSnapshot>(
        future: _snapshot,
        builder: (context, state) {
          if (state.hasError) return _errorView(state.error!);
          if (!state.hasData) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.indigo),
            );
          }
          final data = state.data!;
          _loadedSnapshot = data;
          return Column(
            children: [
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: List.generate(5, (index) {
                    final selected = _tab == index;
                    final page = index == 4
                        ? ValueListenableBuilder<DateTime>(
                            valueListenable: _shiftClock,
                            builder: (context, now, _) =>
                                ValueListenableBuilder<int>(
                                  valueListenable: _shiftRevision,
                                  builder: (context, _, _) {
                                    final shiftAllowsAttendance =
                                        _activeAssignedShift(data, now) != null;
                                    return SecurityProfileScreen(
                                      user: widget.user,
                                      guardProfile: data.guardProfile,
                                      gateNames: data.gates
                                          .map((gate) => gate.name)
                                          .toList(),
                                      profilePhotoUrl: data.accountPhotoUrl,
                                      initialShiftAssignments:
                                          data.shiftAssignments,
                                      loadShiftAssignments: () =>
                                          _GuardApi.loadShiftAssignments(
                                            widget.user,
                                          ),
                                      attendanceRecord: _guardAttendanceRecord,
                                      attendanceLoading: _attendanceLoading,
                                      attendanceBusy: _attendanceBusy,
                                      canMarkAttendance:
                                          _attendanceStaffAvailable &&
                                          _attendanceError == null &&
                                          shiftAllowsAttendance,
                                      attendanceAvailabilityMessage:
                                          _attendanceError != null ||
                                                  shiftAllowsAttendance
                                              ? null
                                              : 'Attendance is available only during your assigned shift.',
                                      attendanceError: _attendanceError,
                                      onAttendanceAction:
                                          _changeGuardAttendance,
                                      onRefreshAttendance:
                                          _refreshGuardAttendance,
                                      onSignOut: _signOut,
                                    );
                                  },
                                ),
                          )
                        : _dashboardTab(data, index);
                    return Positioned.fill(
                      child: IgnorePointer(
                        ignoring: !selected,
                        child: ExcludeSemantics(
                          excluding: !selected,
                          child: AnimatedOpacity(
                            key: ValueKey(index),
                            duration: const Duration(milliseconds: 240),
                            curve: Curves.easeInOut,
                            opacity: selected ? 1 : 0,
                            child: page,
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              _bottomBar(),
            ],
          );
        },
      ),
    ),
  );

  Widget _dashboardTab(_GuardSnapshot data, int tab) {
    final content = switch (tab) {
      1 => _SecurityVisitorsScreen(owner: this, data: data),
      2 => _SecurityGateLogScreen(owner: this, data: data),
      3 => _SecurityDeliveriesScreen(owner: this, data: data),
      _ => _overview(data),
    };
    return RefreshIndicator(
      color: AppColors.indigo,
      onRefresh: _refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 900),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ValueListenableBuilder<int>(
                    valueListenable: _shiftRevision,
                    builder: (context, _, _) => _header(data),
                  ),
                  const SizedBox(height: 20),
                  if (tab == 0) ...[
                    _greeting(),
                    const SizedBox(height: 18),
                    ValueListenableBuilder<DateTime>(
                      valueListenable: _shiftClock,
                      builder: (context, now, _) => ValueListenableBuilder<int>(
                        valueListenable: _shiftRevision,
                        builder: (context, _, _) => _assignedShiftCard(data, now),
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],
                  content,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _header(_GuardSnapshot data) => Row(
    children: [
      Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFE8ECF3)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Image.asset(
            'assets/images/logo1.png',
            width: 44,
            height: 44,
            fit: BoxFit.contain,
            semanticLabel: 'ShubNivas logo',
          ),
        ),
      ),
      const SizedBox(width: 11),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ShubNivas',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
                color: AppColors.ink,
              ),
            ),
            SizedBox(height: 2),
            Text(
              'SECURITY PORTAL',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.3,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
      _headerIcon(
        Icons.notifications_none_rounded,
        badge: data.expectedCount > 0 || _notifications.isNotEmpty,
        onTap: _openNotifications,
      ),
      const SizedBox(width: 9),
      PopupMenuButton<String>(
        tooltip: 'Account',
        onSelected: (value) {
          if (value == 'profile') {
            unawaited(_openProfile());
          } else if (value == 'logout') {
            _signOut();
          }
        },
        itemBuilder: (_) => const [
          PopupMenuItem(value: 'profile', child: Text('Profile')),
          PopupMenuItem(value: 'logout', child: Text('Sign out')),
        ],
        child: _securityAvatar(data),
      ),
    ],
  );

  Widget _headerIcon(
    IconData icon, {
    required bool badge,
    required VoidCallback onTap,
  }) => InkWell(
    onTap: onTap,
    customBorder: const CircleBorder(),
    child: Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFE8ECF3)),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(icon, color: const Color(0xFF68748A), size: 21),
          if (badge)
            const Positioned(
              right: 10,
              top: 9,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0xFFFF6F72),
                  shape: BoxShape.circle,
                ),
                child: SizedBox(width: 7, height: 7),
              ),
            ),
        ],
      ),
    ),
  );

  Widget _securityAvatar(_GuardSnapshot data) {
    final staffPhotoUrl = _optionalString(data.guardProfile?['photo_path']);
    // A shared SECURITY_HEAD login may be linked to several guards. Only use
    // this employee's staff photo; a shared account photo can belong to another guard.
    final photoUrl = _imageUrl(staffPhotoUrl);
    return CircleAvatar(
      radius: 22,
      backgroundColor: const Color(0xFFEAE8FF),
      child: photoUrl == null || photoUrl.trim().isEmpty
          ? Text(
              _initials(widget.user.name),
              style: const TextStyle(
                color: AppColors.indigo,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            )
          : ClipOval(
              child: Image.network(
                photoUrl,
                width: 44,
                height: 44,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Center(
                  child: Text(
                    _initials(widget.user.name),
                    style: const TextStyle(
                      color: AppColors.indigo,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _greeting() {
    final now = DateTime.now();
    final greeting = now.hour < 12
        ? 'Morning'
        : now.hour < 17
        ? 'Afternoon'
        : 'Evening';
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${weekdays[now.weekday - 1].toUpperCase()}, ${now.day} ${months[now.month - 1].toUpperCase()}',
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.15,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          'Good $greeting, ${_firstName(widget.user.name)}',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            letterSpacing: -.65,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 5),
        const Text(
          'Here is what is happening at your gate today.',
          style: TextStyle(fontSize: 13, color: Color.fromARGB(255, 0, 6, 17)),
        ),
      ],
    );
  }

  Widget _securitySummaryCard(_GuardSnapshot data) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      gradient: const LinearGradient(
        colors: [Color(0xFF6557E9), Color(0xFF8878F6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      boxShadow: const [
        BoxShadow(
          color: Color(0x286455E9),
          blurRadius: 20,
          offset: Offset(0, 10),
        ),
      ],
    ),
    child: Stack(
      children: [
        Positioned(
          right: -22,
          top: -30,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: .08),
            ),
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.shield_outlined,
                  color: Color(0xFFE2DFFF),
                  size: 17,
                ),
                const SizedBox(width: 7),
                const Expanded(
                  child: Text(
                    'SECURITY DESK',
                    style: TextStyle(
                      color: Color(0xFFE2DFFF),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.25,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .17),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'ON DUTY',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .7,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 15),
            const Text(
              'Security operations',
              style: TextStyle(
                color: Colors.white,
                fontSize: 21,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'Employee ${widget.user.employeeCode ?? 'Not assigned'}  ·  ${data.gates.length} ${data.gates.length == 1 ? 'gate' : 'gates'} assigned',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFFE7E4FF),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    ),
  );

  Widget _overview(_GuardSnapshot data) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _sectionHeading('Quick actions', 'Security desk'),
      const SizedBox(height: 10),
      Row(
        children: [
          Expanded(
            child: _quickAction(
              icon: Icons.person_add_alt_1_rounded,
              iconBackground: _residentActionGreenBg,
              iconColor: _residentActionGreen,
              title: 'Register visitor',
              subtitle: 'Create a walk-in pass',
              onTap: () => _registerWalkIn(data),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _quickAction(
              icon: Icons.receipt_long_rounded,
              iconBackground: _residentActionOrangeBg,
              iconColor: _residentActionOrange,
              title: 'Gate log',
              subtitle: 'Review recent entries',
              onTap: () => setState(() => _tab = 2),
            ),
          ),
        ],
      ),
      const SizedBox(height: 14),
      _sectionHeading('Gate activity', '${data.passes.length} passes'),
      const SizedBox(height: 10),
      if (data.actionablePasses.isEmpty)
        _emptyCard('No visitors are waiting at the gate right now.')
      else
        ...data.actionablePasses
            .take(5)
            .map(
              (pass) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: this._passCard(pass, data),
              ),
            ),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: Row(
          children: [
            const Icon(Icons.shield_outlined, color: AppColors.indigo),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Keep each entry and exit recorded to maintain an accurate gate log.',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  );

  DateTime _shiftDateTime(DateTime date, String time) {
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(time.trim());
    if (match == null) return date;
    return DateTime(
      date.year,
      date.month,
      date.day,
      int.tryParse(match.group(1)!) ?? 0,
      int.tryParse(match.group(2)!) ?? 0,
    );
  }

  DateTime _shiftEnd(SecurityShiftAssignment assignment) {
    final date = assignment.rosterDate ?? DateTime.now();
    return _shiftEndOnDate(assignment, date);
  }

  DateTime _shiftEndOnDate(
    SecurityShiftAssignment assignment,
    DateTime date,
  ) {
    final start = _shiftDateTime(date, assignment.startTime);
    var end = _shiftDateTime(date, assignment.endTime);
    if (assignment.isOvernight || !end.isAfter(start)) {
      end = end.add(const Duration(days: 1));
    }
    return end;
  }

  SecurityShiftAssignment? _activeAssignedShift(
    _GuardSnapshot data,
    DateTime now,
  ) {
    final today = DateTime(now.year, now.month, now.day);
    for (final assignment in data.shiftAssignments) {
      if (assignment.status == 'CANCELLED' ||
          assignment.status == 'COMPLETED') {
        continue;
      }
      final periodStart = assignment.rosterDate;
      final periodEnd = assignment.rosterEndDate ??
          (assignment.scheduleType == 'DAILY' ? DateTime(9999, 12, 31) : periodStart);
      if (periodStart == null || periodEnd == null) continue;
      for (final occurrenceDate in <DateTime>[
        today,
        today.subtract(const Duration(days: 1)),
      ]) {
        final date = DateTime(
          occurrenceDate.year,
          occurrenceDate.month,
          occurrenceDate.day,
        );
        final firstDate = DateTime(periodStart.year, periodStart.month, periodStart.day);
        final lastDate = DateTime(periodEnd.year, periodEnd.month, periodEnd.day);
        if (date.isBefore(firstDate) || date.isAfter(lastDate)) continue;
        final start = _shiftDateTime(date, assignment.startTime);
        if (!now.isBefore(start) &&
            now.isBefore(_shiftEndOnDate(assignment, date))) {
          return assignment;
        }
      }
    }
    return null;
  }

  DateTime? _nextRosterOccurrenceStart(
    SecurityShiftAssignment assignment,
    DateTime now,
  ) {
    final periodStart = assignment.rosterDate;
    final periodEnd = assignment.rosterEndDate ??
        (assignment.scheduleType == 'DAILY' ? DateTime(9999, 12, 31) : periodStart);
    if (periodStart == null || periodEnd == null) return null;
    final first = DateTime(periodStart.year, periodStart.month, periodStart.day);
    final last = DateTime(periodEnd.year, periodEnd.month, periodEnd.day);
    var date = DateTime(now.year, now.month, now.day)
        .subtract(const Duration(days: 1));
    if (date.isBefore(first)) date = first;
    while (!date.isAfter(last)) {
      final start = _shiftDateTime(date, assignment.startTime);
      if (_shiftEndOnDate(assignment, date).isAfter(now)) return start;
      date = date.add(const Duration(days: 1));
    }
    return null;
  }

  String _shiftClockLabel(String value) {
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(value.trim());
    if (match == null) return value;
    final hour24 = int.tryParse(match.group(1)!) ?? 0;
    final hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12;
    return '$hour12:${match.group(2)} ${hour24 < 12 ? 'AM' : 'PM'}';
  }

  Widget _assignedShiftCard(_GuardSnapshot data, DateTime now) {
    final upcomingOrActive =
        data.shiftAssignments.where((assignment) {
          if (assignment.status == 'CANCELLED' ||
              assignment.status == 'COMPLETED') {
            return false;
          }
          return _nextRosterOccurrenceStart(assignment, now) != null;
        }).toList()..sort(
          (a, b) => _nextRosterOccurrenceStart(a, now)!
              .compareTo(_nextRosterOccurrenceStart(b, now)!),
        );
    final active = upcomingOrActive.where((assignment) {
      final start = _nextRosterOccurrenceStart(assignment, now);
      return start != null &&
          !now.isBefore(start) &&
          now.isBefore(_shiftEndOnDate(assignment, start));
    });
    final cancelledToday = data.shiftAssignments.where((assignment) {
      final date = assignment.rosterDate;
      return assignment.status == 'CANCELLED' &&
          date != null &&
          date.year == now.year &&
          date.month == now.month &&
          date.day == now.day;
    });
    final endedToday = data.shiftAssignments.where((assignment) {
      final date = assignment.rosterDate;
      return date != null &&
          date.year == now.year &&
          date.month == now.month &&
          date.day == now.day &&
          (assignment.status == 'COMPLETED' ||
              !_shiftEnd(assignment).isAfter(now));
    });
    final upcomingToday = upcomingOrActive.where((assignment) {
      final date = _nextRosterOccurrenceStart(assignment, now);
      return date != null &&
          date.year == now.year &&
          date.month == now.month &&
          date.day == now.day;
    });
    final assignment = active.isNotEmpty
        ? active.first
        : upcomingToday.isNotEmpty
        ? upcomingToday.first
        : upcomingOrActive.isNotEmpty
        ? upcomingOrActive.first
        : cancelledToday.isNotEmpty
        ? cancelledToday.first
        : endedToday.isNotEmpty
        ? endedToday.first
        : null;

    if (assignment == null) {
      return _shiftCardSurface(
        icon: Icons.event_available_outlined,
        title: data.shiftLoadError == null ? 'Your shift' : 'Shift details',
        subtitle:
            data.shiftLoadError ?? 'No upcoming shift is assigned.',
        status: data.shiftLoadError == null
            ? 'No shift assigned'
            : 'Could not load',
        statusColor: const Color(0xFF61708A),
        child: data.shiftLoadError == null
            ? const SizedBox.shrink()
            : TextButton.icon(
                onPressed: () => _refreshShiftAssignments(),
                icon: const Icon(Icons.refresh_rounded, size: 17),
                label: const Text('Try again'),
              ),
      );
    }

    final scheduledStart = _nextRosterOccurrenceStart(assignment, now);
    final date = scheduledStart ?? assignment.rosterDate ?? now;
    final start = scheduledStart ?? _shiftDateTime(date, assignment.startTime);
    final end = _shiftEndOnDate(assignment, start);
    final isCancelled = assignment.status == 'CANCELLED';
    final isEnded = assignment.status == 'COMPLETED' || !now.isBefore(end);
    final isInProgress = !isCancelled && !isEnded && !now.isBefore(start);
    final untilStart = start.difference(now);
    final startsSoon =
        !isCancelled &&
        !isEnded &&
        !isInProgress &&
        untilStart <= const Duration(hours: 1);
    final status = isCancelled
        ? 'Shift cancelled'
        : isEnded
        ? 'Your shift has ended'
        : isInProgress
        ? 'Your shift is in progress'
        : startsSoon
        ? 'Your shift starts in ${_remainingTime(untilStart)}'
        : 'Upcoming shift';
    final statusColor = isCancelled || isEnded
        ? const Color(0xFF65728A)
        : isInProgress
        ? const Color(0xFF188754)
        : const Color(0xFF7651A1);
    final canCancel = !isCancelled && !isEnded;

    return _shiftCardSurface(
      icon: Icons.schedule_rounded,
      title: assignment.shiftName,
      subtitle:
          '${_dateLabel(date)}  ·  ${_shiftClockLabel(assignment.startTime)} – ${_shiftClockLabel(assignment.endTime)}',
      status: status,
      statusColor: statusColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Text(
            '${assignment.shiftType.replaceAll('_', ' ')}  ·  ${assignment.scheduleType.replaceAll('_', ' ')} schedule',
            style: const TextStyle(color: Colors.black, fontSize: 12),
          ),
          if (isCancelled) ...[
            const SizedBox(height: 8),
            Text(
              'Shift cancelled ${assignment.cancelledBy == widget.user.userId ? 'by you' : 'by ${assignment.cancelledByName ?? 'admin'}'}',
              style: const TextStyle(
                color: Color(0xFF9B4A0D),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          if (isCancelled && assignment.cancellationReason != null) ...[
            const SizedBox(height: 8),
            Text(
              'Reason: ${assignment.cancellationReason}',
              style: const TextStyle(color: Colors.black, fontSize: 12),
            ),
            if (assignment.cancelledAt != null)
              Text(
                'Cancelled at ${_dateTimeLabel(assignment.cancelledAt!)}',
                style: const TextStyle(color: Colors.black, fontSize: 11),
              ),
          ],
          if (canCancel) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: () => _cancelAssignedShift(assignment, data),
                icon: const Icon(Icons.emergency_outlined, size: 17),
                label: const Text('Cancel shift'),
                style: OutlinedButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _shiftCardSurface({
    required IconData icon,
    required String title,
    required String subtitle,
    required String status,
    required Color statusColor,
    required Widget child,
  }) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: const Color(0xFFE7EAF1)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x080F1A35),
          blurRadius: 10,
          offset: Offset(0, 3),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.indigo, size: 20),
            const SizedBox(width: 9),
            Expanded(
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: .10),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                status,
                style: TextStyle(
                  color: statusColor,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: 4),
            IconButton(
              tooltip: 'Refresh shift details',
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints.tightFor(width: 34, height: 34),
              onPressed: _shiftSyncRunning
                  ? null
                  : () => _refreshShiftAssignments(),
              icon: _shiftSyncRunning
                  ? const SizedBox(
                      width: 17,
                      height: 17,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh_rounded, size: 19),
            ),
          ],
        ),
        const SizedBox(height: 5),
        Text(
          subtitle,
          style: const TextStyle(color: Colors.black, fontSize: 12),
        ),
        child,
      ],
    ),
  );

  String _remainingTime(Duration duration) {
    final minutes = duration.inMinutes;
    if (minutes < 1) return 'less than a minute';
    final hours = minutes ~/ 60;
    final remainingMinutes = minutes % 60;
    if (hours == 0) return '$remainingMinutes min';
    return remainingMinutes == 0
        ? '$hours hr'
        : '$hours hr $remainingMinutes min';
  }

  String _dateLabel(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

  String _dateTimeLabel(DateTime date) {
    final local = date.toLocal();
    return '${_dateLabel(local)} ${_shiftClockLabel('${local.hour}:${local.minute.toString().padLeft(2, '0')}')}';
  }

  Future<void> _registerDelivery(_GuardSnapshot data) async {
    if (data.units.isEmpty) {
      _showError('No resident flats are available for delivery registration.');
      return;
    }
    final created = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RegisterDeliverySheet(
        user: widget.user,
        units: data.units,
        profiles: data.profiles.values.toList(),
      ),
    );
    if (created != null && mounted) {
      final delivery = _Delivery.fromJson(created);
      setState(() => data.deliveries.insert(0, delivery));
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Delivery registered.')));
    }
  }

  Future<void> _registerParcel(_GuardSnapshot data) async {
    if (data.deliveries.isEmpty) {
      _showError('Register a delivery before logging its parcel.');
      return;
    }
    final location = TextEditingController();
    String? deliveryId;
    bool saving = false;
    final created = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: _surface(
            context,
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCE2EE),
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text('Log parcel', style: _titleStyle(20)),
                  const SizedBox(height: 16),
                  _styledDropdownField<String>(
                    value: deliveryId,
                    decoration: _fieldDecoration(
                      'Related delivery',
                      Icons.local_shipping_outlined,
                    ),
                    hint: 'Select delivery',
                    items: data.deliveries
                        .map(
                          (item) => DropdownMenuItem(
                            value: item.id,
                            child: Text(
                              '${_humanize(item.type)} · ${item.courierName ?? 'Delivery'}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setSheetState(() => deliveryId = value),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: location,
                    decoration: _fieldDecoration(
                      'Storage location (optional)',
                      Icons.inventory_2_outlined,
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    height: 50,
                    child: FilledButton.icon(
                      onPressed: saving
                          ? null
                          : () async {
                              if (deliveryId == null) {
                                _showError(
                                  'Select the delivery for this parcel.',
                                );
                                return;
                              }
                              setSheetState(() => saving = true);
                              try {
                                final result = await _GuardApi.post(
                                  '/deliveries/parcels',
                                  {
                                    'deliveryId': deliveryId,
                                    'storageLocation': location.text.trim(),
                                    'receivedBy': widget.user.userId,
                                  },
                                  widget.user.accessToken,
                                );
                                if (sheetContext.mounted)
                                  Navigator.pop(sheetContext, result);
                              } on _GuardApiException catch (error) {
                                if (sheetContext.mounted)
                                  setSheetState(() => saving = false);
                                if (mounted) _showError(error.message);
                              }
                            },
                      icon: saving
                          ? const SizedBox.square(
                              dimension: 17,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.add_rounded),
                      label: Text(saving ? 'Saving parcel...' : 'Log parcel'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    location.dispose();
    if (created != null && mounted) {
      final parcel = _Parcel.fromJson(created);
      setState(() => data.parcels.insert(0, parcel));
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Parcel logged.')));
    }
  }

  Future<void> _changeDeliveryStatus(
    _Delivery delivery,
    _GuardSnapshot data,
  ) async {
    final choices = _deliveryTransitions[delivery.status] ?? const <String>[];
    final status = await _chooseStatus('Change delivery status', choices);
    if (status == null) return;
    final now = DateTime.now().toIso8601String();
    try {
      final updatedJson = await _GuardApi.patch(
        '/deliveries/${delivery.id}/status',
        {
          'status': status,
          'receivedAt': status == 'ARRIVED' ? now : null,
          'handedOverAt': status == 'PICKED_UP' || status == 'EXITED'
              ? now
              : null,
        },
        widget.user.accessToken,
      );
      if (!mounted) return;
      final updated = _Delivery.fromJson(updatedJson);
      setState(() {
        final index = data.deliveries.indexWhere(
          (item) => item.id == delivery.id,
        );
        if (index >= 0) data.deliveries[index] = updated;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Delivery marked ${_humanize(status).toLowerCase()}.'),
        ),
      );
    } on _GuardApiException catch (error) {
      if (mounted) _showError(error.message);
    }
  }

  Future<void> _changeParcelStatus(_Parcel parcel, _GuardSnapshot data) async {
    final status = await _chooseStatus('Update parcel status', const [
      'COLLECTED',
      'DAMAGED',
      'LOST',
    ]);
    if (status == null) return;
    try {
      final updatedJson = await _GuardApi.patch(
        '/deliveries/parcels/${parcel.id}/status',
        {
          'status': status,
          'collectedBy': status == 'COLLECTED' ? widget.user.userId : null,
        },
        widget.user.accessToken,
      );
      if (!mounted) return;
      final updated = _Parcel.fromJson(updatedJson);
      setState(() {
        final index = data.parcels.indexWhere((item) => item.id == parcel.id);
        if (index >= 0) data.parcels[index] = updated;
        if (status == 'COLLECTED') {
          final deliveryIndex = data.deliveries.indexWhere(
            (item) =>
                item.id == parcel.deliveryId &&
                (item.status == 'LEFT_AT_GATE' || item.status == 'OVERSTAY'),
          );
          if (deliveryIndex >= 0) {
            final old = data.deliveries[deliveryIndex];
            data.deliveries[deliveryIndex] = _Delivery(
              id: old.id,
              unitId: old.unitId,
              type: old.type,
              status: 'PICKED_UP',
              visitorProfileId: old.visitorProfileId,
              courierName: old.courierName,
              createdAt: old.createdAt,
            );
          }
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Parcel marked ${_humanize(status).toLowerCase()}.'),
        ),
      );
    } on _GuardApiException catch (error) {
      if (mounted) _showError(error.message);
    }
  }

  Future<String?> _chooseStatus(String title, List<String> choices) =>
      showModalBottomSheet<String>(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (sheetContext) => _surface(
          sheetContext,
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: _titleStyle(18)),
              const SizedBox(height: 10),
              ...choices.map(
                (choice) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_humanize(choice)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.pop(sheetContext, choice),
                ),
              ),
            ],
          ),
        ),
      );

  Widget _quickAction({
    required IconData icon,
    required Color iconBackground,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    child: InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: iconBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.ink,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              subtitle,
              style: const TextStyle(color: Colors.black, fontSize: 10),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _sectionHeading(String title, String trailing) => Row(
    children: [
      Expanded(child: Text(title, style: _titleStyle(16))),
      Text(
        trailing,
        style: const TextStyle(
          color: Colors.black,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    ],
  );

  Widget _emptyCard(String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 23),
    decoration: _cardDecoration(),
    child: Column(
      children: [
        const Icon(
          Icons.shield_moon_outlined,
          color: AppColors.muted,
          size: 30,
        ),
        const SizedBox(height: 9),
        Text(
          text,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.black, fontSize: 12),
        ),
      ],
    ),
  );

  Widget _logRow(
    IconData icon,
    String title,
    String subtitle,
    String time,
    Color color,
  ) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .1),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.black, fontSize: 10),
              ),
            ],
          ),
        ),
        const SizedBox(width: 5),
        Text(time, style: const TextStyle(color: Colors.black, fontSize: 10)),
      ],
    ),
  );

  Widget _statusBadge(String status, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      _statusLabel(status),
      style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w800),
    ),
  );

  Widget _bottomBar() => Container(
    decoration: const BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: Color(0xFFEAEFF5))),
    ),
    child: SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 7, 8, 5),
        child: Row(
          children: [
            _navItem(Icons.shield_outlined, 'Overview', 0),
            _navItem(Icons.groups_2_outlined, 'Visitors', 1),
            _navItem(Icons.receipt_long_outlined, 'Gate log', 2),
            _navItem(Icons.local_shipping_outlined, 'Deliveries', 3),
            _navItem(Icons.person_outline_rounded, 'Profile', 4),
          ],
        ),
      ),
    ),
  );

  Widget _navItem(IconData icon, String label, int index) => Expanded(
    child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _selectTab(index),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 21,
              color: _tab == index
                  ? AppColors.indigo
                  : const Color.fromARGB(255, 0, 4, 3),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: _tab == index ? FontWeight.w800 : FontWeight.w600,
                color: _tab == index
                    ? AppColors.indigo
                    : const Color.fromARGB(255, 0, 4, 3),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _errorView(Object error) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              color: AppColors.muted,
              size: 42,
            ),
            const SizedBox(height: 12),
            const Text(
              'Could not load the security dashboard',
              style: TextStyle(
                color: AppColors.ink,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 7),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.black, fontSize: 12),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _refresh,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
            TextButton(onPressed: _signOut, child: const Text('Sign out')),
          ],
        ),
      ),
    ),
  );
}

class _GuardSnapshot {
  _GuardSnapshot({
    this.societyName,
    this.societyLogoUrl,
    this.accountPhotoUrl,
    this.guardProfile,
    required this.gates,
    required this.profiles,
    required this.destinations,
    required this.passes,
    required this.events,
    required this.deliveries,
    required this.parcels,
    required this.shiftAssignments,
    this.shiftLoadError,
  });

  final String? societyName;
  final String? societyLogoUrl;
  final String? accountPhotoUrl;
  Map<String, dynamic>? guardProfile;
  final List<_Gate> gates;
  final Map<String, _Visitor> profiles;
  final List<_GuardDestination> destinations;
  final List<_GuardPass> passes;
  final List<_GateEvent> events;
  final List<_Delivery> deliveries;
  final List<_Parcel> parcels;
  List<SecurityShiftAssignment> shiftAssignments;
  String? shiftLoadError;

  List<_GuardUnit> get units {
    final byId = <String, _GuardUnit>{};
    for (final destination in destinations) {
      byId.putIfAbsent(
        destination.unitId,
        () => _GuardUnit(destination.unitId, destination.homeLabel),
      );
    }
    return byId.values.toList();
  }

  int get activeCount => passes
      .where((pass) => pass.status == 'INSIDE' || pass.status == 'OVERSTAY')
      .length;
  int get expectedCount =>
      passes.where((pass) => pass.status == 'EXPECTED').length;
  int get arrivedCount =>
      passes.where((pass) => pass.status == 'ARRIVED').length;
  List<_GuardPass> get actionablePasses => passes
      .where(
        (pass) =>
            pass.status == 'EXPECTED' ||
            pass.status == 'ARRIVED' ||
            pass.status == 'INSIDE' ||
            pass.status == 'OVERSTAY',
      )
      .toList();
  Map<String, _GuardPass> get passById => {
    for (final pass in passes) pass.id: pass,
  };
  String gateName(String id) {
    for (final gate in gates) {
      if (gate.id == id) return gate.name;
    }
    return 'Society gate';
  }

  String? destinationLabel(_GuardPass pass) {
    if (pass.unitId == null || pass.residentId == null) return null;
    for (final destination in destinations) {
      if (destination.unitId == pass.unitId &&
          destination.residentId == pass.residentId) {
        return destination.label;
      }
    }
    return null;
  }
}

class _Gate {
  const _Gate(this.id, this.name);
  final String id;
  final String name;
  factory _Gate.fromJson(Map<String, dynamic> json) =>
      _Gate('${json['id'] ?? ''}', '${json['name'] ?? 'Gate'}');
}

class _Visitor {
  const _Visitor({
    required this.id,
    required this.name,
    required this.type,
    this.phone,
  });
  final String id;
  final String name;
  final String type;
  final String? phone;
  factory _Visitor.fromJson(Map<String, dynamic> json) => _Visitor(
    id: '${json['id'] ?? ''}',
    name: '${json['name'] ?? 'Visitor'}',
    type: '${json['visitor_type'] ?? 'GUEST'}',
    phone: json['phone']?.toString(),
  );
}

class _GuardDestination {
  const _GuardDestination({
    required this.unitId,
    required this.residentId,
    required this.label,
    required this.homeLabel,
  });

  final String unitId;
  final String residentId;
  final String label;
  final String homeLabel;

  factory _GuardDestination.fromJson(Map<String, dynamic> json) {
    final tower = '${json['tower_name'] ?? ''}'.trim();
    final flat = '${json['unit_number'] ?? ''}'.trim();
    final floor = '${json['floor_name'] ?? ''}'.trim();
    final home = [
      if (tower.isNotEmpty) tower,
      if (flat.isNotEmpty) flat,
    ].join(' · ');
    final details = [
      if (floor.isNotEmpty) floor,
      if (home.isNotEmpty) home,
    ].join(' · ');
    return _GuardDestination(
      unitId: '${json['unit_id'] ?? ''}',
      residentId: '${json['resident_id'] ?? ''}',
      label:
          '${details.isEmpty ? 'Flat' : details} — ${json['resident_name'] ?? 'Resident'}',
      homeLabel: details.isEmpty ? 'Flat' : details,
    );
  }
}

class _GuardUnit {
  const _GuardUnit(this.id, this.label);
  final String id;
  final String label;
}

class _Delivery {
  const _Delivery({
    required this.id,
    required this.unitId,
    required this.type,
    required this.status,
    this.visitorProfileId,
    this.courierName,
    this.createdAt,
  });
  final String id;
  final String unitId;
  final String type;
  final String status;
  final String? visitorProfileId;
  final String? courierName;
  final DateTime? createdAt;
  factory _Delivery.fromJson(Map<String, dynamic> json) => _Delivery(
    id: '${json['id'] ?? ''}',
    unitId: '${json['unit_id'] ?? ''}',
    type: '${json['delivery_type'] ?? 'OTHER'}'.toUpperCase(),
    status: '${json['status'] ?? 'EXPECTED'}'.toUpperCase(),
    visitorProfileId: json['visitor_profile_id']?.toString(),
    courierName: json['courier_name']?.toString(),
    createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
  );
}

class _Parcel {
  const _Parcel({
    required this.id,
    required this.deliveryId,
    required this.status,
    this.parcelCode,
    this.storageLocation,
    this.createdAt,
  });
  final String id;
  final String deliveryId;
  final String status;
  final String? parcelCode;
  final String? storageLocation;
  final DateTime? createdAt;
  factory _Parcel.fromJson(Map<String, dynamic> json) => _Parcel(
    id: '${json['id'] ?? ''}',
    deliveryId: '${json['delivery_id'] ?? ''}',
    status: '${json['status'] ?? 'STORED'}'.toUpperCase(),
    parcelCode: json['parcel_code']?.toString(),
    storageLocation: json['storage_location']?.toString(),
    createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
  );
}

class _GuardDeliverySnapshot {
  const _GuardDeliverySnapshot({
    required this.deliveries,
    required this.parcels,
  });

  final List<_Delivery> deliveries;
  final List<_Parcel> parcels;
}

class _GuardPass {
  const _GuardPass({
    required this.id,
    required this.gateId,
    required this.profileId,
    required this.passNo,
    required this.status,
    required this.createdAt,
    this.unitId,
    this.residentId,
    this.residentDecision = 'NOT_REQUIRED',
  });
  final String id;
  final String gateId;
  final String profileId;
  final String passNo;
  final String status;
  final DateTime? createdAt;
  final String? unitId;
  final String? residentId;
  final String residentDecision;
  factory _GuardPass.fromJson(Map<String, dynamic> json) => _GuardPass(
    id: '${json['id'] ?? ''}',
    gateId: '${json['gate_id'] ?? ''}',
    profileId: '${json['visitor_profile_id'] ?? ''}',
    passNo: '${json['pass_no'] ?? '—'}',
    status: '${json['status'] ?? 'EXPECTED'}'.toUpperCase(),
    createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
    unitId: json['unit_id']?.toString(),
    residentId: json['resident_id']?.toString(),
    residentDecision: '${json['resident_decision'] ?? 'NOT_REQUIRED'}'
        .toUpperCase(),
  );
}

class _GateEvent {
  const _GateEvent({
    required this.type,
    required this.passId,
    required this.gateId,
    required this.at,
  });
  final String type;
  final String passId;
  final String gateId;
  final DateTime? at;
  factory _GateEvent.fromJson(Map<String, dynamic> json) => _GateEvent(
    type: '${json['event_type'] ?? ''}'.toUpperCase(),
    passId: '${json['visitor_pass_id'] ?? ''}',
    gateId: '${json['gate_id'] ?? ''}',
    at: DateTime.tryParse('${json['event_at'] ?? ''}'),
  );
}

class _RegisterDeliverySheet extends StatefulWidget {
  const _RegisterDeliverySheet({
    required this.user,
    required this.units,
    required this.profiles,
  });

  final AuthenticatedUser user;
  final List<_GuardUnit> units;
  final List<_Visitor> profiles;

  @override
  State<_RegisterDeliverySheet> createState() => _RegisterDeliverySheetState();
}

class _RegisterDeliverySheetState extends State<_RegisterDeliverySheet> {
  final _formKey = GlobalKey<FormState>();
  final _courier = TextEditingController();
  String? _unitId;
  String _visitorId = '';
  String _deliveryType = 'COURIER';
  bool _saving = false;

  @override
  void dispose() {
    _courier.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final result = await _GuardApi.post('/deliveries', {
        'societyId': widget.user.societyId,
        'unitId': _unitId,
        'visitorProfileId': _visitorId.isEmpty ? null : _visitorId,
        'deliveryType': _deliveryType,
        'courierName': _courier.text.trim(),
      }, widget.user.accessToken);
      if (mounted) Navigator.of(context).pop(result);
    } on _GuardApiException catch (error) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
    child: _surface(
      context,
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCE2EE),
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text('Register delivery', style: _titleStyle(20)),
              const SizedBox(height: 16),
              _styledDropdownField<String>(
                value: _unitId,
                decoration: _fieldDecoration('Unit', Icons.apartment_rounded),
                hint: 'Select destination flat',
                validator: (value) => value == null ? 'Select a flat.' : null,
                items: widget.units
                    .map(
                      (unit) => DropdownMenuItem(
                        value: unit.id,
                        child: Text(
                          unit.label,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _unitId = value),
              ),
              const SizedBox(height: 12),
              _styledDropdownField<String>(
                value: _visitorId,
                decoration: _fieldDecoration(
                  'Visitor profile (optional)',
                  Icons.person_outline_rounded,
                ),
                items: [
                  const DropdownMenuItem(
                    value: '',
                    child: Text('No linked visitor'),
                  ),
                  ...widget.profiles.map(
                    (visitor) => DropdownMenuItem(
                      value: visitor.id,
                      child: Text(
                        visitor.name,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() => _visitorId = value ?? ''),
              ),
              const SizedBox(height: 12),
              _styledDropdownField<String>(
                value: _deliveryType,
                decoration: _fieldDecoration(
                  'Delivery type',
                  Icons.category_outlined,
                ),
                items: const [
                  DropdownMenuItem(value: 'COURIER', child: Text('Courier')),
                  DropdownMenuItem(value: 'FOOD', child: Text('Food')),
                  DropdownMenuItem(
                    value: 'E_COMMERCE',
                    child: Text('E-commerce'),
                  ),
                  DropdownMenuItem(value: 'GROCERY', child: Text('Grocery')),
                  DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                ],
                onChanged: (value) =>
                    setState(() => _deliveryType = value ?? 'COURIER'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _courier,
                decoration: _fieldDecoration(
                  'Courier / source (optional)',
                  Icons.local_shipping_outlined,
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                height: 50,
                child: FilledButton.icon(
                  onPressed: _saving ? null : _submit,
                  icon: _saving
                      ? const SizedBox.square(
                          dimension: 17,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.add_rounded),
                  label: Text(_saving ? 'Registering...' : 'Register delivery'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _GuardNotification {
  const _GuardNotification({
    required this.id,
    required this.title,
    required this.message,
    this.createdAt,
  });

  final String id;
  final String title;
  final String message;
  final DateTime? createdAt;

  factory _GuardNotification.fromJson(Map<String, dynamic> json) =>
      _GuardNotification(
        id: '${json['id'] ?? ''}',
        title: '${json['title'] ?? json['subject'] ?? 'Notification'}',
        message: '${json['message'] ?? ''}',
        createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
      );
}

class _GuardApi {
  static Future<Map<String, dynamic>> loadGuardProfile(
    AuthenticatedUser user,
  ) => _getObject('/gates/guards/me', user.accessToken);

  static Future<_GuardDeliverySnapshot> loadDeliveries(
    AuthenticatedUser user,
  ) async {
    final societyId = user.societyId;
    if (societyId == null || societyId.isEmpty) {
      throw const _GuardApiException(
        'This guard account is not linked to a society. Ask an administrator to check the staff assignment.',
      );
    }
    final results = await Future.wait([
      _get('/deliveries', user.accessToken, {'societyId': societyId}),
      _get('/deliveries/parcels', user.accessToken, {'societyId': societyId}),
    ]);
    return _GuardDeliverySnapshot(
      deliveries: results[0].map(_Delivery.fromJson).toList(),
      parcels: results[1].map(_Parcel.fromJson).toList(),
    );
  }

  static Future<_GuardSnapshot> load(AuthenticatedUser user) async {
    final societyId = user.societyId;
    if (societyId == null || societyId.isEmpty) {
      throw const _GuardApiException(
        'This guard account is not linked to a society. Ask an administrator to check the staff assignment.',
      );
    }
    final shiftAssignmentsFuture = loadShiftAssignments(user);
    final gatesJson = await _get('/gates', user.accessToken);
    final gates = gatesJson
        .map(_Gate.fromJson)
        .where((gate) => gate.id.isNotEmpty)
        .toList();
    final profilesFuture = _get('/visitors/profiles', user.accessToken, {
      'societyId': societyId,
    });
    final destinationsFuture = _get('/visitors/destinations', user.accessToken);
    final eventsFuture = _get('/visitors/gate-events', user.accessToken, {
      'societyId': societyId,
    });
    final deliveriesFuture = _get('/deliveries', user.accessToken, {
      'societyId': societyId,
    });
    final parcelsFuture = _get('/deliveries/parcels', user.accessToken, {
      'societyId': societyId,
    });
    final passFutures = gates.map(
      (gate) => _get('/visitors/passes', user.accessToken, {'gateId': gate.id}),
    );
    final results = await Future.wait([
      profilesFuture,
      destinationsFuture,
      eventsFuture,
      deliveriesFuture,
      parcelsFuture,
      ...passFutures,
    ]);
    final profiles = <String, _Visitor>{
      for (final row in results[0])
        if ('${row['id'] ?? ''}'.isNotEmpty)
          '${row['id']}': _Visitor.fromJson(row),
    };
    final destinations = results[1]
        .map(_GuardDestination.fromJson)
        .where((item) => item.unitId.isNotEmpty && item.residentId.isNotEmpty)
        .toList();
    final events = results[2].map(_GateEvent.fromJson).toList();
    final deliveries = results[3].map(_Delivery.fromJson).toList();
    final parcels = results[4].map(_Parcel.fromJson).toList();
    List<SecurityShiftAssignment> shiftAssignments;
    String? shiftLoadError;
    try {
      shiftAssignments = await shiftAssignmentsFuture;
    } on _GuardApiException catch (error) {
      shiftAssignments = const [];
      shiftLoadError = error.message;
    } catch (_) {
      shiftAssignments = const [];
      shiftLoadError = 'Could not load your shift details.';
    }
    final passes = results
        .skip(5)
        .expand((rows) => rows)
        .map(_GuardPass.fromJson)
        .toList();
    passes.sort(
      (a, b) => (b.createdAt ?? DateTime(1970)).compareTo(
        a.createdAt ?? DateTime(1970),
      ),
    );
    events.sort(
      (a, b) => (b.at ?? DateTime(1970)).compareTo(a.at ?? DateTime(1970)),
    );
    String? societyName;
    String? societyLogoUrl;
    String? accountPhotoUrl;
    Map<String, dynamic>? guardProfile;
    try {
      guardProfile = await loadGuardProfile(user);
    } catch (_) {
      // Continue to show the signed-in account if staff details are unavailable.
    }
    try {
      final dashboard = await _getObject(
        '/resident-dashboard',
        user.accessToken,
      );
      final society = dashboard['society'];
      final account = dashboard['account'];
      if (account is Map<String, dynamic>) {
        accountPhotoUrl = _imageUrl(account['photoUrl']);
      }
      if (society is Map<String, dynamic>) {
        societyName = _optionalString(society['name']);
        societyLogoUrl = _imageUrl(society['logoUrl']);
      }
    } catch (_) {
      // Society branding is optional; keep the dashboard usable if it is unavailable.
    }
    return _GuardSnapshot(
      societyName: societyName,
      societyLogoUrl: societyLogoUrl,
      accountPhotoUrl: accountPhotoUrl,
      guardProfile: guardProfile,
      gates: gates,
      profiles: profiles,
      destinations: destinations,
      passes: passes,
      events: events,
      deliveries: deliveries,
      parcels: parcels,
      shiftAssignments: shiftAssignments,
      shiftLoadError: shiftLoadError,
    );
  }

  static Future<List<_GuardPass>> loadPasses(
    AuthenticatedUser user,
    List<_Gate> gates,
  ) async {
    final responses = await Future.wait(
      gates.map(
        (gate) =>
            _get('/visitors/passes', user.accessToken, {'gateId': gate.id}),
      ),
    );
    return responses.expand((rows) => rows).map(_GuardPass.fromJson).toList();
  }

  static Future<List<SecurityShiftAssignment>> loadShiftAssignments(
    AuthenticatedUser user,
  ) async {
    final societyId = user.societyId;
    if (societyId == null || societyId.isEmpty) {
      throw const _GuardApiException(
        'This security account is not linked to a society.',
      );
    }

    final guard = await _getObject('/gates/guards/me', user.accessToken);
    final staffId = (guard['staff_id'] ?? guard['staffId'])?.toString();
    if (staffId == null || staffId.isEmpty) {
      throw const _GuardApiException(
        'This login is not linked to a security staff profile. Ask your administrator to check the staff account.',
      );
    }

    final responses = await Future.wait([
      _get('/rosters/staff/${Uri.encodeComponent(staffId)}', user.accessToken),
      _get('/shifts', user.accessToken, {'societyId': societyId}),
    ]);
    final shiftsById = <String, Map<String, dynamic>>{
      for (final shift in responses[1])
        if ((shift['id'] ?? '').toString().isNotEmpty)
          (shift['id'] ?? '').toString(): shift,
    };
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final assignments = <SecurityShiftAssignment>[];
    for (final roster in responses[0]) {
      final dateValue = (roster['rosterDate'] ?? roster['roster_date'])
          ?.toString();
      final rosterDate = dateValue == null
          ? null
          : DateTime.tryParse(dateValue);
      final status = (roster['status'] ?? '').toString().toUpperCase();
      final scheduleType =
          (roster['rosterType'] ?? roster['roster_type'] ?? 'DAILY')
              .toString()
              .toUpperCase();
      final rosterEndValue =
          (roster['rosterEndDate'] ?? roster['roster_end_date'])
          ?.toString();
      final rosterEndDate = rosterEndValue == null
          ? scheduleType == 'DAILY'
                ? null
                : rosterDate
          : DateTime.tryParse(rosterEndValue);
      if (rosterDate == null ||
          (rosterEndDate != null &&
              DateTime(rosterEndDate.year, rosterEndDate.month, rosterEndDate.day)
                  .isBefore(todayDate.subtract(const Duration(days: 1))))) {
        continue;
      }
      final shiftId = (roster['shiftId'] ?? roster['shift_id'])?.toString();
      final shift = shiftId == null ? null : shiftsById[shiftId];
      if (shift == null) continue;
      final isOvernight =
          shift['isOvernight'] == true ||
          shift['is_overnight'] == true ||
          '${shift['isOvernight'] ?? shift['is_overnight'] ?? ''}'
                  .toLowerCase() ==
              'true';
      final startValue = (shift['startTime'] ?? shift['start_time'] ?? '')
          .toString();
      final endValue = (shift['endTime'] ?? shift['end_time'] ?? '').toString();
      final timeParts = RegExp(r'^(\d{1,2}):(\d{2})');
      DateTime scheduleTime(DateTime date, String value) {
        final match = timeParts.firstMatch(value.trim());
        if (match == null) return date;
        return DateTime(
          date.year,
          date.month,
          date.day,
          int.tryParse(match.group(1)!) ?? 0,
          int.tryParse(match.group(2)!) ?? 0,
        );
      }

      final scheduleStart = scheduleTime(rosterDate, startValue);
      var scheduleEnd = scheduleTime(rosterDate, endValue);
      final isOvernightShift =
          isOvernight || !scheduleEnd.isAfter(scheduleStart);
      if (isOvernightShift) {
        scheduleEnd = scheduleEnd.add(const Duration(days: 1));
      }
      final isYesterdayRoster = DateTime(
        rosterDate.year,
        rosterDate.month,
        rosterDate.day,
      ).isBefore(todayDate);
      if (scheduleType == 'DAILY' &&
          isYesterdayRoster &&
          (status == 'CANCELLED' || !DateTime.now().isBefore(scheduleEnd))) {
        continue;
      }
      assignments.add(
        SecurityShiftAssignment(
          rosterId: (roster['id'] ?? '').toString(),
          shiftName: (shift['shiftName'] ?? shift['shift_name'] ?? 'Shift')
              .toString(),
          shiftType: (shift['shiftType'] ?? shift['shift_type'] ?? '')
              .toString(),
          scheduleType: scheduleType,
          startTime: startValue,
          endTime: endValue,
          breakMinutes:
              int.tryParse(
                '${shift['breakMinutes'] ?? shift['break_minutes'] ?? 0}',
              ) ??
              0,
          rosterDate: rosterDate,
          rosterEndDate: rosterEndDate,
          status: status.isEmpty ? 'SCHEDULED' : status,
          isOvernight: isOvernightShift,
          cancellationReason: _optionalString(
            roster['cancellationReason'] ?? roster['cancellation_reason'],
          ),
          cancelledAt: DateTime.tryParse(
            '${roster['cancelledAt'] ?? roster['cancelled_at'] ?? ''}',
          ),
          cancelledBy: (roster['cancelledBy'] ?? roster['cancelled_by'])
              ?.toString(),
          cancelledByName: _optionalString(
            roster['cancelledByName'] ?? roster['cancelled_by_name'],
          ),
          remarks: (roster['remarks'] ?? '').toString(),
        ),
      );
    }
    assignments.sort((a, b) => a.rosterDate!.compareTo(b.rosterDate!));
    return assignments.take(20).toList(growable: false);
  }

  static Future<List<_GuardNotification>> loadNotifications(
    AuthenticatedUser user,
  ) async =>
      (await _get('/gates/notifications/me', user.accessToken))
          .map(_GuardNotification.fromJson)
          .where((notification) => notification.id.isNotEmpty)
          .toList(growable: false);

  static Future<void> markNotificationRead(
    AuthenticatedUser user,
    String id,
  ) async {
    await patch(
      '/gates/notifications/${Uri.encodeComponent(id)}/read',
      const {},
      user.accessToken,
    );
  }

  static Future<List<Map<String, dynamic>>> _get(
    String path,
    String token, [
    Map<String, String>? query,
  ]) async {
    try {
      final useLegacyApi = path == '/shifts' ||
          path.startsWith('/rosters/') ||
          path.startsWith('/staff-attendance');
      final baseUrl = useLegacyApi
          ? _apiBaseUrl.replaceFirst(RegExp(r'/api/v1/?$'), '/api')
          : _apiBaseUrl;
      final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
      final response = await http
          .get(
            uri,
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw _GuardApiException(
          body['message']?.toString() ?? 'Could not load security data.',
        );
      }
      final data = body['data'];
      if (data is! List) return const [];
      return data.whereType<Map<String, dynamic>>().toList();
    } on _GuardApiException {
      rethrow;
    } on http.ClientException {
      throw const _GuardApiException(
        'Cannot reach the server. Check the backend and API address.',
      );
    } on TimeoutException {
      throw const _GuardApiException(
        'The server took too long to respond. Pull down to try again.',
      );
    } on FormatException {
      throw const _GuardApiException(
        'The server returned invalid security dashboard data.',
      );
    }
  }

  static Future<Map<String, dynamic>> _getObject(
    String path,
    String token,
  ) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_apiBaseUrl$path'),
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw _GuardApiException(
          body['message']?.toString() ?? 'Could not load society details.',
        );
      }
      final data = body['data'];
      return data is Map<String, dynamic> ? data : const {};
    } on _GuardApiException {
      rethrow;
    } on http.ClientException {
      throw const _GuardApiException(
        'Cannot reach the society details service.',
      );
    } on TimeoutException {
      throw const _GuardApiException('Society details request timed out.');
    } on FormatException {
      throw const _GuardApiException('Society details response was invalid.');
    }
  }

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> payload,
    String token,
  ) => _send('POST', path, payload, token);
  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> payload,
    String token,
  ) => _send('PATCH', path, payload, token);

  static Future<Map<String, dynamic>> _send(
    String method,
    String path,
    Map<String, dynamic> payload,
    String token,
  ) async {
    try {
      final useLegacyApi = path.startsWith('/rosters/') ||
          path.startsWith('/shifts') ||
          path.startsWith('/staff-attendance');
      final baseUrl = useLegacyApi
          ? _apiBaseUrl.replaceFirst(RegExp(r'/api/v1/?$'), '/api')
          : _apiBaseUrl;
      final uri = Uri.parse('$baseUrl$path');
      final response =
          await (method == 'POST'
                  ? http.post(
                      uri,
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer $token',
                      },
                      body: jsonEncode(payload),
                    )
                  : http.patch(
                      uri,
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer $token',
                      },
                      body: jsonEncode(payload),
                    ))
              .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw _GuardApiException(
          body['message']?.toString() ?? 'The request could not be completed.',
        );
      }
      return body['data'] is Map<String, dynamic>
          ? body['data'] as Map<String, dynamic>
          : const {};
    } on _GuardApiException {
      rethrow;
    } on http.ClientException {
      throw const _GuardApiException(
        'Cannot reach the server. Check the backend and try again.',
      );
    } on TimeoutException {
      throw const _GuardApiException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const _GuardApiException(
        'The server returned an invalid response.',
      );
    }
  }
}

class _GuardApiException implements Exception {
  const _GuardApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

Widget _surface(
  BuildContext context, {
  required Widget child,
  EdgeInsetsGeometry padding = const EdgeInsets.all(18),
}) => Container(
  width: double.infinity,
  padding: padding,
  decoration: BoxDecoration(
    color: Theme.of(context).colorScheme.surface,
    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
  ),
  child: child,
);

Widget _styledDropdownField<T>({
  required T? value,
  required InputDecoration decoration,
  required List<DropdownMenuItem<T>> items,
  required ValueChanged<T?> onChanged,
  String? hint,
  String? Function(T?)? validator,
}) => _StyledDropdownField<T>(
  key: ValueKey<String>(decoration.labelText ?? hint ?? 'dropdown'),
  value: value,
  decoration: decoration,
  items: items,
  onChanged: onChanged,
  hint: hint,
  validator: validator,
);

class _StyledDropdownField<T> extends StatefulWidget {
  const _StyledDropdownField({
    super.key,
    required this.value,
    required this.decoration,
    required this.items,
    required this.onChanged,
    this.hint,
    this.validator,
  });

  final T? value;
  final InputDecoration decoration;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? hint;
  final String? Function(T?)? validator;

  @override
  State<_StyledDropdownField<T>> createState() =>
      _StyledDropdownFieldState<T>();
}

class _StyledDropdownFieldState<T> extends State<_StyledDropdownField<T>> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) => FormField<T>(
    initialValue: widget.value,
    validator: widget.validator,
    builder: (field) {
      DropdownMenuItem<T>? selectedItem;
      for (final item in widget.items) {
        if (item.value == field.value) {
          selectedItem = item;
          break;
        }
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: widget.items.isEmpty
                  ? null
                  : () => setState(() => _expanded = !_expanded),
              child: InputDecorator(
                decoration: widget.decoration.copyWith(
                  errorText: field.errorText,
                  suffixIcon: Icon(
                    _expanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: const Color(0xFF76519A),
                  ),
                ),
                child: DefaultTextStyle.merge(
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: selectedItem == null
                        ? AppColors.muted
                        : AppColors.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  child: selectedItem?.child ?? Text(widget.hint ?? ''),
                ),
              ),
            ),
          ),
          if (_expanded) ...[
            const SizedBox(height: 6),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 6),
              constraints: const BoxConstraints(maxHeight: 240),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE8E8EE)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1A000000),
                    blurRadius: 12,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                  for (var index = 0; index < widget.items.length; index++) ...[
                    if (index > 0)
                      const Divider(height: 1, indent: 12, endIndent: 12),
                    ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: 50),
                      child: Material(
                        color: widget.items[index].value == field.value
                            ? const Color(0xFFF2F0FF)
                            : Colors.white,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            final selected = widget.items[index].value;
                            field.didChange(selected);
                            setState(() => _expanded = false);
                            widget.onChanged(selected);
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            child: Row(
                              children: [
                                Expanded(
                                  child: DefaultTextStyle.merge(
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: widget.items[index].value == field.value
                                          ? const Color(0xFF76519A)
                                          : AppColors.ink,
                                      fontSize: 14,
                                      fontWeight: widget.items[index].value == field.value
                                          ? FontWeight.w700
                                          : FontWeight.w500,
                                    ),
                                    child: widget.items[index].child,
                                  ),
                                ),
                                if (widget.items[index].value == field.value) ...[
                                  const SizedBox(width: 8),
                                  const Icon(Icons.check_rounded,
                                      size: 18, color: Color(0xFF76519A)),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      );
    },
  );
}

InputDecoration _fieldDecoration(String label, IconData icon) =>
    InputDecoration(
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
        borderSide: const BorderSide(color: AppColors.indigo, width: 1.5),
      ),
    );

BoxDecoration _cardDecoration() => BoxDecoration(
  color: Colors.white,
  borderRadius: BorderRadius.circular(18),
  border: Border.all(color: const Color(0xFFEBEFF5)),
  boxShadow: const [
    BoxShadow(color: Color(0x080F1A35), blurRadius: 14, offset: Offset(0, 5)),
  ],
);

TextStyle _titleStyle(double size) => TextStyle(
  color: AppColors.ink,
  fontSize: size,
  fontWeight: FontWeight.w800,
  letterSpacing: -.3,
);
String _firstName(String value) {
  final parts = value.trim().split(RegExp(r'\s+'));
  return parts.isEmpty || parts.first.isEmpty ? 'Guard' : parts.first;
}

String _initials(String value) => value
    .trim()
    .split(RegExp(r'\s+'))
    .where((part) => part.isNotEmpty)
    .take(2)
    .map((part) => part[0].toUpperCase())
    .join();
String _visitorName(_GuardPass pass, _GuardSnapshot data) =>
    data.profiles[pass.profileId]?.name ?? 'Visitor';
String _visitorTypeLabel(_GuardPass pass, _GuardSnapshot data) =>
    switch (data.profiles[pass.profileId]?.type.toUpperCase()) {
      'GUEST' => 'Guest',
      'DELIVERY_PERSON' => 'Delivery',
      'SERVICE_PROVIDER' => 'Service provider',
      'STAFF' => 'Staff',
      'MAID' => 'Maid',
      'OTHER' => 'Other visitor',
      _ => pass.status == 'OVERSTAY' ? 'Overstay' : 'Visitor',
    };
String _statusLabel(String status) => switch (status) {
  'ARRIVED' => 'At gate',
  'EXPECTED' => 'Expected',
  'INSIDE' => 'Inside',
  'OVERSTAY' => 'Overstay',
  'EXITED' => 'Exited',
  'CANCELLED' => 'Cancelled',
  _ => _humanize(status),
};
Color _statusColor(String status) => switch (status) {
  'ARRIVED' => _residentActionOrange,
  'EXPECTED' => _residentActionBlue,
  'INSIDE' => _residentActionGreen,
  'OVERSTAY' => const Color(0xFFD65A54),
  'EXITED' => const Color(0xFF67758E),
  _ => AppColors.muted,
};

String _humanize(String value) => value
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
          word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}',
    )
    .join(' ');

Color _deliveryStatusColor(String status) => switch (status) {
  'EXPECTED' => _residentActionBlue,
  'ARRIVED' => _residentActionOrange,
  'INSIDE' => _residentActionGreen,
  'LEFT_AT_GATE' => _residentActionBlue,
  'PICKED_UP' => _residentActionGreen,
  'EXITED' => const Color(0xFF67758E),
  'OVERSTAY' => const Color(0xFFD65A54),
  'CANCELLED' => const Color(0xFFD65A54),
  _ => AppColors.muted,
};

Color _parcelStatusColor(String status) => switch (status) {
  'STORED' => _residentActionBlue,
  'COLLECTED' => _residentActionGreen,
  'DAMAGED' => _residentActionOrange,
  'LOST' => const Color(0xFFD65A54),
  _ => AppColors.muted,
};

String _formatDate(DateTime? date) {
  if (date == null) return 'Time unavailable';
  final local = date.toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final period = local.hour < 12 ? 'AM' : 'PM';
  return '${local.day}/${local.month}  $hour:$minute $period';
}
