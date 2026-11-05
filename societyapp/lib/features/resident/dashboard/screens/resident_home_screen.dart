import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../../amenities/screens/resident_amenities_screen.dart';
import '../../complaints/data/resident_complaints_api.dart';
import '../../complaints/screens/resident_complaints_screen.dart';
import '../data/resident_dashboard_api.dart';
import 'resident_profile_screen.dart';

class ResidentHomeScreen extends StatefulWidget {
  const ResidentHomeScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentHomeScreen> createState() => _ResidentHomeScreenState();
}

class _ResidentHomeScreenState extends State<ResidentHomeScreen>
    with WidgetsBindingObserver {
  int _selectedTab = 0;
  late Future<ResidentDashboardData> _dashboardFuture;
  late Future<List<ResidentComplaint>> _complaintsFuture;
  ResidentDashboardData? _dashboardData;
  Timer? _dashboardRefreshTimer;
  Timer? _complaintsRefreshTimer;
  bool _refreshingDashboard = false;
  bool _refreshingComplaints = false;

  String get _firstName => widget.user.name.trim().split(' ').first;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _dashboardFuture = ResidentDashboardApi.load(widget.user.accessToken).then(
      (data) {
        _dashboardData = data;
        return data;
      },
    );
    _complaintsFuture = ResidentComplaintsApi.listComplaints(
      widget.user.accessToken,
    );
    _dashboardRefreshTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _refreshDashboardInBackground(),
    );
    _complaintsRefreshTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) => _refreshComplaintsInBackground(),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshDashboardInBackground();
      _refreshComplaintsInBackground();
    }
  }

  @override
  void dispose() {
    _dashboardRefreshTimer?.cancel();
    _complaintsRefreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> _refreshDashboard() async {
    if (_refreshingDashboard) return;
    _refreshingDashboard = true;
    try {
      final data = await ResidentDashboardApi.load(widget.user.accessToken);
      if (mounted) {
        final refreshedData = _mergeLocalBookings(data);
        setState(() {
          _dashboardData = refreshedData;
          _dashboardFuture = Future.value(refreshedData);
        });
      }
    } finally {
      _refreshingDashboard = false;
    }
  }

  Future<void> _refreshDashboardInBackground() async {
    if (!mounted ||
        _refreshingDashboard ||
        _selectedTab != 0 ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ModalRoute.of(context)?.isCurrent == false) {
      return;
    }
    try {
      await _refreshDashboard();
    } catch (_) {
      // Keep showing the last successfully loaded dashboard on network errors.
    }
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

  Future<void> _openProfile(BuildContext context) async {
    setState(() => _selectedTab = 4);
    ResidentDashboardData dashboard;
    try {
      dashboard = await _dashboardFuture;
    } catch (_) {
      dashboard = const ResidentDashboardData();
    }
    if (!context.mounted) return;
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) =>
            ResidentProfileScreen(user: widget.user, dashboard: dashboard),
      ),
    );
    if (mounted) setState(() => _selectedTab = 0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: FutureBuilder<ResidentDashboardData>(
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
                  return RefreshIndicator(
                    color: AppColors.indigo,
                    onRefresh: _refreshDashboard,
                    child: CustomScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      slivers: [
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
                          sliver: SliverList.list(
                            children: [
                              _topBar(context, dashboard),
                              const SizedBox(height: 26),
                              _greeting(),
                              const SizedBox(height: 22),
                              _societyCard(dashboard),
                              const SizedBox(height: 25),
                              _sectionTitle(
                                'Quick actions',
                                trailing: 'See all',
                              ),
                              const SizedBox(height: 14),
                              _quickActions(context),
                              const SizedBox(height: 27),
                              _sectionTitle(
                                'Complaint status',
                                trailing: 'View all',
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
                              if (dashboard.upcomingBookings.isNotEmpty) ...[
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
                                trailing: '${dashboard.notices.length} updates',
                              ),
                              const SizedBox(height: 13),
                              ...dashboard.notices.expand(
                                (notice) => [
                                  _noticeCard(notice),
                                  const SizedBox(height: 10),
                                ],
                              ),
                              if (dashboard.notices.isEmpty)
                                _emptyCard('There are no current notices.'),
                              const SizedBox(height: 16),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            _bottomBar(context),
          ],
        ),
      ),
    );
  }

  Widget _topBar(BuildContext context, ResidentDashboardData dashboard) => Row(
    children: [
      Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFE8ECF3)),
        ),
        child: dashboard.societyLogoUrl == null
            ? const Icon(
                Icons.apartment_rounded,
                color: AppColors.indigo,
                size: 24,
              )
            : ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(
                  dashboard.societyLogoUrl!,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const Icon(
                    Icons.apartment_rounded,
                    color: AppColors.indigo,
                    size: 24,
                  ),
                ),
              ),
      ),
      const SizedBox(width: 11),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              dashboard.societyName ?? 'Society',
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
                color: AppColors.muted,
              ),
            ),
          ],
        ),
      ),
      _roundIcon(
        Icons.notifications_none_rounded,
        badge: dashboard.notices.isNotEmpty,
      ),
      const SizedBox(width: 9),
      PopupMenuButton<String>(
        tooltip: 'Account',
        onSelected: (value) {
          if (value == 'profile') {
            _openProfile(context);
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

  Widget _residentAvatar(ResidentDashboardData dashboard) {
    final photoUrl = dashboard.residentPhotoUrl;
    if (photoUrl == null) {
      return CircleAvatar(
        radius: 22,
        backgroundColor: const Color(0xFFEAE8FF),
        child: Text(
          _initials(widget.user.name),
          style: const TextStyle(
            color: AppColors.indigo,
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
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
            color: AppColors.muted,
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
          style: TextStyle(fontSize: 13, color: Color(0xFF7C879B)),
        ),
      ],
    );
  }

  Widget _societyCard(ResidentDashboardData dashboard) => Container(
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
          right: -18,
          top: -28,
          child: Container(
            width: 130,
            height: 130,
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
                  Icons.location_on_outlined,
                  color: Color(0xFFDCD8FF),
                  size: 16,
                ),
                const SizedBox(width: 5),
                const Expanded(
                  child: Text(
                    'YOUR HOME',
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
                    'ACTIVE',
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
            const SizedBox(height: 16),
            Text(
              dashboard.societyName ?? 'Society',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 21,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              _unitLabel(dashboard),
              style: const TextStyle(
                color: Color(0xFFE7E4FF),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 19),
            Container(height: 1, color: Colors.white.withValues(alpha: .22)),
            const SizedBox(height: 13),
            Row(
              children: const [
                Icon(
                  Icons.groups_2_outlined,
                  color: Color(0xFFE7E4FF),
                  size: 17,
                ),
                SizedBox(width: 7),
                Text(
                  'A better community, together',
                  style: TextStyle(
                    color: Color(0xFFE7E4FF),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Spacer(),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  );

  Widget _sectionTitle(String title, {required String trailing}) => Row(
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
  );

  Widget _quickActions(BuildContext context) => Row(
    children: [
      Expanded(
        child: _action(
          Icons.receipt_long_rounded,
          'Pay dues',
          const Color(0xFFECE9FF),
          AppColors.indigo,
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: _action(
          Icons.person_add_alt_1_rounded,
          'Visitors',
          const Color(0xFFE4F7F1),
          const Color(0xFF229B78),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: _action(
          Icons.build_outlined,
          'Complaints',
          const Color(0xFFFFF1E5),
          const Color(0xFFE68A36),
          onTap: () => _openHelp(context),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: _action(
          Icons.calendar_month_rounded,
          'Amenities',
          const Color(0xFFE8F1FF),
          const Color(0xFF4784DB),
          onTap: () => _openAmenities(context),
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
            color: Color(0xFF59657A),
          ),
        ),
      ],
    ),
  );

  Future<void> _openHelp(BuildContext context) async {
    setState(() => _selectedTab = 3);
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => ResidentComplaintsScreen(user: widget.user),
      ),
    );
    if (mounted) setState(() => _selectedTab = 0);
  }

  Future<void> _openAmenities(BuildContext context) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => ResidentAmenitiesScreen(
          user: widget.user,
          onBookingCreated: _addUpcomingBooking,
        ),
      ),
    );
  }

  Widget _maintenanceCard(ResidentDashboardData dashboard) {
    final maintenance = dashboard.maintenance;
    if (maintenance == null) {
      return _emptyCard('No outstanding maintenance invoice.');
    }
    final amount = maintenance.amount
        .toStringAsFixed(2)
        .replaceFirst(RegExp(r'\.00$'), '');
    final dueDate = maintenance.dueDate == null
        ? 'Due date unavailable'
        : 'Due ${maintenance.dueDate!.day} ${_monthName(maintenance.dueDate!.month)}';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF3E9),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.account_balance_wallet_outlined,
              color: Color(0xFFE28A38),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  maintenance.description ??
                      maintenance.billingPeriod ??
                      maintenance.invoiceNumber ??
                      'Maintenance invoice',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  dueDate,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF8994A7),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${_currencySymbol(dashboard.currency)} $amount',
                style: const TextStyle(
                  fontSize: 15,
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
        onTap: () => _openHelp(context),
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
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
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
    final dateLabel = date == null ? 'Date unavailable' : '$weekday ${date.day} $month';
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
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
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
                      [timeRange, if (duration.isNotEmpty) duration].join(' · '),
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

  String _weekdayShort(int weekday) => const [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ][weekday - 1];

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
                        _relativeDate(notice.postedAt),
                        style: const TextStyle(
                          fontSize: 9,
                          color: Color(0xFF9AA4B4),
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
                      color: Color(0xFF7F8A9D),
                    ),
                  ),
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
              if (notice.postedAt != null) ...[
                const SizedBox(height: 7),
                Text(
                  '${notice.postedAt!.day} ${_monthName(notice.postedAt!.month)} ${notice.postedAt!.year}',
                  style: const TextStyle(
                    color: Color(0xFF8994A7),
                    fontSize: 12,
                  ),
                ),
              ],
              const SizedBox(height: 18),
              Text(
                notice.description,
                style: const TextStyle(
                  color: Color(0xFF59657A),
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
          const Icon(Icons.cloud_off_rounded, color: AppColors.muted, size: 40),
          const SizedBox(height: 12),
          Text(
            error,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.inkSoft),
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
      style: const TextStyle(fontSize: 12, color: Color(0xFF8994A7)),
    ),
  );

  String _unitLabel(ResidentDashboardData dashboard) {
    final parts = [
      if (dashboard.towerName != null) dashboard.towerName!,
      if (dashboard.unitNumber != null) 'Flat ${dashboard.unitNumber}',
    ];
    return parts.isEmpty ? 'Unit information unavailable' : parts.join('  ·  ');
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
            _tab(Icons.receipt_long_outlined, 'Payments', 1),
            _tab(Icons.people_alt_outlined, 'Community', 2),
            _tab(
              Icons.help_outline_rounded,
              'Help',
              3,
              onTap: () => _openHelp(context),
            ),
            _tab(
              Icons.person_outline_rounded,
              'Profile',
              4,
              onTap: () => _openProfile(context),
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
        onTap: onTap ?? () => setState(() => _selectedTab = index),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 21,
                color: selected ? AppColors.indigo : const Color(0xFFA0AABD),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                  color: selected ? AppColors.indigo : const Color(0xFFA0AABD),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _roundIcon(IconData icon, {bool badge = false}) => Container(
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
