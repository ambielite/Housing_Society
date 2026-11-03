import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../../complaints/screens/resident_complaints_screen.dart';
import '../data/resident_dashboard_api.dart';

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
  Timer? _noticeRefreshTimer;

  String get _firstName => widget.user.name.trim().split(' ').first;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _dashboardFuture = ResidentDashboardApi.load(widget.user.accessToken);
    _noticeRefreshTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) {
        if (mounted &&
            WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
          _reloadDashboard();
        }
      },
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _reloadDashboard();
  }

  @override
  void dispose() {
    _noticeRefreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  void _reloadDashboard() {
    setState(() {
      _dashboardFuture = ResidentDashboardApi.load(widget.user.accessToken);
    });
  }

  Future<void> _refreshDashboard() async {
    final next = ResidentDashboardApi.load(widget.user.accessToken);
    setState(() => _dashboardFuture = next);
    await next;
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
                          sliver: SliverList.list(children: [
                            _topBar(context, dashboard),
                            const SizedBox(height: 26),
                            _greeting(),
                            const SizedBox(height: 22),
                            _societyCard(dashboard),
                            const SizedBox(height: 25),
                            _sectionTitle('Quick actions', trailing: 'See all'),
                            const SizedBox(height: 14),
                            _quickActions(context),
                            const SizedBox(height: 27),
                            _sectionTitle('Maintenance', trailing: 'View details'),
                            const SizedBox(height: 13),
                            _maintenanceCard(dashboard),
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
                          ]),
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
                ? const Icon(Icons.apartment_rounded,
                    color: AppColors.indigo, size: 24)
                : ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.network(
                      dashboard.societyLogoUrl!,
                      width: 44,
                      height: 44,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
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
                Text(dashboard.societyName ?? 'Society', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.1, color: AppColors.ink)),
                SizedBox(height: 2),
                Text('RESIDENT PORTAL', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 1.3, color: AppColors.muted)),
              ],
            ),
          ),
          _roundIcon(Icons.notifications_none_rounded,
              badge: dashboard.notices.isNotEmpty),
          const SizedBox(width: 9),
          PopupMenuButton<String>(
            tooltip: 'Account',
            onSelected: (value) {
              if (value == 'logout') {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
                  (_) => false,
                );
              }
            },
            itemBuilder: (_) => const [PopupMenuItem(value: 'logout', child: Text('Sign out'))],
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
          errorBuilder: (_, __, ___) => Center(
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
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    final date = '${weekdays[now.weekday - 1]}, ${now.day} ${months[now.month - 1]}';
    return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(date.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.15, color: AppColors.muted)),
          const SizedBox(height: 7),
          Text('$greeting, $_firstName 👋', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.65, color: AppColors.ink)),
          const SizedBox(height: 5),
          const Text('Here’s what’s happening in your community.', style: TextStyle(fontSize: 13, color: Color(0xFF7C879B))),
        ],
      );
  }

  Widget _societyCard(ResidentDashboardData dashboard) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          gradient: const LinearGradient(colors: [Color(0xFF6557E9), Color(0xFF8878F6)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          boxShadow: const [BoxShadow(color: Color(0x286455E9), blurRadius: 20, offset: Offset(0, 10))],
        ),
        child: Stack(children: [
          Positioned(right: -18, top: -28, child: Container(width: 130, height: 130, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: .08)))),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.location_on_outlined, color: Color(0xFFDCD8FF), size: 16),
              const SizedBox(width: 5),
              const Expanded(child: Text('YOUR HOME', style: TextStyle(color: Color(0xFFE2DFFF), fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.25))),
              Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5), decoration: BoxDecoration(color: Colors.white.withValues(alpha: .17), borderRadius: BorderRadius.circular(20)), child: const Text('ACTIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: .7))),
            ]),
            const SizedBox(height: 16),
            Text(dashboard.societyName ?? 'Society', style: const TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w800)),
            const SizedBox(height: 5),
            Text(_unitLabel(dashboard), style: const TextStyle(color: Color(0xFFE7E4FF), fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 19),
            Container(height: 1, color: Colors.white.withValues(alpha: .22)),
            const SizedBox(height: 13),
            Row(children: const [
              Icon(Icons.groups_2_outlined, color: Color(0xFFE7E4FF), size: 17),
              SizedBox(width: 7),
              Text('A better community, together', style: TextStyle(color: Color(0xFFE7E4FF), fontSize: 11, fontWeight: FontWeight.w500)),
              Spacer(),
              Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
            ]),
          ]),
        ]),
      );

  Widget _sectionTitle(String title, {required String trailing}) => Row(
        children: [
          Expanded(child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: -.25, color: AppColors.ink))),
          Text(trailing, style: const TextStyle(fontSize: 11, color: AppColors.indigo, fontWeight: FontWeight.w700)),
          const SizedBox(width: 2),
          const Icon(Icons.chevron_right_rounded, color: AppColors.indigo, size: 17),
        ],
      );

  Widget _quickActions(BuildContext context) => Row(children: [
        Expanded(child: _action(Icons.receipt_long_rounded, 'Pay dues', const Color(0xFFECE9FF), AppColors.indigo)),
        const SizedBox(width: 10),
        Expanded(child: _action(Icons.person_add_alt_1_rounded, 'Visitors', const Color(0xFFE4F7F1), const Color(0xFF229B78))),
        const SizedBox(width: 10),
        Expanded(child: _action(Icons.build_outlined, 'Complaints', const Color(0xFFFFF1E5), const Color(0xFFE68A36), onTap: () => _openHelp(context))),
        const SizedBox(width: 10),
        Expanded(child: _action(Icons.calendar_month_rounded, 'Amenities', const Color(0xFFE8F1FF), const Color(0xFF4784DB))),
      ]);

  Widget _action(IconData icon, String label, Color background, Color foreground, {VoidCallback? onTap}) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Column(children: [
        Container(width: 56, height: 56, decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(18)), child: Icon(icon, color: foreground, size: 23)),
        const SizedBox(height: 8),
        Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF59657A))),
      ]));

  Future<void> _openHelp(BuildContext context) async {
    setState(() => _selectedTab = 3);
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => ResidentComplaintsScreen(user: widget.user),
      ),
    );
    if (mounted) setState(() => _selectedTab = 0);
  }

  Widget _maintenanceCard(ResidentDashboardData dashboard) {
    final maintenance = dashboard.maintenance;
    if (maintenance == null) return _emptyCard('No outstanding maintenance invoice.');
    final amount = maintenance.amount.toStringAsFixed(2).replaceFirst(RegExp(r'\.00$'), '');
    final dueDate = maintenance.dueDate == null
        ? 'Due date unavailable'
        : 'Due ${maintenance.dueDate!.day} ${_monthName(maintenance.dueDate!.month)}';
    return Container(
        padding: const EdgeInsets.all(16),
        decoration: _cardDecoration(),
        child: Row(children: [
          Container(width: 44, height: 44, decoration: BoxDecoration(color: const Color(0xFFFFF3E9), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.account_balance_wallet_outlined, color: Color(0xFFE28A38), size: 22)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(maintenance.description ?? maintenance.billingPeriod ?? maintenance.invoiceNumber ?? 'Maintenance invoice', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.ink)),
            SizedBox(height: 5),
            Text(dueDate, style: const TextStyle(fontSize: 10, color: Color(0xFF8994A7))),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('${_currencySymbol(dashboard.currency)} $amount', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.ink)),
            const SizedBox(height: 6),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: const Color(0xFFFFF4E7), borderRadius: BorderRadius.circular(20)), child: Text(maintenance.status.replaceAll('_', ' '), style: const TextStyle(color: Color(0xFFD1802E), fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: .5))),
          ]),
        ]),
      );
  }

  Widget _noticeCard(ResidentNotice notice) => Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showNotice(notice),
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: _cardDecoration(),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(width: 40, height: 40, decoration: BoxDecoration(color: const Color(0xFFEAF1FF), borderRadius: BorderRadius.circular(13)), child: const Icon(Icons.campaign_outlined, color: Color(0xFF4D7FCE), size: 21)),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [Expanded(child: Text(notice.title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.ink))), Text(_relativeDate(notice.postedAt), style: const TextStyle(fontSize: 9, color: Color(0xFF9AA4B4)))]),
                const SizedBox(height: 6),
                Text(notice.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, height: 1.45, color: Color(0xFF7F8A9D))),
                const SizedBox(height: 8),
                const Text('Tap to read', style: TextStyle(fontSize: 10, color: AppColors.indigo, fontWeight: FontWeight.w700)),
              ])),
            ]),
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
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.cloud_off_rounded, color: AppColors.muted, size: 40),
            const SizedBox(height: 12),
            Text(error, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.inkSoft)),
            const SizedBox(height: 14),
            FilledButton(onPressed: _reloadDashboard, child: const Text('Try again')),
          ]),
        ),
      );

  Widget _emptyCard(String message) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: _cardDecoration(),
        child: Text(message, style: const TextStyle(fontSize: 12, color: Color(0xFF8994A7))),
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
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
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
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Color(0xFFEAEFF5)))),
        child: SafeArea(top: false, child: Padding(padding: const EdgeInsets.fromLTRB(8, 9, 8, 5), child: Row(children: [
          _tab(Icons.home_rounded, 'Home', 0),
          _tab(Icons.receipt_long_outlined, 'Payments', 1),
          _tab(Icons.people_alt_outlined, 'Community', 2),
          _tab(Icons.notifications_none, 'Help', 3, onTap: () => _openHelp(context)),
          _tab(Icons.person_outline_rounded, 'Profile', 4),
        ]))),
      );

  Widget _tab(IconData icon, String label, int index, {VoidCallback? onTap}) {
    final selected = _selectedTab == index;
    return Expanded(child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap ?? () => setState(() => _selectedTab = index),
      child: Padding(padding: const EdgeInsets.symmetric(vertical: 5), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 21, color: selected ? AppColors.indigo : const Color(0xFFA0AABD)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 9, fontWeight: selected ? FontWeight.w800 : FontWeight.w600, color: selected ? AppColors.indigo : const Color(0xFFA0AABD))),
      ])),
    ));
  }

  Widget _roundIcon(IconData icon, {bool badge = false}) => Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: const Color(0xFFE8ECF3))),
        child: Stack(alignment: Alignment.center, children: [
          Icon(icon, color: const Color(0xFF68748A), size: 21),
          if (badge) const Positioned(right: 10, top: 9, child: DecoratedBox(decoration: BoxDecoration(color: Color(0xFFFF6F72), shape: BoxShape.circle), child: SizedBox(width: 7, height: 7))),
        ]),
      );

  BoxDecoration _cardDecoration() => BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFEBEFF5)), boxShadow: const [BoxShadow(color: Color(0x080F1A35), blurRadius: 14, offset: Offset(0, 5))]);

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
    if (parts.isEmpty) return 'R';
    return parts.take(2).map((part) => part[0].toUpperCase()).join();
  }
}
