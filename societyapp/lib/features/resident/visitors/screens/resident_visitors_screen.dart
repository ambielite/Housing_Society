import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../app/theme/app_colors.dart';
import '../../widgets/resident_back_button.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_visitors_api.dart';

class ResidentVisitorsScreen extends StatefulWidget {
  const ResidentVisitorsScreen({super.key, required this.user, this.onBack});

  final AuthenticatedUser user;
  final VoidCallback? onBack;

  @override
  State<ResidentVisitorsScreen> createState() => _ResidentVisitorsScreenState();
}

class _ResidentVisitorsScreenState extends State<ResidentVisitorsScreen>
    with WidgetsBindingObserver {
  static const _pageBackground = AppColors.canvas;
  static const _soft = Color(0xFF5B6479);
  static const _border = Color(0xFFE3E7EF);
  List<ResidentVisitorRecord> _pending = const [];
  List<ResidentVisitorRecord> _history = const [];
  Timer? _pollTimer;
  bool _loading = true;
  bool _refreshing = false;
  final Set<String> _deciding = {};
  String? _error;
  int _tab = 0;

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

  Future<void> _preApproveVisitor() async {
    final details = await showDialog<List<String>>(
      context: context,
      builder: (_) => const _PreApproveVisitorDialog(),
    );
    if (details == null || !mounted) return;
    try {
      await ResidentVisitorsApi.createPreApproval(token: widget.user.accessToken, name: details[0], phone: details[1], purpose: details[2], expectedFrom: DateTime.now());
      await _refresh();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Visitor pre-approved. Security can see them in Expected.')));
    } on ResidentVisitorException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: _pageBackground,
        appBar: AppBar(
          backgroundColor: _pageBackground,
          foregroundColor: AppColors.ink,
          elevation: 0,
          leading: ResidentBackButton(
            onPressed: widget.onBack ?? () => Navigator.of(context).maybePop(),
          ),
          title: const Text('Visitors'),
          actions: [
            IconButton(tooltip: 'Pre-approve visitor', onPressed: _preApproveVisitor, icon: const Icon(Icons.person_add_alt_1_rounded)),
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
                      const SizedBox(height: 20),
                      _TabStrip(
                        labels: const ['Waiting', 'History'],
                        counts: [_pending.length, _history.length],
                        selected: _tab,
                        color: _tabColor(context),
                        onChanged: (index) => setState(() => _tab = index),
                      ),
                      const SizedBox(height: 16),
                      _TabContent(
                        stateKey: _tab,
                        child: _tab == 0 ? _waitingSection() : _historySection(),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Color(0xFFB4232F), fontSize: 12)),
                      ],
                    ],
                  ),
          ),
        ),
      );

  Widget _waitingSection() => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(child: _SectionTitle('Waiting for your response')),
              _count(_pending.length),
            ],
          ),
          const SizedBox(height: 12),
          if (_pending.isEmpty)
            _emptyCard('No visitors are waiting for approval.')
          else
            ..._pending.asMap().entries.map((entry) => _FadeIn(
                  index: entry.key,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _visitorCard(entry.value, pending: true),
                  ),
                )),
        ],
      );

  Widget _historySection() => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(child: _SectionTitle('Visitor history')),
              Text('${_history.length} records',
                  style: const TextStyle(fontSize: 12, color: _soft)),
            ],
          ),
          const SizedBox(height: 12),
          if (_history.isEmpty)
            _emptyCard('Visitor records will appear here when security registers a visitor for your home.')
          else
            _FadeIn(index: 0, child: _historyCard()),
        ],
      );

  Widget _summary() {
    final entered = _history.where((item) => item.status == 'INSIDE' || item.status == 'EXITED').length;
    final rejected = _history.where((item) => item.residentDecision == 'REJECTED').length;
    final expected = _history.where((item) => item.status == 'EXPECTED').length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Gate activity', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.ink)),
        const SizedBox(height: 14),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: _border)),
          child: IntrinsicHeight(
            child: Row(children: [
              Expanded(child: _stat(entered, 'Entered', const Color(0xFF229B78))),
              const VerticalDivider(width: 1, thickness: 1, color: _border),
              Expanded(child: _stat(expected, 'Expected', AppColors.indigo)),
              const VerticalDivider(width: 1, thickness: 1, color: _border),
              Expanded(child: _stat(rejected, 'Rejected', const Color(0xFFD65A54))),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _stat(int count, String label, Color color) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 15),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          TweenAnimationBuilder<int>(
            tween: IntTween(begin: 0, end: count),
            duration: const Duration(milliseconds: 700),
            curve: Curves.easeOutCubic,
            builder: (context, value, _) => Text('$value', style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w800)),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: _soft, fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      );

  Widget _visitorCard(ResidentVisitorRecord visitor, {required bool pending}) {
    final busy = _deciding.contains(visitor.id);
    final initials = visitor.visitorName.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).take(2).map((part) => part[0].toUpperCase()).join();
    final details = '${_label(visitor.visitorType)} · ${visitor.gateName} · ${_dateLabel(visitor.createdAt)}';
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: _border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(radius: 22, backgroundColor: const Color(0xFFEEF0FF), child: Text(initials.isEmpty ? 'V' : initials, style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w700))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(visitor.visitorName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.ink, fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 4),
            Text(details, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: _soft, fontSize: 12)),
          ])),
          _statusChip(pending ? 'Waiting' : _statusLabel(visitor)),
        ]),
        if (pending) ...[
          const SizedBox(height: 14),
          const Divider(height: 1, thickness: 1, color: _border),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: SizedBox(height: 44, child: FilledButton.icon(onPressed: busy ? null : () => _decide(visitor, 'APPROVED'), icon: busy ? const SizedBox.square(dimension: 15, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.check_rounded, size: 18), label: const Text('Approve'), style: FilledButton.styleFrom(backgroundColor: AppColors.navy, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)))))),
            const SizedBox(width: 10),
            Expanded(child: SizedBox(height: 44, child: OutlinedButton.icon(onPressed: busy ? null : () => _decide(visitor, 'REJECTED'), icon: const Icon(Icons.close_rounded, size: 18), label: const Text('Reject'), style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13))))))
          ]),
        ],
      ]),
    );
  }

  Widget _historyCard() => Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: _border)),
        child: Column(children: [
          for (var i = 0; i < _history.length; i++) ...[
            _historyItem(_history[i]),
            if (i != _history.length - 1) const Divider(height: 1, indent: 14, endIndent: 14, color: _border),
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
            radius: 20,
            backgroundColor: const Color(0xFFEEF0FF),
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
                        color: _soft, fontSize: 11)),
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
    final color = rejected ? const Color(0xFFD65A54) : done ? const Color(0xFF229B78) : AppColors.indigo;
    return Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6), decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(6)), child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800)));
  }

  Widget _count(int value) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: const Color(0xFFEEF0FF), borderRadius: BorderRadius.circular(6)), child: Text('$value', style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w800, fontSize: 12)));

  Widget _emptyCard(String text) => Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: _border)), child: Text(text, style: const TextStyle(color: _soft, fontSize: 13, height: 1.4)));

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

class _PreApproveVisitorDialog extends StatefulWidget {
  const _PreApproveVisitorDialog();

  @override
  State<_PreApproveVisitorDialog> createState() =>
      _PreApproveVisitorDialogState();
}

class _PreApproveVisitorDialogState extends State<_PreApproveVisitorDialog> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _purpose = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _purpose.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Pre-approve a visitor'),
        content: Form(
          key: _formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Visitor name'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Enter a visitor name'
                  : null,
            ),
            TextFormField(
              controller: _phone,
              decoration: const InputDecoration(labelText: 'Phone (optional)'),
              keyboardType: TextInputType.phone,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(10),
              ],
              validator: (value) {
                final phone = value?.trim() ?? '';
                if (phone.isNotEmpty && !RegExp(r'^\d{10}$').hasMatch(phone)) {
                  return 'Enter a valid 10-digit phone number.';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _purpose,
              decoration: const InputDecoration(labelText: 'Purpose (optional)'),
            ),
          ]),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                Navigator.of(context).pop([
                  _name.text.trim(),
                  _phone.text.trim(),
                  _purpose.text.trim(),
                ]);
              }
            },
            child: const Text('Pre-approve'),
          ),
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

/// Section heading with a small accent bar.
class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              color: AppColors.indigo,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Flexible(
            child: Text(
              text,
              style: const TextStyle(
                color: AppColors.ink,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      );
}
