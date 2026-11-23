import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../widgets/resident_back_button.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_complaints_api.dart';
import 'new_complaint_screen.dart';

class ResidentComplaintsScreen extends StatefulWidget {
  const ResidentComplaintsScreen({super.key, required this.user, this.onBack});

  final AuthenticatedUser user;
  final VoidCallback? onBack;

  @override
  State<ResidentComplaintsScreen> createState() =>
      _ResidentComplaintsScreenState();
}

class _ResidentComplaintsScreenState extends State<ResidentComplaintsScreen>
    with WidgetsBindingObserver {
  static const _pageBackground = AppColors.canvas;
  static const _soft = Color(0xFF5B6479);
  static const _border = Color(0xFFE3E7EF);
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
  int _statusTab = 0;

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

  // Which complaints the selected tab shows.
  List<ResidentComplaint> _visibleComplaints(List<ResidentComplaint> all) {
    switch (_statusTab) {
      case 1:
        return all
            .where((item) => item.status.toUpperCase() == 'OPEN')
            .toList();
      case 2:
        return all
            .where((item) => const {'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'}
                .contains(item.status.toUpperCase()))
            .toList();
      case 3:
        return all
            .where((item) => const {'RESOLVED', 'CLOSED'}
                .contains(item.status.toUpperCase()))
            .toList();
      default:
        return all;
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: _pageBackground,
        appBar: AppBar(
          backgroundColor: _pageBackground,
          leading: ResidentBackButton(
            onPressed: widget.onBack ?? () => Navigator.of(context).maybePop(),
          ),
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
          backgroundColor: AppColors.navy,
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
                final visible = _visibleComplaints(complaints);
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                  children: [
                    _header(complaints),
                    const SizedBox(height: 18),
                    _TabContent(
                      stateKey: _statusTab,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (complaints.isEmpty)
                            _emptyState()
                          else if (visible.isEmpty)
                            _filteredEmptyState()
                          else
                            ...visible.asMap().entries.map((entry) => _FadeIn(
                                  index: entry.key,
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: _complaintCard(entry.value),
                                  ),
                                )),
                        ],
                      ),
                    ),
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
            fontSize: 28,
            fontWeight: FontWeight.w600,
            letterSpacing: -.5,
          ),
        ),
        const SizedBox(height: 16),
        _TabStrip(
          labels: const ['All', 'Open', 'In progress', 'Resolved'],
          counts: [complaints.length, open, inProgress, resolved],
          selected: _statusTab,
          color: _tabColor(context),
          scrollable: true,
          onChanged: (index) => setState(() => _statusTab = index),
        ),
      ],
    );
  }

  Color _statusColor(String status) => switch (status.toUpperCase()) {
        'RESOLVED' || 'CLOSED' => const Color(0xFF229B78),
        'IN_PROGRESS' || 'ASSIGNED' => const Color(0xFF4784DB),
        'ON_HOLD' => const Color(0xFFE28A38),
        _ => AppColors.indigo,
      };

  Widget _complaintCard(ResidentComplaint complaint) => _HoverLift(
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _showDetails(complaint),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 4, color: _statusColor(complaint.status)),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
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
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
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
                              color: _soft,
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Divider(height: 1, thickness: 1, color: _border),
                          const SizedBox(height: 10),
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
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                              ],
                              Expanded(
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.centerRight,
                                  child: Text(
                                    complaint.ticketNumber,
                                    maxLines: 1,
                                    softWrap: false,
                                    textAlign: TextAlign.end,
                                    style: const TextStyle(
                                      color: _soft,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ));

  Widget _statusBadge(String status) {
    final color = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 10,
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
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
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
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    currentComplaint.subject,
                    style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _statusBadge(currentComplaint.status),
                  if (currentComplaint.categoryName != null) ...[
                    const SizedBox(height: 16),
                    const Divider(height: 1, thickness: 1, color: _border),
                    const SizedBox(height: 14),
                    Text(
                      'Category  ·  ${currentComplaint.categoryName}',
                      style: const TextStyle(
                        color: _soft,
                        fontSize: 13,
                      ),
                    ),
                  ],
                  const SizedBox(height: 18),
                  Text(
                    currentComplaint.description,
                    style: const TextStyle(
                      color: AppColors.ink,
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
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: const Column(
          children: [
            Icon(Icons.inbox_outlined, color: _soft, size: 40),
            SizedBox(height: 12),
            Text(
              'No complaints yet',
              style: TextStyle(
                color: AppColors.ink,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Submit a complaint and the society team will follow up.',
              textAlign: TextAlign.center,
              style: TextStyle(color: _soft, fontSize: 13),
            ),
          ],
        ),
      );

  Widget _filteredEmptyState() => Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: const Text(
          'No complaints in this status.',
          textAlign: TextAlign.center,
          style: TextStyle(color: _soft, fontSize: 13),
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

/// Colour used by the app's buttons, read from the theme so tabs always match.
Color _tabColor(BuildContext context) {
  final theme = Theme.of(context);
  return theme.filledButtonTheme.style?.backgroundColor?.resolve(
        const <WidgetState>{},
      ) ??
      theme.colorScheme.primary;
}

/// Segmented tab strip. The selected tab is filled with [color]; the fill
/// fades in/out smoothly when the selection changes, and unselected tabs get a
/// light tint on hover.
class _TabStrip extends StatefulWidget {
  const _TabStrip({
    required this.labels,
    required this.selected,
    required this.onChanged,
    required this.color,
    this.counts,
    this.scrollable = false,
  });

  final List<String> labels;
  final List<int>? counts;
  final int selected;
  final ValueChanged<int> onChanged;
  final Color color;
  final bool scrollable;

  @override
  State<_TabStrip> createState() => _TabStripState();
}

class _TabStripState extends State<_TabStrip> {
  int? _hover;

  @override
  Widget build(BuildContext context) {
    final row = Row(
      mainAxisSize: widget.scrollable ? MainAxisSize.min : MainAxisSize.max,
      children: [
        for (var i = 0; i < widget.labels.length; i++)
          widget.scrollable ? _tab(i) : Expanded(child: _tab(i)),
      ],
    );
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE9ECF3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: widget.scrollable
          ? SingleChildScrollView(scrollDirection: Axis.horizontal, child: row)
          : row,
    );
  }

  Widget _tab(int i) {
    final selected = i == widget.selected;
    final hovered = _hover == i && !selected;
    final color = widget.color;
    final count = widget.counts?[i];
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = i),
      onExit: (_) {
        if (_hover == i) setState(() => _hover = null);
      },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => widget.onChanged(i),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          alignment: Alignment.center,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? color
                : hovered
                ? color.withValues(alpha: .10)
                : color.withValues(alpha: 0),
            borderRadius: BorderRadius.circular(9),
          ),
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOutCubic,
            style: TextStyle(
              color: selected
                  ? Colors.white
                  : hovered
                  ? color
                  : const Color(0xFF5B6479),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    widget.labels[i],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (count != null) ...[
                  const SizedBox(width: 6),
                  Opacity(
                    opacity: .75,
                    child: Text(
                      '$count',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Fades/slides tab content in and out and animates the height, so switching
/// tabs never jumps.
class _TabContent extends StatelessWidget {
  const _TabContent({required this.stateKey, required this.child});

  final Object stateKey;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOutCubic,
      alignment: Alignment.topCenter,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
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
        transitionBuilder: (child, animation) => FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, .03),
              end: Offset.zero,
            ).animate(animation),
            child: child,
          ),
        ),
        child: KeyedSubtree(key: ValueKey<Object>(stateKey), child: child),
      ),
    );
  }
}

/// Small staggered entrance for list items.
class _FadeIn extends StatelessWidget {
  const _FadeIn({required this.index, required this.child});

  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
        tween: Tween<double>(begin: 0, end: 1),
        duration: Duration(milliseconds: 320 + (index > 8 ? 8 : index) * 60),
        curve: Curves.easeOutCubic,
        builder: (context, value, child) => Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, (1 - value) * 10),
            child: child,
          ),
        ),
        child: child,
      );
}

/// Lifts a tappable card slightly on hover (web / desktop).
class _HoverLift extends StatefulWidget {
  const _HoverLift({required this.child});

  final Widget child;

  @override
  State<_HoverLift> createState() => _HoverLiftState();
}

class _HoverLiftState extends State<_HoverLift> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) => MouseRegion(
        onEnter: (_) => setState(() => _hover = true),
        onExit: (_) => setState(() => _hover = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          transform: Matrix4.translationValues(0, _hover ? -2 : 0, 0),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            boxShadow: _hover
                ? const [
                    BoxShadow(
                      color: Color(0x1A4F46E5),
                      blurRadius: 14,
                      offset: Offset(0, 6),
                    ),
                  ]
                : const [],
          ),
          child: widget.child,
        ),
      );
}
