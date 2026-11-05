import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_complaints_api.dart';
import 'new_complaint_screen.dart';

class ResidentComplaintsScreen extends StatefulWidget {
  const ResidentComplaintsScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentComplaintsScreen> createState() =>
      _ResidentComplaintsScreenState();
}

class _ResidentComplaintsScreenState extends State<ResidentComplaintsScreen>
    with WidgetsBindingObserver {
  static const _pageBackground = Color(0xFFF5F7FB);
  static const _statusRefreshInterval = Duration(seconds: 2);

  late Future<List<ResidentComplaint>> _complaintsFuture;
  final List<ResidentComplaint> _knownComplaints = [];
  final ValueNotifier<List<ResidentComplaint>> _complaintsNotifier =
      ValueNotifier(const []);
  Timer? _statusRefreshTimer;
  Timer? _statusReconnectTimer;
  StreamSubscription<ComplaintStatusUpdate>? _statusSubscription;
  bool _statusRefreshInProgress = false;
  bool _manualRefreshInProgress = false;
  int _refreshRequestVersion = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _complaintsFuture = _loadComplaints();
    _startStatusRefresh();
    _connectStatusStream();
  }

  @override
  void dispose() {
    _statusRefreshTimer?.cancel();
    _statusReconnectTimer?.cancel();
    _statusSubscription?.cancel();
    _complaintsNotifier.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startStatusRefresh();
      _refreshStatuses();
      _connectStatusStream();
    } else {
      _statusRefreshTimer?.cancel();
      _statusRefreshTimer = null;
      _statusReconnectTimer?.cancel();
      _statusReconnectTimer = null;
      final subscription = _statusSubscription;
      _statusSubscription = null;
      subscription?.cancel();
    }
  }

  void _startStatusRefresh() {
    _statusRefreshTimer?.cancel();
    _statusRefreshTimer = Timer.periodic(
      _statusRefreshInterval,
      (_) => _refreshStatuses(),
    );
  }

  void _connectStatusStream() {
    if (!mounted || _statusSubscription != null) return;
    _statusSubscription = ResidentComplaintsApi.watchStatus(
      widget.user.accessToken,
    ).listen(
      _applyStatusUpdate,
      onError: (_) {
        _statusSubscription = null;
        _scheduleStatusReconnect();
      },
      onDone: () {
        _statusSubscription = null;
        _scheduleStatusReconnect();
      },
      cancelOnError: true,
    );
  }

  void _scheduleStatusReconnect() {
    if (!mounted ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed) {
      return;
    }
    _statusReconnectTimer?.cancel();
    _statusReconnectTimer = Timer(
      const Duration(seconds: 1),
      _connectStatusStream,
    );
  }

  void _applyStatusUpdate(ComplaintStatusUpdate update) {
    if (update.ticketId.isEmpty || update.status.isEmpty) return;
    _refreshRequestVersion++;
    final index = _knownComplaints.indexWhere(
      (complaint) => complaint.id == update.ticketId,
    );
    if (index < 0) return;

    _knownComplaints[index] = _knownComplaints[index].withStatus(update.status);
    final complaints = List<ResidentComplaint>.unmodifiable(_knownComplaints);
    _complaintsNotifier.value = complaints;
    if (mounted) {
      setState(() => _complaintsFuture = Future.value(complaints));
    }
  }

  Future<void> _refreshStatuses() async {
    if (!mounted || _statusRefreshInProgress || _manualRefreshInProgress) return;
    _statusRefreshInProgress = true;
    final requestVersion = ++_refreshRequestVersion;
    try {
      final incoming = await ResidentComplaintsApi.listComplaints(
        widget.user.accessToken,
      );
      if (!mounted || requestVersion != _refreshRequestVersion) return;
      final complaints = _mergeComplaints(incoming);
      if (mounted) {
        setState(() => _complaintsFuture = Future.value(complaints));
      }
    } catch (_) {
      // Keep showing the last loaded statuses if the network is unavailable.
    } finally {
      _statusRefreshInProgress = false;
    }
  }

  Future<List<ResidentComplaint>> _loadComplaints() async {
    final complaints = await ResidentComplaintsApi.listComplaints(
      widget.user.accessToken,
    );
    return _mergeComplaints(complaints);
  }

  List<ResidentComplaint> _mergeComplaints(
    Iterable<ResidentComplaint> incoming,
  ) {
    final byId = <String, ResidentComplaint>{
      for (final complaint in _knownComplaints) complaint.id: complaint,
    };
    for (final complaint in incoming) {
      byId[complaint.id] = complaint;
    }
    _knownComplaints
      ..clear()
      ..addAll(byId.values)
      ..sort((a, b) =>
          (b.openedAt ?? DateTime.fromMillisecondsSinceEpoch(0))
              .compareTo(a.openedAt ?? DateTime.fromMillisecondsSinceEpoch(0)));
    if (mounted) _complaintsNotifier.value = List.unmodifiable(_knownComplaints);
    return List.unmodifiable(_knownComplaints);
  }

  Future<void> _refresh() async {
    if (_manualRefreshInProgress) return;
    setState(() => _manualRefreshInProgress = true);
    final requestVersion = ++_refreshRequestVersion;
    try {
      final incoming = await ResidentComplaintsApi.listComplaints(
        widget.user.accessToken,
      );
      if (!mounted || requestVersion != _refreshRequestVersion) return;
      final complaints = _mergeComplaints(incoming);
      setState(() => _complaintsFuture = Future.value(complaints));
    } catch (_) {
      // Keep the current list visible when refresh fails; don't interrupt the
      // resident with a popup.
    } finally {
      if (mounted) setState(() => _manualRefreshInProgress = false);
    }
  }

  Future<void> _newComplaint() async {
    final created = await Navigator.of(context).push<ResidentComplaint>(
      MaterialPageRoute<ResidentComplaint>(
        builder: (_) => NewComplaintScreen(user: widget.user),
      ),
    );
    if (created != null && mounted) {
      setState(() {
        final complaints = _mergeComplaints([created]);
        _complaintsFuture = Future.value(complaints);
      });
      _reloadAfterCreate();
    }
  }

  Future<void> _reloadAfterCreate() async {
    try {
      final complaints = await _loadComplaints();
      if (mounted) setState(() => _complaintsFuture = Future.value(complaints));
    } catch (_) {
      // Keep the successful create response visible if the follow-up list
      // request is briefly delayed or unavailable.
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: _pageBackground,
        appBar: AppBar(
          backgroundColor: _pageBackground,
          title: const Text('Help & Complaints'),
          actions: [
            IconButton(
              tooltip: 'Refresh complaint statuses',
              onPressed: _manualRefreshInProgress ? null : _refresh,
              icon: _manualRefreshInProgress
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _newComplaint,
          backgroundColor: AppColors.indigo,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add_rounded),
          label: const Text('New complaint'),
        ),
        body: SafeArea(
          child: RefreshIndicator(
            color: AppColors.indigo,
            onRefresh: _refresh,
            child: FutureBuilder<List<ResidentComplaint>>(
              future: _complaintsFuture,
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return _messageState(
                    snapshot.error.toString(),
                    retry: () => setState(() => _complaintsFuture = _loadComplaints()),
                  );
                }
                if (!snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppColors.indigo),
                  );
                }
                final complaints = snapshot.data!;
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                  children: [
                    _header(complaints),
                    const SizedBox(height: 22),
                    if (complaints.isEmpty)
                      _emptyState()
                    else
                      ...complaints.map((complaint) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _complaintCard(complaint),
                          )),
                  ],
                );
              },
            ),
          ),
        ),
      );

  Widget _header(List<ResidentComplaint> complaints) {
    final open = complaints
        .where((item) => item.status.toUpperCase() == 'OPEN')
        .length;
    final inProgress = complaints
        .where((item) => const {'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'}
            .contains(item.status.toUpperCase()))
        .length;
    final resolved = complaints
        .where((item) => const {'RESOLVED', 'CLOSED'}
            .contains(item.status.toUpperCase()))
        .length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Your requests',
          style: TextStyle(
            color: AppColors.ink,
            fontSize: 30,
            fontWeight: FontWeight.w600,
            letterSpacing: -.5,
          ),
        ),
        const SizedBox(height: 17),
        Row(
          children: [
            Expanded(
              child: _requestCount(open, 'Open', const Color(0xFFD98236)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _requestCount(
                inProgress,
                'In progress',
                const Color(0xFF4A74CB),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _requestCount(resolved, 'Resolved', const Color(0xFF27866F)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _requestCount(int count, String label, Color backgroundColor) => Container(
        height: 84,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$count',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white.withValues(alpha: .85),
                fontSize: 12,
              ),
            ),
          ],
        ),
      );

  Widget _complaintCard(ResidentComplaint complaint) => Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showDetails(complaint),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFEBEFF5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        complaint.subject,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _statusBadge(complaint.status),
                  ],
                ),
                const SizedBox(height: 9),
                Text(
                  complaint.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF7F8A9D),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 13),
                Row(
                  children: [
                    if (complaint.categoryName != null) ...[
                      Icon(
                        Icons.label_outline_rounded,
                        size: 14,
                        color: AppColors.indigo.withValues(alpha: .8),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          complaint.categoryName!,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.indigo,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Expanded(
                      child: Text(
                        complaint.ticketNumber,
                        textAlign: TextAlign.end,
                        style: const TextStyle(
                          color: Color(0xFF8994A7),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );

  Widget _statusBadge(String status) {
    final color = switch (status.toUpperCase()) {
      'RESOLVED' || 'CLOSED' => const Color(0xFF229B78),
      'IN_PROGRESS' || 'ASSIGNED' => const Color(0xFF4784DB),
      'ON_HOLD' => const Color(0xFFE28A38),
      _ => AppColors.indigo,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Future<void> _showDetails(ResidentComplaint complaint) =>
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) => ValueListenableBuilder<List<ResidentComplaint>>(
          valueListenable: _complaintsNotifier,
          builder: (context, complaints, _) {
            final currentComplaint = complaints
                .firstWhere((item) => item.id == complaint.id,
                    orElse: () => complaint);
            return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    currentComplaint.ticketNumber,
                    style: const TextStyle(
                      color: AppColors.indigo,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    currentComplaint.subject,
                    style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _statusBadge(currentComplaint.status),
                  if (currentComplaint.categoryName != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Category  ·  ${currentComplaint.categoryName}',
                      style: const TextStyle(
                        color: Color(0xFF7F8A9D),
                        fontSize: 12,
                      ),
                    ),
                  ],
                  const SizedBox(height: 18),
                  Text(
                    currentComplaint.description,
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
            );
          },
        ),
      );

  Widget _emptyState() => Container(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: const Column(
          children: [
            Icon(Icons.inbox_outlined, color: AppColors.muted, size: 42),
            SizedBox(height: 12),
            Text(
              'No complaints yet',
              style: TextStyle(
                color: AppColors.ink,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Submit a complaint and the society team will follow up.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF8994A7), fontSize: 12),
            ),
          ],
        ),
      );

  Widget _messageState(String message, {VoidCallback? retry}) =>
      ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(28),
        children: [
          const SizedBox(height: 100),
          Text(message, textAlign: TextAlign.center),
          if (retry != null) ...[
            const SizedBox(height: 14),
            Center(child: FilledButton(onPressed: retry, child: const Text('Try again'))),
          ],
        ],
      );
}
