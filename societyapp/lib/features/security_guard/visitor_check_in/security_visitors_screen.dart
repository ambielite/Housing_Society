part of '../dashboard/screens/security_dashboard_screen.dart';

class _SecurityVisitorsScreen extends StatelessWidget {
  const _SecurityVisitorsScreen({required this.owner, required this.data});

  final _SecurityHomeState owner;
  final _GuardSnapshot data;

  @override
  Widget build(BuildContext context) => owner._visitors(data);
}

extension _SecurityVisitorsBuilder on _SecurityHomeState {
  Widget _visitors(_GuardSnapshot data) {
    const filters = ['ALL', 'EXPECTED', 'ARRIVED', 'INSIDE', 'EXITED'];
    final visible = _visitorFilter == 'ALL'
        ? data.passes
        : data.passes.where((pass) => pass.status == _visitorFilter).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeading('Visitor passes', '${visible.length} records'),
        const SizedBox(height: 12),
        _visitorStatusTabs(filters, data),
        const SizedBox(height: 14),
        _visitorsAnimatedBody(
          _visitorFilter,
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (visible.isEmpty)
                _emptyCard('No visitor passes match this filter.')
              else
                ...visible.map(
                  (pass) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _passCard(pass, data),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  // Tab strip (same look as the Deliveries / Parcels tabs).
  Widget _visitorStatusTabs(List<String> filters, _GuardSnapshot data) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.navy.withValues(alpha: .06),
        borderRadius: BorderRadius.circular(14),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (final filter in filters) _visitorStatusTab(filter, data),
          ],
        ),
      ),
    );
  }

  Widget _visitorStatusTab(String filter, _GuardSnapshot data) {
    final count = filter == 'ALL'
        ? data.passes.length
        : data.passes.where((pass) => pass.status == filter).length;
    final selected = _visitorFilter == filter;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _selectVisitorFilter(filter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        margin: const EdgeInsets.only(right: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.navy.withValues(alpha: .18)
              : AppColors.navy.withValues(alpha: 0),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected
                ? AppColors.navy.withValues(alpha: .45)
                : AppColors.navy.withValues(alpha: 0),
          ),
        ),
        child: AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutCubic,
          style: TextStyle(
            color: selected ? AppColors.navy : AppColors.inkSoft,
            fontWeight: FontWeight.w700,
            fontSize: 12,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(filter == 'ALL' ? 'All' : _statusLabel(filter)),
              const SizedBox(width: 6),
              Opacity(
                opacity: .65,
                child: Text(
                  '$count',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Cross-fades and slides the content when the selected tab changes, and
  /// animates the height so nothing jumps.
  Widget _visitorsAnimatedBody(Object stateKey, Widget child) {
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

  Widget _passCard(_GuardPass pass, _GuardSnapshot data) {
    final statusColor = _statusColor(pass.status);
    final residentWaiting = pass.residentDecision == 'PENDING';
    final residentRejected = pass.residentDecision == 'REJECTED';
    final action = residentRejected
        ? ('Cancel pass', 'CANCEL')
        : pass.status == 'ARRIVED' && residentWaiting
        ? (null, null)
        : switch (pass.status) {
            'EXPECTED' => ('Record arrival', 'ARRIVAL'),
            'ARRIVED' => ('Allow entry', 'ENTRY'),
            'INSIDE' || 'OVERSTAY' => ('Record exit', 'EXIT'),
            _ => (null, null),
          };
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: _cardDecoration(),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: statusColor),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _visitorName(pass, data),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.ink,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${_visitorTypeLabel(pass, data)}  ·  ${data.gateName(pass.gateId)}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.inkSoft,
                                  fontSize: 12,
                                ),
                              ),
                              if (data.destinationLabel(pass)
                                  case final destination?) ...[
                                const SizedBox(height: 3),
                                Text(
                                  'Visiting $destination',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: AppColors.indigo,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        _statusBadge(pass.status, statusColor),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFEDF0F5)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Pass ${pass.passNo}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.ink,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(pass.createdAt),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            color: AppColors.inkSoft,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    if (residentWaiting || residentRejected) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: residentRejected
                              ? const Color(0xFFFEECEB)
                              : const Color(0xFFFFF4E5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          residentRejected
                              ? 'Resident rejected this visitor'
                              : 'Waiting for resident approval',
                          style: TextStyle(
                            color: residentRejected
                                ? const Color(0xFFB42318)
                                : const Color(0xFF9A5B13),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                    if (action.$1 != null) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 43,
                        child: FilledButton.icon(
                          onPressed: () => _changePass(pass, action.$2!, data),
                          icon: Icon(
                            action.$2 == 'EXIT'
                                ? Icons.logout_rounded
                                : Icons.arrow_forward_rounded,
                            size: 17,
                          ),
                          label: Text(action.$1!),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.navy,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}