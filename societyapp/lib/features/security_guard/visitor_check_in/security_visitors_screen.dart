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
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: filters
                .map(
                  (filter) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        filter == 'ALL' ? 'All' : _statusLabel(filter),
                      ),
                      selected: _visitorFilter == filter,
                      onSelected: (_) =>
                          setState(() => _visitorFilter = filter),
                      selectedColor: const Color(0xFFEAE8FF),
                      labelStyle: TextStyle(
                        color: _visitorFilter == filter
                            ? AppColors.indigo
                            : AppColors.inkSoft,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                      side: BorderSide(
                        color: _visitorFilter == filter
                            ? AppColors.indigo.withValues(alpha: .25)
                            : const Color(0xFFE4E9F1),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 8),
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
      padding: const EdgeInsets.all(15),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: _residentActionGreenBg,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.person_pin_circle_outlined,
                  color: _residentActionGreen,
                ),
              ),
              const SizedBox(width: 11),
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
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${_visitorTypeLabel(pass, data)}  ·  ${data.gateName(pass.gateId)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                      ),
                    ),
                    if (data.destinationLabel(pass) case final destination?) ...[
                      const SizedBox(height: 3),
                      Text(
                        'Visiting $destination',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.indigo,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              _statusBadge(pass.status, statusColor),
            ],
          ),
          const SizedBox(height: 11),
          Row(
            children: [
              const Icon(
                Icons.confirmation_number_outlined,
                size: 15,
                color: AppColors.muted,
              ),
              const SizedBox(width: 5),
              Text(
                'Pass ${pass.passNo}',
                style: const TextStyle(
                  color: AppColors.inkSoft,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text(
                _formatDate(pass.createdAt),
                style: const TextStyle(color: AppColors.muted, fontSize: 10),
              ),
            ],
          ),
          if (residentWaiting || residentRejected) ...[
            const SizedBox(height: 9),
            Text(
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
                  backgroundColor: AppColors.indigo,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
