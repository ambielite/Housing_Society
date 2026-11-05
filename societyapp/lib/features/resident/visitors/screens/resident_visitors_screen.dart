import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_visitors_api.dart';

class ResidentVisitorsScreen extends StatefulWidget {
  const ResidentVisitorsScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentVisitorsScreen> createState() => _ResidentVisitorsScreenState();
}

class _ResidentVisitorsScreenState extends State<ResidentVisitorsScreen>
    with WidgetsBindingObserver {
  static const _pageBackground = Color(0xFFF5F7FB);
  List<ResidentVisitorRecord> _pending = const [];
  List<ResidentVisitorRecord> _history = const [];
  Timer? _pollTimer;
  bool _loading = true;
  bool _refreshing = false;
  final Set<String> _deciding = {};
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
    _startPolling();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refresh();
      _startPolling();
    } else {
      _pollTimer?.cancel();
      _pollTimer = null;
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _refresh());
  }

  Future<void> _refresh() async {
    if (_refreshing || !mounted) return;
    _refreshing = true;
    try {
      final results = await Future.wait([
        ResidentVisitorsApi.listPending(widget.user.accessToken),
        ResidentVisitorsApi.listHistory(widget.user.accessToken),
      ]);
      if (!mounted) return;
      setState(() {
        _pending = results[0];
        _history = results[1];
        _error = null;
        _loading = false;
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _loading = false;
        });
      }
    } finally {
      _refreshing = false;
    }
  }

  Future<void> _decide(ResidentVisitorRecord visitor, String decision) async {
    if (!_deciding.add(visitor.id)) return;
    setState(() {});
    try {
      await ResidentVisitorsApi.decide(
        token: widget.user.accessToken,
        passId: visitor.id,
        decision: decision,
      );
      if (mounted) {
        setState(() => _pending.removeWhere((item) => item.id == visitor.id));
      }
      await _refresh();
    } on ResidentVisitorException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _deciding.remove(visitor.id));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: _pageBackground,
        appBar: AppBar(
          backgroundColor: _pageBackground,
          foregroundColor: AppColors.ink,
          elevation: 0,
          title: const Text('Visitors'),
          actions: [
            IconButton(
              tooltip: 'Refresh visitors',
              onPressed: _refreshing ? null : _refresh,
              icon: _refreshing
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: SafeArea(
          child: RefreshIndicator(
            color: AppColors.indigo,
            onRefresh: _refresh,
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.indigo))
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
                    children: [
                      _summary(),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          const Expanded(
                            child: Text('Waiting for your response',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink)),
                          ),
                          _count(_pending.length),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_pending.isEmpty)
                        _emptyCard('No visitors are waiting for approval.')
                      else
                        ..._pending.map((visitor) => Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: _visitorCard(visitor, pending: true),
                            )),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          const Expanded(
                            child: Text('Visitor history',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink)),
                          ),
                          Text('${_history.length} records',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF8792A7))),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_history.isEmpty)
                        _emptyCard('Visitor records will appear here when security registers a visitor for your home.')
                      else
                        _historyCard(),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Color(0xFFB42318), fontSize: 12)),
                      ],
                    ],
                  ),
          ),
        ),
      );

  Widget _summary() {
    final entered = _history.where((item) => item.status == 'INSIDE' || item.status == 'EXITED').length;
    final rejected = _history.where((item) => item.residentDecision == 'REJECTED').length;
    final expected = _history.where((item) => item.status == 'EXPECTED').length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Gate activity', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.ink)),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _stat(entered, 'Entered', const Color(0xFF27866F))),
          const SizedBox(width: 10),
          Expanded(child: _stat(expected, 'Expected', AppColors.indigo)),
          const SizedBox(width: 10),
          Expanded(child: _stat(rejected, 'Rejected', const Color(0xFFD65A54))),
        ]),
      ],
    );
  }

  Widget _stat(int count, String label, Color color) => Container(
        height: 82,
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(18)),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('$count', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 5),
          Text(label, style: TextStyle(color: Colors.white.withValues(alpha: .9), fontSize: 11)),
        ]),
      );

  Widget _visitorCard(ResidentVisitorRecord visitor, {required bool pending}) {
    final busy = _deciding.contains(visitor.id);
    final initials = visitor.visitorName.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).take(2).map((part) => part[0].toUpperCase()).join();
    final details = '${_label(visitor.visitorType)} · ${visitor.gateName} · ${_dateLabel(visitor.createdAt)}';
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE8ECF3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(radius: 24, backgroundColor: const Color(0xFFECE9FF), child: Text(initials.isEmpty ? 'V' : initials, style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w700))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(visitor.visitorName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.ink, fontWeight: FontWeight.w800, fontSize: 15)),
            const SizedBox(height: 4),
            Text(details, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF8792A7), fontSize: 11)),
          ])),
          _statusChip(pending ? 'Waiting' : _statusLabel(visitor)),
        ]),
        if (pending) ...[
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: SizedBox(height: 44, child: FilledButton.icon(onPressed: busy ? null : () => _decide(visitor, 'APPROVED'), icon: busy ? const SizedBox.square(dimension: 15, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.check_rounded, size: 18), label: const Text('Approve'), style: FilledButton.styleFrom(backgroundColor: AppColors.indigo, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)))))),
            const SizedBox(width: 10),
            Expanded(child: SizedBox(height: 44, child: OutlinedButton.icon(onPressed: busy ? null : () => _decide(visitor, 'REJECTED'), icon: const Icon(Icons.close_rounded, size: 18), label: const Text('Reject'), style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFD65A54), side: const BorderSide(color: Color(0xFFD65A54)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13))))))
          ]),
        ],
      ]),
    );
  }

  Widget _historyCard() => Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE8ECF3))),
        child: Column(children: [
          for (var i = 0; i < _history.length; i++) ...[
            _historyItem(_history[i]),
            if (i != _history.length - 1) const Divider(height: 1, indent: 14, endIndent: 14, color: Color(0xFFEAEFF5)),
          ],
        ]),
      );

  Widget _historyItem(ResidentVisitorRecord visitor) {
    final initials = visitor.visitorName
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(
        children: [
          CircleAvatar(
            radius: 21,
            backgroundColor: const Color(0xFFECE9FF),
            child: Text(initials.isEmpty ? 'V' : initials,
                style: const TextStyle(
                    color: AppColors.indigo, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(visitor.visitorName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 14,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                    '${_label(visitor.visitorType)} · ${visitor.gateName} · ${_dateLabel(visitor.createdAt)}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Color(0xFF8792A7), fontSize: 10)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _statusChip(_statusLabel(visitor)),
        ],
      ),
    );
  }

  Widget _statusChip(String label) {
    final rejected = label.toUpperCase() == 'REJECTED';
    final done = const {'ENTERED', 'EXITED', 'INSIDE'}.contains(label.toUpperCase());
    final color = rejected ? const Color(0xFFD65A54) : done ? const Color(0xFF27866F) : AppColors.indigo;
    return Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6), decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(20)), child: Text(label, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w800)));
  }

  Widget _count(int value) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: const Color(0xFFECE9FF), borderRadius: BorderRadius.circular(20)), child: Text('$value', style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w800, fontSize: 12)));

  Widget _emptyCard(String text) => Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE8ECF3))), child: Text(text, style: const TextStyle(color: Color(0xFF8792A7), fontSize: 13)));

  String _statusLabel(ResidentVisitorRecord visitor) => visitor.residentDecision == 'REJECTED' ? 'Rejected' : _label(visitor.status);
  String _label(String value) => value.replaceAll('_', ' ').toLowerCase().split(' ').map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}').join(' ');
  String _dateLabel(DateTime? date) {
    if (date == null) return 'Date unavailable';
    final local = date.toLocal();
    final today = DateTime.now();
    final localDay = DateTime(local.year, local.month, local.day);
    final todayDay = DateTime(today.year, today.month, today.day);
    final dayDifference = todayDay.difference(localDay).inDays;
    final day = dayDifference == 0
        ? 'Today'
        : dayDifference == 1
            ? 'Yesterday'
            : '${local.day}/${local.month}/${local.year}';
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day, $hour:$minute ${local.hour >= 12 ? 'PM' : 'AM'}';
  }
}
