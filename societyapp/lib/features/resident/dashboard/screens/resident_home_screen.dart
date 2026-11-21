import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../../amenities/screens/resident_amenities_screen.dart';
import '../../complaints/data/resident_complaints_api.dart';
import '../../complaints/screens/resident_complaints_screen.dart';
import '../../bills/screens/resident_finance_screen.dart';
import '../data/resident_delivery_notifications_api.dart';
import '../data/resident_emergency_contacts_api.dart';
import '../data/resident_notifications_api.dart';
import '../../visitors/data/resident_visitors_api.dart';
import '../../visitors/screens/resident_visitors_screen.dart';
import '../data/resident_dashboard_api.dart';
import '../../profile/screens/resident_profile_screen.dart';
import '../../widgets/resident_back_button.dart';

const _configuredResidentApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _residentApiBaseUrl => _configuredResidentApiBaseUrl.isNotEmpty
    ? _configuredResidentApiBaseUrl
    : kIsWeb
    ? 'http://localhost:5000/api/v1'
    : 'http://localhost:5000/api/v1';

enum _ResidentSection {
  home,
  payments,
  amenities,
  visitors,
  complaints,
  profile,
}

class ResidentHomeScreen extends StatefulWidget {
  const ResidentHomeScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentHomeScreen> createState() => _ResidentHomeScreenState();
}

class _ResidentHomeScreenState extends State<ResidentHomeScreen>
    with WidgetsBindingObserver {
  int _selectedTab = 0;
  _ResidentSection _activeSection = _ResidentSection.home;
  final List<_ResidentSection> _sectionHistory = [];
  late Future<ResidentDashboardData> _dashboardFuture;
  late Future<List<ResidentComplaint>> _complaintsFuture;
  ResidentDashboardData? _dashboardData;
  String? _updatedResidentName;
  Timer? _complaintsRefreshTimer;
  Timer? _visitorRequestsRefreshTimer;
  Timer? _deliveryNotificationsRefreshTimer;
  Timer? _noticeExpiryTimer;
  Timer? _residentEventsReconnectTimer;
  http.Client? _residentEventsClient;
  StreamSubscription<String>? _residentEventsSubscription;
  Duration _residentEventsRetryDelay = const Duration(seconds: 2);
  bool _hadResidentEventsConnection = false;
  bool _refreshingDashboard = false;
  bool _dashboardRefreshQueued = false;
  bool _refreshingComplaints = false;
  bool _refreshingVisitorRequests = false;
  bool _refreshingDeliveryNotifications = false;
  bool _refreshingNotifications = false;
  final Set<String> _decidingVisitorRequestIds = {};
  List<ResidentVisitorRequest> _visitorRequests = const [];
  List<ResidentDeliveryNotification> _deliveryNotifications = const [];
  List<ResidentAppNotification> _notifications = const [];
  AuthenticatedUser? _updatedUser;

  String get _residentDisplayName => _updatedResidentName ?? widget.user.name;
  String get _firstName => _residentDisplayName.trim().split(' ').first;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _dashboardFuture = ResidentDashboardApi.load(widget.user.accessToken)
        .then((data) {
          _dashboardData = data;
          _scheduleNoticeExpiry(data);
          return data;
        });
    _complaintsFuture = ResidentComplaintsApi.listComplaints(
      widget.user.accessToken,
    );
    _complaintsRefreshTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) => _refreshComplaintsInBackground(),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      unawaited(_refreshVisitorRequests());
      unawaited(_refreshDeliveryNotifications());
      unawaited(_refreshNotifications());
      _connectResidentEvents();
    });
    _visitorRequestsRefreshTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) => _refreshVisitorRequests(),
    );
    _deliveryNotificationsRefreshTimer = Timer.periodic(
      const Duration(seconds: 3),
      (_) => _refreshDeliveryNotifications(),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _restartResidentEvents();
      unawaited(_refreshDashboard().catchError((_) {}));
      _refreshComplaintsInBackground();
      _refreshVisitorRequests();
      _refreshDeliveryNotifications();
      _refreshNotifications();
    }
  }

  @override
  void dispose() {
    _complaintsRefreshTimer?.cancel();
    _visitorRequestsRefreshTimer?.cancel();
    _deliveryNotificationsRefreshTimer?.cancel();
    _noticeExpiryTimer?.cancel();
    _residentEventsReconnectTimer?.cancel();
    _residentEventsSubscription?.cancel();
    _residentEventsClient?.close();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  void _restartResidentEvents() {
    _residentEventsReconnectTimer?.cancel();
    _residentEventsReconnectTimer = null;
    _residentEventsSubscription?.cancel();
    _residentEventsSubscription = null;
    _residentEventsClient?.close();
    _residentEventsClient = null;
    _connectResidentEvents();
  }

  Future<void> _connectResidentEvents() async {
    if (!mounted || _residentEventsSubscription != null) return;
    final client = http.Client();
    try {
      final request = http.Request(
        'GET',
        Uri.parse('$_residentApiBaseUrl/resident-dashboard/events'),
      )..headers['Authorization'] = 'Bearer ${widget.user.accessToken}';
      final response = await client
          .send(request)
          .timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) {
        client.close();
        _scheduleResidentEventsReconnect();
        return;
      }
      if (!mounted) {
        client.close();
        return;
      }
      final recoveringConnection = _hadResidentEventsConnection;
      _hadResidentEventsConnection = true;
      _residentEventsClient = client;
      _residentEventsRetryDelay = const Duration(seconds: 2);
      _residentEventsSubscription = response.stream
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen(
            (line) {
              if (!line.startsWith('data:')) return;
              try {
                final event = jsonDecode(line.substring(5).trim());
                if (event is Map &&
                    (event['type'] == 'resident-updated' ||
                        event['type'] == 'notice-published')) {
                  unawaited(_refreshNotifications());
                  unawaited(_refreshDashboard().catchError((_) {}));
                }
              } catch (_) {
                // Ignore malformed stream events and keep the connection open.
              }
            },
            onError: (_) => _onResidentEventsDisconnected(client),
            onDone: () => _onResidentEventsDisconnected(client),
            cancelOnError: true,
          );
      if (recoveringConnection) {
        unawaited(_refreshNotifications());
        unawaited(_refreshDashboard().catchError((_) {}));
      }
    } catch (_) {
      client.close();
      _scheduleResidentEventsReconnect();
    }
  }

  void _onResidentEventsDisconnected(http.Client client) {
    if (!identical(client, _residentEventsClient)) return;
    _residentEventsSubscription = null;
    _residentEventsClient = null;
    client.close();
    _scheduleResidentEventsReconnect();
  }

  void _scheduleResidentEventsReconnect() {
    if (!mounted || (_residentEventsReconnectTimer?.isActive ?? false)) return;
    final delay = _residentEventsRetryDelay;
    _residentEventsRetryDelay = Duration(
      seconds: (_residentEventsRetryDelay.inSeconds * 2).clamp(2, 60).toInt(),
    );
    _residentEventsReconnectTimer = Timer(delay, () {
      _residentEventsReconnectTimer = null;
      _connectResidentEvents();
    });
  }

  Future<void> _refreshDashboard() async {
    if (_refreshingDashboard) {
      _dashboardRefreshQueued = true;
      return;
    }
    _refreshingDashboard = true;
    try {
      final data = await ResidentDashboardApi.load(widget.user.accessToken);
      if (mounted) {
        final refreshedData = _mergeLocalBookings(data);
        _scheduleNoticeExpiry(refreshedData);
        setState(() {
          _dashboardData = refreshedData;
          _dashboardFuture = Future.value(refreshedData);
        });
      }
    } finally {
      _refreshingDashboard = false;
      if (_dashboardRefreshQueued && mounted) {
        _dashboardRefreshQueued = false;
        unawaited(_refreshDashboard().catchError((_) {}));
      }
    }
  }

  void _scheduleNoticeExpiry(ResidentDashboardData dashboard) {
    _noticeExpiryTimer?.cancel();
    final now = DateTime.now();
    final upcomingExpiries = dashboard.notices
        .map((notice) => notice.expiresAt)
        .whereType<DateTime>()
        .where((expiry) => expiry.isAfter(now))
        .toList()
      ..sort();
    if (upcomingExpiries.isEmpty) return;

    final delay = upcomingExpiries.first.difference(now);
    _noticeExpiryTimer = Timer(delay, () {
      if (!mounted) return;
      setState(() {});
      _scheduleNoticeExpiry(dashboard);
    });
  }

  List<ResidentNotice> _visibleNotices(ResidentDashboardData dashboard) {
    final now = DateTime.now();
    return dashboard.notices.where((notice) {
      if (notice.status.toUpperCase() == 'EXPIRED') return false;
      final endsAt = notice.expiresAt;
      return endsAt == null || endsAt.isAfter(now);
    }).toList(growable: false);
  }

  Future<void> _refreshComplaintsInBackground() async {
    if (!mounted ||
        _refreshingComplaints ||
        _selectedTab != 0 ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ModalRoute.of(context)?.isCurrent == false) {
      return;
    }
    _refreshingComplaints = true;
    try {
      final complaints = await ResidentComplaintsApi.listComplaints(
        widget.user.accessToken,
      );
      if (mounted) {
        setState(() {
          _complaintsFuture = Future.value(complaints);
        });
      }
    } catch (_) {
      // Keep the last successful complaint statuses visible during network errors.
    } finally {
      _refreshingComplaints = false;
    }
  }

  Future<void> _refreshVisitorRequests() async {
    if (!mounted ||
        _refreshingVisitorRequests ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ModalRoute.of(context)?.isCurrent == false) {
      return;
    }
    _refreshingVisitorRequests = true;
    try {
      final requests = await ResidentVisitorsApi.listPending(
        widget.user.accessToken,
      );
      if (!mounted) return;
      setState(() => _visitorRequests = requests);
    } catch (_) {
      // Leave any already visible gate requests on screen during network errors.
    } finally {
      _refreshingVisitorRequests = false;
    }
  }

  Future<void> _refreshDeliveryNotifications() async {
    if (!mounted ||
        _refreshingDeliveryNotifications ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ModalRoute.of(context)?.isCurrent == false) {
      return;
    }
    _refreshingDeliveryNotifications = true;
    try {
      final notifications = await ResidentDeliveryNotificationsApi.list(
        widget.user.accessToken,
      );
      if (mounted) setState(() => _deliveryNotifications = notifications);
    } catch (_) {
      // Keep the last visible delivery alerts when the network is unavailable.
    } finally {
      _refreshingDeliveryNotifications = false;
    }
  }

  Future<void> _refreshNotifications() async {
    if (!mounted ||
        _refreshingNotifications ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ModalRoute.of(context)?.isCurrent == false) {
      return;
    }
    _refreshingNotifications = true;
    try {
      final notifications = await ResidentNotificationsApi.listUnread(
        widget.user.accessToken,
      );
      if (mounted) setState(() => _notifications = notifications);
    } catch (_) {
      // Keep the last known unread count when the service is unavailable.
    } finally {
      _refreshingNotifications = false;
    }
  }

  Future<void> _markNotificationRead(
    ResidentAppNotification notification,
  ) async {
    setState(
      () => _notifications.removeWhere((item) => item.id == notification.id),
    );
    try {
      await ResidentNotificationsApi.markRead(
        widget.user.accessToken,
        notification.id,
      );
    } catch (_) {
      unawaited(_refreshNotifications());
    }
  }

  Future<void> _openNotifications() async {
    await _refreshNotifications();
    if (!mounted) return;
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
                            'Updates for your society and home',
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
                      return _notificationTile(
                        notification,
                        onTap: () {
                          Navigator.of(sheetContext).pop();
                          unawaited(_markNotificationRead(notification));
                        },
                        onMarkRead: () =>
                            unawaited(_markNotificationRead(notification)),
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

  Widget _notificationTile(
    ResidentAppNotification notification, {
    required VoidCallback onTap,
    VoidCallback? onMarkRead,
  }) {
    final isUrgent =
        notification.priority == 'HIGH' || notification.priority == 'CRITICAL';
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isUrgent
                      ? const Color(0xFFFFF0ED)
                      : const Color(0xFFEAF0FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _notificationIcon(notification),
                  size: 19,
                  color: isUrgent ? const Color(0xFFD65F4B) : AppColors.indigo,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.ink,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        if (isUrgent)
                          const Text(
                            'URGENT',
                            style: TextStyle(
                              color: Color(0xFFD65F4B),
                              fontSize: 8,
                              fontWeight: FontWeight.w800,
                              letterSpacing: .6,
                            ),
                          ),
                      ],
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
                    if (notification.referenceType == 'NOTICE' &&
                        (notification.scheduledAt != null ||
                            notification.expiresAt != null)) ...[
                      const SizedBox(height: 7),
                      if (notification.scheduledAt != null)
                        Text(
                          'Meeting: ${_formatDateTime(notification.scheduledAt!)}',
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      if (notification.expiresAt != null)
                        Text(
                          'Ends: ${_formatDateTime(notification.expiresAt!)}',
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
                    if (notification.createdAt != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Received ${_formatDateTime(notification.createdAt!)}',
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
              if (onMarkRead != null)
                IconButton(
                  tooltip: 'Mark as read',
                  onPressed: onMarkRead,
                  visualDensity: VisualDensity.compact,
                  constraints: const BoxConstraints.tightFor(
                    width: 34,
                    height: 34,
                  ),
                  padding: EdgeInsets.zero,
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFFE7F7EE),
                    foregroundColor: const Color(0xFF16834A),
                  ),
                  icon: const Icon(Icons.check_rounded, size: 19),
                )
              else
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
  }

  IconData _notificationIcon(ResidentAppNotification notification) {
    if (notification.priority == 'CRITICAL' ||
        notification.type == 'EMERGENCY') {
      return Icons.warning_amber_rounded;
    }
    if (notification.referenceType == 'NOTICE') return Icons.campaign_outlined;
    return Icons.notifications_active_outlined;
  }

  Future<void> _dismissDeliveryNotification(
    ResidentDeliveryNotification notification,
  ) async {
    setState(
      () => _deliveryNotifications.removeWhere(
        (item) => item.id == notification.id,
      ),
    );
    try {
      await ResidentDeliveryNotificationsApi.markRead(
        widget.user.accessToken,
        notification.id,
      );
    } catch (_) {
      unawaited(_refreshDeliveryNotifications());
    }
  }

  Future<void> _decideVisitorRequest(
    ResidentVisitorRequest request,
    String decision,
  ) async {
    if (_decidingVisitorRequestIds.contains(request.id)) return;
    setState(() => _decidingVisitorRequestIds.add(request.id));
    try {
      await ResidentVisitorsApi.decide(
        token: widget.user.accessToken,
        passId: request.id,
        decision: decision,
      );
      if (!mounted) return;
      setState(
        () => _visitorRequests.removeWhere((item) => item.id == request.id),
      );
    } on ResidentVisitorException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) {
        setState(() => _decidingVisitorRequestIds.remove(request.id));
      }
    }
  }

  void _addUpcomingBooking(ResidentUpcomingBooking booking) {
    if (!mounted) return;
    final current = _dashboardData;
    if (current == null) {
      final updatedFuture = _dashboardFuture.then((dashboard) {
        final updated = _mergeBooking(dashboard, booking);
        _dashboardData = updated;
        return updated;
      });
      setState(() => _dashboardFuture = updatedFuture);
      return;
    }
    final updated = _mergeBooking(current, booking);
    setState(() {
      _dashboardData = updated;
      _dashboardFuture = Future.value(updated);
    });
  }

  ResidentDashboardData _mergeLocalBookings(ResidentDashboardData data) {
    var merged = data;
    for (final booking in _dashboardData?.upcomingBookings ?? const []) {
      final exists = merged.upcomingBookings.any(
        (existing) => _sameUpcomingBooking(existing, booking),
      );
      if (!exists) {
        merged = merged.copyWith(
          upcomingBookings: [...merged.upcomingBookings, booking],
        );
      }
    }
    return merged;
  }

  ResidentDashboardData _mergeBooking(
    ResidentDashboardData dashboard,
    ResidentUpcomingBooking booking,
  ) {
    final remaining = dashboard.upcomingBookings.where(
      (existing) => !_sameUpcomingBooking(existing, booking),
    );
    return dashboard.copyWith(upcomingBookings: [booking, ...remaining]);
  }

  bool _sameUpcomingBooking(
    ResidentUpcomingBooking first,
    ResidentUpcomingBooking second,
  ) {
    bool sameTime(String firstTime, String secondTime) {
      final firstParts = _clockParts(firstTime);
      final secondParts = _clockParts(secondTime);
      return firstParts != null && secondParts != null
          ? firstParts == secondParts
          : firstTime == secondTime;
    }

    return first.amenityName == second.amenityName &&
        first.slotDate == second.slotDate &&
        sameTime(first.startTime, second.startTime) &&
        sameTime(first.endTime, second.endTime);
  }

  void _openProfile() {
    _navigateTo(_ResidentSection.profile, 4);
  }

  void _openPayments() {
    _selectTab(1);
  }

  void _selectTab(int index) {
    _navigateTo(
      switch (index) {
        1 => _ResidentSection.payments,
        2 => _ResidentSection.visitors,
        3 => _ResidentSection.complaints,
        4 => _ResidentSection.profile,
        _ => _ResidentSection.home,
      },
      index,
    );
  }

  void _navigateTo(_ResidentSection section, int tab) {
    if (_activeSection == section) return;
    setState(() {
      _sectionHistory.add(_activeSection);
      _activeSection = section;
      _selectedTab = tab;
    });
  }

  void _handleBack() {
    if (_activeSection == _ResidentSection.home && _sectionHistory.isEmpty) {
      return;
    }
    setState(() {
      final previous = _sectionHistory.isNotEmpty
          ? _sectionHistory.removeLast()
          : _ResidentSection.home;
      _activeSection = previous;
      _selectedTab = switch (previous) {
        _ResidentSection.payments => 1,
        _ResidentSection.visitors => 2,
        _ResidentSection.complaints => 3,
        _ResidentSection.profile => 4,
        _ => 0,
      };
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope<Object?>(
      canPop:
          _activeSection == _ResidentSection.home && _sectionHistory.isEmpty,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            if (_activeSection != _ResidentSection.profile)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                child: _topBar(context, _dashboardData),
              ),
            Expanded(
              child: switch (_activeSection) {
                _ResidentSection.payments =>
                  ResidentFinanceScreen(user: widget.user, onBack: _handleBack),
                _ResidentSection.visitors =>
                  ResidentVisitorsScreen(user: widget.user, onBack: _handleBack),
                _ResidentSection.complaints =>
                  ResidentComplaintsScreen(user: widget.user, onBack: _handleBack),
                _ResidentSection.amenities => ResidentAmenitiesScreen(
                  user: widget.user,
                  onBookingCreated: _addUpcomingBooking,
                  onBack: _handleBack,
                ),
                _ => FutureBuilder<ResidentDashboardData>(
                future: _dashboardFuture,
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    return _loadError(snapshot.error.toString());
                  }
                  if (!snapshot.hasData) {
                    return const Center(
                      child: CircularProgressIndicator(color: AppColors.indigo),
                    );
                  }
                  final dashboard = snapshot.data!;
                  final visibleNotices = _visibleNotices(dashboard);
                  final profileUpdateNotifications = _notifications
                      .where(
                        (item) => item.referenceType == 'RESIDENT_PROFILE',
                      )
                      .toList();
                  if (_selectedTab == 4) {
                    return ResidentProfileScreen(
                      user: _updatedUser ?? widget.user,
                      dashboard: dashboard,
                      header: const SizedBox.shrink(),
                      onBack: _handleBack,
                      changePasswordHeader: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                        child: _topBar(context, dashboard),
                      ),
                      onProfileUpdated: (user) {
                        if (!mounted) return;
                        setState(() {
                          _updatedResidentName = user.name;
                          _updatedUser = user;
                        });
                        unawaited(_refreshDashboard().catchError((_) {}));
                      },
                    );
                  }
                  return Column(
                    children: [
                      Expanded(
                        child: RefreshIndicator(
                            color: AppColors.indigo,
                            onRefresh: _refreshDashboard,
                            child: CustomScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              slivers: [
                                SliverPadding(
                                  padding: const EdgeInsets.fromLTRB(
                                    20,
                                    4,
                                    20,
                                    28,
                                  ),
                                  sliver: SliverList.list(
                                    children: [
                                      const SizedBox(height: 8),
                                      _greeting(),
                                      if (profileUpdateNotifications
                                          .isNotEmpty) ...[
                                        const SizedBox(height: 18),
                                        _sectionTitle(
                                          'Profile updates',
                                          trailing:
                                              '${profileUpdateNotifications.length} new',
                                        ),
                                        const SizedBox(height: 12),
                                        ...profileUpdateNotifications
                                            .take(2)
                                            .map(
                                              (notification) => Padding(
                                                padding: const EdgeInsets.only(
                                                  bottom: 10,
                                                ),
                                                child: _notificationTile(
                                                  notification,
                                                  onTap: () {
                                                    unawaited(
                                                      _markNotificationRead(
                                                        notification,
                                                      ),
                                                    );
                                                  },
                                                ),
                                              ),
                                            ),
                                      ],
                                      const SizedBox(height: 17),
                                      _emergencyContactsCard(dashboard),
                                      if (_visitorRequests.isNotEmpty) ...[
                                        const SizedBox(height: 16),
                                        _visitorAttentionSection(),
                                      ],
                                      if (_deliveryNotifications
                                          .isNotEmpty) ...[
                                        const SizedBox(height: 12),
                                        _deliveryAttentionSection(),
                                      ],
                                      const SizedBox(height: 25),
                                      _sectionTitle(
                                        'Quick actions',
                                        trailing: '',
                                      ),
                                      const SizedBox(height: 14),
                                      _quickActions(context),
                                      const SizedBox(height: 27),
                                      _sectionTitle(
                                        'Complaint status',
                                        trailing: 'View all',
                                        onTap: _openHelp,
                                      ),
                                      const SizedBox(height: 13),
                                      _complaintStatusSection(context),
                                      const SizedBox(height: 27),
                                      _sectionTitle(
                                        'Maintenance',
                                        trailing: 'View details',
                                      ),
                                      const SizedBox(height: 13),
                                      _maintenanceCard(dashboard),
                                      if (dashboard
                                          .upcomingBookings
                                          .isNotEmpty) ...[
                                        const SizedBox(height: 27),
                                        const Text(
                                          'Upcoming booking',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: -.25,
                                            color: AppColors.ink,
                                          ),
                                        ),
                                        const SizedBox(height: 13),
                                        ...dashboard.upcomingBookings.expand(
                                          (booking) => [
                                            _upcomingBookingCard(booking),
                                            const SizedBox(height: 10),
                                          ],
                                        ),
                                      ],
                                      const SizedBox(height: 27),
                                      _sectionTitle(
                                        'Announcements',
                                        trailing:
                                            '${visibleNotices.length} updates',
                                      ),
                                      const SizedBox(height: 13),
                                      ...visibleNotices.expand(
                                        (notice) => [
                                          _noticeCard(notice),
                                          const SizedBox(height: 10),
                                        ],
                                      ),
                                      if (visibleNotices.isEmpty)
                                        _emptyCard(
                                          'There are no current notices.',
                                        ),
                                      const SizedBox(height: 16),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ),
                    ],
                  );
                },
              ),
              },
            ),
            _bottomBar(context),
          ],
        ),
      ),
      ),
    );
  }

  Widget _topBar(BuildContext context, ResidentDashboardData? dashboard) => Row(
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
              'RESIDENT PORTAL',
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
      _roundIcon(
        Icons.notifications_none_rounded,
        badgeCount: _notifications.length,
        onTap: _openNotifications,
      ),
      const SizedBox(width: 9),
      PopupMenuButton<String>(
        tooltip: 'Account',
        onSelected: (value) {
          if (value == 'profile') {
            _openProfile();
          } else if (value == 'logout') {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
              (_) => false,
            );
          }
        },
        itemBuilder: (_) => const [
          PopupMenuItem(value: 'profile', child: Text('Profile')),
          PopupMenuItem(value: 'logout', child: Text('Sign out')),
        ],
        child: _residentAvatar(dashboard),
      ),
    ],
  );

  Widget _residentAvatar(ResidentDashboardData? dashboard) {
    final photoPath =
        _updatedUser?.profilePictureUrl ??
        dashboard?.residentPhotoUrl ??
        widget.user.profilePictureUrl;
    final photoUrl = photoPath == null || photoPath.isEmpty
        ? null
        : Uri.tryParse(photoPath)?.hasScheme == true
        ? photoPath
        : Uri.parse(
            const String.fromEnvironment(
              'API_BASE_URL',
              defaultValue: 'http://localhost:5000/api/v1',
            ),
          ).resolve(photoPath).toString();
    if (photoUrl == null) {
      return CircleAvatar(
        radius: 22,
        backgroundColor: const Color(0xFFEAE8FF),
        child: const Icon(
          Icons.person_rounded,
          color: AppColors.indigo,
          size: 26,
        ),
      );
    }
    return CircleAvatar(
      radius: 22,
      backgroundColor: const Color(0xFFEAE8FF),
      child: ClipOval(
        child: Image.network(
          photoUrl,
          width: 44,
          height: 44,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => const Center(
            child: Icon(
              Icons.person_rounded,
              color: AppColors.indigo,
              size: 26,
            ),
          ),
        ),
      ),
    );
  }

  Widget _greeting() {
    final now = DateTime.now();
    final greeting = now.hour < 12
        ? 'Good Morning'
        : now.hour < 17
        ? 'Good Afternoon'
        : 'Good Evening';
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
    final date =
        '${weekdays[now.weekday - 1]}, ${now.day} ${months[now.month - 1]}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          date.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.15,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          '$greeting, $_firstName 👋',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.65,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 5),
        const Text(
          'Here’s what’s happening in your community.',
          style: TextStyle(
            fontSize: 13,
            color: Color.fromARGB(255, 11, 11, 11),
          ),
        ),
      ],
    );
  }

  Widget _emergencyContactsCard(ResidentDashboardData dashboard) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(18),
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: _showEmergencyContacts,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
        decoration: _cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  color: AppColors.indigo,
                  size: 18,
                ),
                const SizedBox(width: 7),
                Expanded(
                  child: Text(
                    _residentHomeLabel(dashboard),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: Color(0xFFEAEFF5)),
            ),
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1ED),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: const Icon(
                    Icons.phone_in_talk_outlined,
                    color: Color(0xFFDF654D),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Emergency contacts',
                        style: TextStyle(
                          color: AppColors.ink,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Police, ambulance, security & more',
                        style: TextStyle(color: Colors.black, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF8994A7),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );

  void _showEmergencyContacts() {
    final contactsFuture = ResidentEmergencyContactsApi.list(
      widget.user.accessToken,
    );
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => DraggableScrollableSheet(
        initialChildSize: .76,
        minChildSize: .5,
        maxChildSize: .94,
        snap: true,
        snapSizes: const [.76, .94],
        expand: false,
        builder: (context, scrollController) => Container(
          clipBehavior: Clip.antiAlias,
          decoration: const BoxDecoration(
            color: Color(0xFFF7F8FC),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
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
                padding: const EdgeInsets.fromLTRB(20, 18, 16, 16),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEEE9),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.call_rounded,
                        color: Color(0xFFDF654D),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Emergency contacts',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Tap a number to call for help',
                            style: TextStyle(fontSize: 11, color: Colors.black),
                          ),
                        ],
                      ),
                    ),
                    Material(
                      color: const Color(0xFFEEF1F7),
                      shape: const CircleBorder(),
                      child: IconButton(
                        tooltip: 'Close emergency contacts',
                        onPressed: () => Navigator.of(sheetContext).pop(),
                        icon: const Icon(
                          Icons.close_rounded,
                          color: Color(0xFF68748A),
                          size: 19,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: FutureBuilder<List<ResidentEmergencyContact>>(
                  future: contactsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.indigo,
                        ),
                      );
                    }
                    if (snapshot.hasError) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.cloud_off_rounded,
                                color: Color(0xFF9AA4B4),
                                size: 34,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                '${snapshot.error}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 12),
                              OutlinedButton.icon(
                                onPressed: () =>
                                    Navigator.of(sheetContext).pop(),
                                icon: const Icon(Icons.close_rounded),
                                label: const Text('Close'),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                    final contacts =
                        (snapshot.data ?? const <ResidentEmergencyContact>[])
                            .where((contact) => contact.isActive)
                            .toList();
                    if (contacts.isEmpty) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(28),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.contact_phone_outlined,
                                color: Color(0xFF9AA4B4),
                                size: 38,
                              ),
                              SizedBox(height: 10),
                              Text(
                                'No emergency contacts available',
                                style: TextStyle(
                                  color: AppColors.ink,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              SizedBox(height: 5),
                              Text(
                                'Your society administrator can add contacts in the admin portal.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                    return ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 2, 16, 24),
                      itemCount: contacts.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) =>
                          _emergencyContactTile(contacts[index]),
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

  Widget _emergencyContactTile(ResidentEmergencyContact contact) {
    final category = contact.category
        .toLowerCase()
        .split('_')
        .map(
          (part) => part.isEmpty
              ? part
              : '${part[0].toUpperCase()}${part.substring(1)}',
        )
        .join(' ');
    final subtitle = contact.available24x7
        ? 'Available 24/7'
        : (contact.operatingHours?.isNotEmpty == true
              ? contact.operatingHours!
              : 'Hours not listed');
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE9EDF4)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x070F1A35),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1EEFF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _emergencyCategoryIcon(category),
                  size: 16,
                  color: AppColors.indigo,
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  category.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.indigo,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
              ),
              if (contact.available24x7)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF7F0),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '24/7',
                    style: TextStyle(
                      color: Color(0xFF278454),
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 7),
          Text(
            contact.name,
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                Icons.schedule_rounded,
                size: 14,
                color: Color(0xFF8994A7),
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  subtitle,
                  style: const TextStyle(color: Colors.black, fontSize: 11),
                ),
              ),
            ],
          ),
          if (contact.address?.isNotEmpty == true) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 14,
                  color: Color(0xFF8994A7),
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    contact.address!,
                    style: const TextStyle(color: Colors.black, fontSize: 11),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          _contactNumberButton(contact.phone),
          if (contact.alternatePhone?.isNotEmpty == true) ...[
            const SizedBox(height: 7),
            _contactNumberButton(contact.alternatePhone!),
          ],
          if (contact.notes?.isNotEmpty == true) ...[
            const SizedBox(height: 9),
            Text(
              contact.notes!,
              style: const TextStyle(
                color: Colors.black,
                fontSize: 11,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _contactNumberButton(String phone, {String? label}) => Material(
    color: const Color(0xFFFAFAFD),
    borderRadius: BorderRadius.circular(12),
    child: InkWell(
      onTap: () => _callEmergencyNumber(phone),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        constraints: const BoxConstraints(minHeight: 43),
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE8EAF2)),
        ),
        child: Row(
          children: [
            const Icon(Icons.call_rounded, size: 16, color: AppColors.indigo),
            const SizedBox(width: 9),
            if (label != null) ...[
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.black, fontSize: 10),
                ),
              ),
              const SizedBox(width: 5),
            ],
            Expanded(
              child: Text(
                phone,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  IconData _emergencyCategoryIcon(String category) {
    final value = category.toLowerCase();
    if (value.contains('ambulance') || value.contains('medical')) {
      return Icons.medical_services_outlined;
    }
    if (value.contains('fire')) return Icons.local_fire_department_outlined;
    if (value.contains('police')) return Icons.local_police_outlined;
    if (value.contains('hospital')) return Icons.local_hospital_outlined;
    if (value.contains('security')) return Icons.shield_outlined;
    return Icons.support_agent_rounded;
  }

  Future<void> _callEmergencyNumber(String phone) async {
    final uri = Uri(
      scheme: 'tel',
      path: phone.replaceAll(RegExp(r'[^+0-9]'), ''),
    );
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your device cannot open the phone app.')),
      );
    }
  }

  Widget _sectionTitle(
    String title, {
    required String trailing,
    VoidCallback? onTap,
  }) => Row(
    children: [
      Expanded(
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            letterSpacing: -.25,
            color: AppColors.ink,
          ),
        ),
      ),
      if (trailing.isNotEmpty)
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(6),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  trailing,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.indigo,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.indigo,
                  size: 17,
                ),
              ],
            ),
          ),
        ),
    ],
  );

  Widget _quickActions(BuildContext context) => Row(
    children: [
      Expanded(
        child: _action(
          Icons.receipt_long_rounded,
          'Pay dues',
          const Color(0xFFECE9FF),
          AppColors.indigo,
          onTap: () => setState(() => _selectedTab = 1),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: _action(
          Icons.person_add_alt_1_rounded,
          'Visitors',
          const Color(0xFFE4F7F1),
          const Color(0xFF229B78),
          onTap: _openVisitors,
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: _action(
          Icons.build_outlined,
          'Complaints',
          const Color(0xFFFFF1E5),
          const Color(0xFFE68A36),
          onTap: _openHelp,
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: _action(
          Icons.calendar_month_rounded,
          'Amenities',
          const Color(0xFFE8F1FF),
          const Color(0xFF4784DB),
          onTap: _openAmenities,
        ),
      ),
    ],
  );

  Widget _action(
    IconData icon,
    String label,
    Color background,
    Color foreground, {
    VoidCallback? onTap,
  }) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(18),
    child: Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Icon(icon, color: foreground, size: 23),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
      ],
    ),
  );

  void _openHelp() {
    _selectTab(3);
  }

  void _openVisitors() {
    _selectTab(2);
  }

  void _openAmenities() {
    _navigateTo(_ResidentSection.amenities, 0);
  }

  Widget _maintenanceCard(ResidentDashboardData dashboard) {
    final invoices = dashboard.maintenance;
    if (invoices.isEmpty) {
      return _emptyCard('No maintenance records.');
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: _cardDecoration(),
      child: Column(
        children: [
          for (var index = 0; index < invoices.length; index++) ...[
            if (index > 0) const Divider(height: 1, color: Color(0xFFEBEFF5)),
            _maintenanceInvoiceRow(invoices[index], dashboard.currency),
          ],
        ],
      ),
    );
  }

  Widget _maintenanceInvoiceRow(
    ResidentMaintenance maintenance,
    String currency,
  ) {
    final amount = maintenance.amount
        .toStringAsFixed(2)
        .replaceFirst(RegExp(r'\.00$'), '');
    final dueDate = maintenance.dueDate == null
        ? 'Due date unavailable'
        : 'Due ${maintenance.dueDate!.day} ${_monthName(maintenance.dueDate!.month)}';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF3E9),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.account_balance_wallet_outlined,
              color: Color(0xFFE28A38),
              size: 21,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  maintenance.description ??
                      maintenance.billingPeriod ??
                      maintenance.invoiceNumber ??
                      'Maintenance invoice',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  dueDate,
                  style: const TextStyle(fontSize: 10, color: Colors.black),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${_currencySymbol(currency)} $amount',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF4E7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  maintenance.status.replaceAll('_', ' '),
                  style: const TextStyle(
                    color: Color(0xFFD1802E),
                    fontSize: 8,
                    fontWeight: FontWeight.w800,
                    letterSpacing: .5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _complaintStatusSection(BuildContext context) =>
      FutureBuilder<List<ResidentComplaint>>(
        future: _complaintsFuture,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return _emptyCard('Complaint status is temporarily unavailable.');
          }
          if (!snapshot.hasData) {
            return _emptyCard('Checking your latest complaint status…');
          }
          final complaints = snapshot.data!;
          if (complaints.isEmpty) {
            return _emptyCard('You have no complaints yet.');
          }
          return _latestComplaintCard(complaints.first);
        },
      );

  Widget _visitorAttentionSection() => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFECE9FF),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFFDCD7FF)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Needs your attention',
                style: TextStyle(
                  color: AppColors.ink,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            Text(
              'Today',
              style: TextStyle(color: const Color(0xFF7B72C9), fontSize: 13),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ..._visitorRequests.map(
          (request) => Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: _visitorRequestCard(request),
          ),
        ),
      ],
    ),
  );

  Widget _deliveryAttentionSection() => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFEAF5FF),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFFD5E9FF)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Delivery updates',
          style: TextStyle(
            color: AppColors.ink,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        ..._deliveryNotifications.map(
          (notification) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: const Color(0xFFE8ECF3)),
            ),
            child: Row(
              children: [
                Icon(
                  notification.type == 'PARCEL'
                      ? Icons.inventory_2_outlined
                      : Icons.local_shipping_outlined,
                  color: AppColors.indigo,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        notification.message,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Dismiss update',
                  onPressed: () => _dismissDeliveryNotification(notification),
                  icon: const Icon(Icons.close_rounded, size: 19),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );

  Widget _visitorRequestCard(ResidentVisitorRequest request) {
    final busy = _decidingVisitorRequestIds.contains(request.id);
    final visitorType = request.visitorType.replaceAll('_', ' ').toLowerCase();
    final waitingLabel = request.status == 'ARRIVED'
        ? 'Arrived ${_visitorElapsed(request.createdAt)}'
        : 'Registered ${_visitorElapsed(request.createdAt)}';
    final initials = request.visitorName
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();

    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: const Color(0xFFE8ECF3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.access_time_rounded,
                size: 17,
                color: AppColors.indigo,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${_visitorRequests.length} ${_visitorRequests.length == 1 ? 'visitor' : 'visitors'} waiting at the gate',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              CircleAvatar(
                radius: 27,
                backgroundColor: const Color(0xFFECE9FF),
                child: Text(
                  initials.isEmpty ? 'V' : initials,
                  style: const TextStyle(
                    color: AppColors.indigo,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.visitorName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_capitalize(visitorType)}  ·  ${request.gateName}  ·  $waitingLabel',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.black, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 46,
                  child: FilledButton.icon(
                    onPressed: busy
                        ? null
                        : () => _decideVisitorRequest(request, 'APPROVED'),
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: const Text('Approve'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.navy,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: SizedBox(
                  height: 46,
                  child: OutlinedButton.icon(
                    onPressed: busy
                        ? null
                        : () => _decideVisitorRequest(request, 'REJECTED'),
                    icon: const Icon(Icons.close_rounded, size: 18),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _visitorElapsed(DateTime? createdAt) {
    if (createdAt == null) return 'just now';
    final minutes = DateTime.now().difference(createdAt).inMinutes;
    if (minutes < 1) return 'just now';
    if (minutes == 1) return '1 min ago';
    if (minutes < 60) return '$minutes min ago';
    final hours = minutes ~/ 60;
    if (hours == 1) return '1 hr ago';
    return '$hours hrs ago';
  }

  String _capitalize(String value) => value.isEmpty
      ? 'Guest'
      : '${value[0].toUpperCase()}${value.substring(1)}';

  Widget _latestComplaintCard(ResidentComplaint complaint) {
    final status = complaint.status.replaceAll('_', ' ');
    final statusColor = switch (complaint.status.toUpperCase()) {
      'RESOLVED' || 'CLOSED' => const Color(0xFF229B78),
      'IN_PROGRESS' || 'ASSIGNED' => const Color(0xFF4784DB),
      'ON_HOLD' => const Color(0xFFE28A38),
      _ => AppColors.indigo,
    };

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: _openHelp,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE8ECF3)),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(Icons.support_agent_rounded, color: statusColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      complaint.subject,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      '${complaint.ticketNumber}  ·  $status',
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: Colors.black),
            ],
          ),
        ),
      ),
    );
  }

  Widget _upcomingBookingCard(ResidentUpcomingBooking booking) {
    final date = booking.slotDate;
    final weekday = date == null ? '' : _weekdayShort(date.weekday);
    final month = date == null ? '' : _monthShort(date.month);
    final dateLabel = date == null
        ? 'Date unavailable'
        : '$weekday ${date.day} $month';
    final timeRange = _bookingTimeRange(booking.startTime, booking.endTime);
    final duration = _bookingDuration(booking.startTime, booking.endTime);
    final confirmed = booking.status.toUpperCase() == 'CONFIRMED';
    final statusLabel = confirmed ? 'Confirmed' : 'Pending';
    const green = Color(0xFF25C69A);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1F1B46),
        borderRadius: BorderRadius.circular(20),
        border: const Border(left: BorderSide(color: green, width: 5)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x141F1B46),
            blurRadius: 14,
            offset: Offset(0, 5),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(19, 17, 17, 17),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  booking.amenityName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 11,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF123D38),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      confirmed ? Icons.check_rounded : Icons.schedule_rounded,
                      color: green,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      statusLabel,
                      style: const TextStyle(
                        color: green,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Row(
            children: [
              if (date != null) ...[
                Container(
                  width: 54,
                  height: 58,
                  decoration: BoxDecoration(
                    color: const Color(0xFF302B64),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        month.toUpperCase(),
                        style: const TextStyle(
                          color: Color(0xFF9B91FF),
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: .5,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        '${date.day}',
                        style: const TextStyle(
                          color: Color(0xFF826FFF),
                          fontSize: 23,
                          height: 1,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dateLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [
                        timeRange,
                        if (duration.isNotEmpty) duration,
                      ].join(' · '),
                      style: const TextStyle(
                        color: Color(0xFFB5B1D1),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _weekdayShort(int weekday) =>
      const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekday - 1];

  String _monthShort(int month) => const [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][month - 1];

  String _bookingTimeRange(String start, String end) {
    final startParts = _clockParts(start);
    final endParts = _clockParts(end);
    if (startParts == null || endParts == null) return 'Time unavailable';
    final startLabel = _clockLabel(startParts.$1, startParts.$2);
    final endLabel = _clockLabel(endParts.$1, endParts.$2);
    if (startParts.$2 == endParts.$2) {
      return '$startLabel–${_clockHour12(endParts.$1)} ${endParts.$2}';
    }
    return '$startLabel–$endLabel';
  }

  String _bookingDuration(String start, String end) {
    final startParts = _clockParts(start);
    final endParts = _clockParts(end);
    if (startParts == null || endParts == null) return '';
    final startMinutes = startParts.$1 * 60 + startParts.$3;
    var endMinutes = endParts.$1 * 60 + endParts.$3;
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    final minutes = endMinutes - startMinutes;
    if (minutes <= 0) return '';
    if (minutes % 60 == 0) {
      final hours = minutes ~/ 60;
      return '$hours ${hours == 1 ? 'hour' : 'hours'}';
    }
    final hours = minutes ~/ 60;
    final remainder = minutes % 60;
    return hours == 0 ? '$remainder min' : '${hours}h ${remainder}m';
  }

  (int, String, int)? _clockParts(String value) {
    final match = RegExp(
      r'^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$',
      caseSensitive: false,
    ).firstMatch(value.trim());
    if (match == null) return null;
    var hour = int.tryParse(match.group(1)!);
    final minute = int.tryParse(match.group(2)!);
    final period = match.group(3)?.toUpperCase();
    if (hour == null || minute == null || minute < 0 || minute > 59) {
      return null;
    }
    if (period != null) {
      if (hour < 1 || hour > 12) return null;
      hour = (hour % 12) + (period == 'PM' ? 12 : 0);
    } else if (hour < 0 || hour > 23) {
      return null;
    }
    return (hour, hour < 12 ? 'AM' : 'PM', minute);
  }

  String _clockLabel(int hour, String period) {
    return '${_clockHour12(hour)} $period';
  }

  int _clockHour12(int hour) => hour % 12 == 0 ? 12 : hour % 12;

  Widget _noticeCard(ResidentNotice notice) => Material(
    color: Colors.transparent,
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => _showNotice(notice),
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: _cardDecoration(),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF1FF),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.campaign_outlined,
                color: Color(0xFF4D7FCE),
                size: 21,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notice.title,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                      ),
                      Text(
                        notice.status.toUpperCase() == 'SCHEDULED'
                            ? 'Scheduled ${_relativeDate(notice.postedAt)}'
                            : _relativeDate(notice.postedAt),
                        style: const TextStyle(
                          fontSize: 9,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notice.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10,
                      height: 1.45,
                      color: Colors.black,
                    ),
                  ),
                  if (notice.scheduledAt != null || notice.expiresAt != null) ...[
                    const SizedBox(height: 8),
                    if (notice.scheduledAt != null)
                      Text(
                        'Meeting: ${_formatDateTime(notice.scheduledAt!)}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.black,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    if (notice.expiresAt != null)
                      Text(
                        'Ends: ${_formatDateTime(notice.expiresAt!)}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.black,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                  ],
                  const SizedBox(height: 8),
                  const Text(
                    'Tap to read',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.indigo,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Future<void> _showNotice(ResidentNotice notice) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) => SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          22,
          12,
          22,
          24 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD9DEEA),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 22),
              const Text(
                'COMMUNITY NOTICE',
                style: TextStyle(
                  color: AppColors.indigo,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                notice.title,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (notice.scheduledAt != null) ...[
                const SizedBox(height: 7),
                Text(
                  'Meeting: ${_formatDateTime(notice.scheduledAt!)}',
                  style: const TextStyle(color: Colors.black, fontSize: 12),
                ),
              ],
              if (notice.expiresAt != null) ...[
                const SizedBox(height: 5),
                Text(
                  'Ends: ${_formatDateTime(notice.expiresAt!)}',
                  style: const TextStyle(color: Colors.black, fontSize: 12),
                ),
              ],
              if (notice.scheduledAt == null && notice.postedAt != null) ...[
                const SizedBox(height: 7),
                Text(
                  'Posted: ${_formatDateTime(notice.postedAt!)}',
                  style: const TextStyle(color: Colors.black, fontSize: 12),
                ),
              ],
              const SizedBox(height: 18),
              Text(
                notice.description,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _loadError(String error) => Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_rounded, color: Colors.black, size: 40),
          const SizedBox(height: 12),
          Text(
            error,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.black),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _refreshDashboard,
            child: const Text('Try again'),
          ),
        ],
      ),
    ),
  );

  Widget _emptyCard(String message) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: _cardDecoration(),
    child: Text(
      message,
      style: const TextStyle(fontSize: 12, color: Colors.black),
    ),
  );

  String _residentHomeLabel(ResidentDashboardData dashboard) {
    final parts = [
      if (dashboard.societyName?.isNotEmpty == true) dashboard.societyName!,
      if (dashboard.towerName?.isNotEmpty == true) dashboard.towerName!,
      if (dashboard.unitNumber?.isNotEmpty == true)
        'Flat ${dashboard.unitNumber}',
    ];
    return parts.isEmpty ? 'Your home' : parts.join(' · ');
  }

  String _currencySymbol(String currency) => switch (currency.toUpperCase()) {
    'INR' => '₹',
    'USD' => r'$',
    'EUR' => '€',
    'GBP' => '£',
    _ => currency,
  };

  String _monthName(int month) => const [
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
  ][month - 1];

  String _relativeDate(DateTime? date) {
    if (date == null) return '';
    final days = DateTime.now().difference(date).inDays;
    if (days <= 0) return 'Today';
    if (days == 1) return 'Yesterday';
    if (days < 7) return '$days days ago';
    return '${date.day} ${_monthName(date.month)}';
  }

  String _formatDateTime(DateTime value) {
    final local = value.toLocal();
    final hour24 = local.hour;
    final hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = hour24 < 12 ? 'AM' : 'PM';
    return '${local.day.toString().padLeft(2, '0')} ${_monthName(local.month)} '
        '${local.year}, $hour12:$minute $period';
  }

  Widget _bottomBar(BuildContext context) => Container(
    decoration: const BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: Color(0xFFEAEFF5))),
    ),
    child: SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 9, 8, 5),
        child: Row(
          children: [
            _tab(Icons.home_rounded, 'Home', 0),
            _tab(
              Icons.receipt_long_outlined,
              'Payments',
              1,
              onTap: _openPayments,
            ),
            _tab(
              Icons.people_alt_outlined,
              'Visitors',
              2,
              onTap: _openVisitors,
            ),
            _tab(Icons.help_outline_rounded, 'Help', 3, onTap: _openHelp),
            _tab(
              Icons.person_outline_rounded,
              'Profile',
              4,
              onTap: _openProfile,
            ),
          ],
        ),
      ),
    ),
  );

  Widget _tab(IconData icon, String label, int index, {VoidCallback? onTap}) {
    final selected = _selectedTab == index;
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap ?? () => _selectTab(index),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 21,
                color: selected
                    ? AppColors.indigo
                    : const Color.fromARGB(255, 0, 1, 3),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                  color: selected
                      ? AppColors.indigo
                      : const Color.fromARGB(255, 0, 1, 3),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _roundIcon(IconData icon, {int badgeCount = 0, VoidCallback? onTap}) =>
      Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        child: InkWell(
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
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                Icon(icon, color: const Color(0xFF68748A), size: 21),
                if (badgeCount > 0)
                  Positioned(
                    right: -5,
                    top: -5,
                    child: Container(
                      constraints: const BoxConstraints(
                        minWidth: 17,
                        minHeight: 17,
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: Color(0xFFE4515D),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        badgeCount > 99 ? '99+' : '$badgeCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
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

  String _initials(String name) {
    final parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'R';
    return parts.take(2).map((part) => part[0].toUpperCase()).join();
  }
}
