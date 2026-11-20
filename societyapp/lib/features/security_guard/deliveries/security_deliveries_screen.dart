part of '../dashboard/screens/security_dashboard_screen.dart';

class _SecurityDeliveriesScreen extends StatelessWidget {
  const _SecurityDeliveriesScreen({required this.owner, required this.data});

  final _SecurityHomeState owner;
  final _GuardSnapshot data;

  @override
  Widget build(BuildContext context) => owner._deliveries(data);
}

extension _SecurityDeliveriesBuilder on _SecurityHomeState {
  Widget _deliveries(_GuardSnapshot data) {
    final showingDeliveries = _deliveryTab == 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: _deliveryTypeTabs(data)),
            const SizedBox(width: 4),
            IconButton(
              tooltip: 'Refresh deliveries and parcels',
              onPressed: _refreshDeliveries,
              icon: const Icon(Icons.refresh_rounded),
              color: AppColors.navy,
            ),
          ],
        ),
        const SizedBox(height: 14),
        _deliveriesAnimatedBody(
          _deliveryTab,
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: _sectionHeading(
                      showingDeliveries
                          ? 'Incoming deliveries'
                          : 'Parcel storage',
                      showingDeliveries
                          ? '${data.deliveries.length} records'
                          : '${data.parcels.length} records',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 46,
                child: FilledButton.icon(
                  onPressed: showingDeliveries
                      ? () => _registerDelivery(data)
                      : () => _registerParcel(data),
                  icon: Icon(
                    showingDeliveries
                        ? Icons.local_shipping_outlined
                        : Icons.inventory_2_outlined,
                  ),
                  label: Text(
                    showingDeliveries ? 'Register delivery' : 'Log parcel',
                  ),
                ),
              ),
              const SizedBox(height: 14),
              ValueListenableBuilder<int>(
                valueListenable: _deliveryRevision,
                builder: (context, _, _) => Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: showingDeliveries
                      ? data.deliveries.isEmpty
                            ? [
                                _emptyCard(
                                  'Incoming deliveries will appear here.',
                                ),
                              ]
                            : data.deliveries
                                  .map(
                                    (delivery) =>
                                        _deliveryCard(delivery, data),
                                  )
                                  .toList()
                      : data.parcels.isEmpty
                      ? [
                          _emptyCard(
                            'Parcels logged at the gate will appear here.',
                          ),
                        ]
                      : data.parcels
                            .map((parcel) => _parcelCard(parcel, data))
                            .toList(),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Tab strip (same look as the Visitor status tabs).
  Widget _deliveryTypeTabs(_GuardSnapshot data) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.navy.withValues(alpha: .06),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(child: _deliveryTypeTab('Deliveries', 0, data.deliveries.length)),
          Expanded(child: _deliveryTypeTab('Parcels', 1, data.parcels.length)),
        ],
      ),
    );
  }

  Widget _deliveryTypeTab(String label, int index, int count) {
    final selected = _deliveryTab == index;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _selectDeliveryTab(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        margin: EdgeInsets.only(right: index == 0 ? 4 : 0),
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
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(label),
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
  Widget _deliveriesAnimatedBody(Object stateKey, Widget child) {
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

  Widget _deliveryCard(_Delivery delivery, _GuardSnapshot data) {
    final unit = data.units.where((item) => item.id == delivery.unitId);
    final unitLabel = unit.isEmpty ? 'Flat' : unit.first.label;
    final visitor = delivery.visitorProfileId == null
        ? null
        : data.profiles[delivery.visitorProfileId];
    final allowed = _deliveryTransitions[delivery.status] ?? const <String>[];
    final statusColor = _deliveryStatusColor(delivery.status);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
                                _humanize(delivery.type),
                                style: const TextStyle(
                                  color: AppColors.ink,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$unitLabel${visitor == null ? '' : ' · ${visitor.name}'}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.inkSoft,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        _statusBadge(delivery.status, statusColor),
                      ],
                    ),
                    if (delivery.courierName?.isNotEmpty == true) ...[
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFEDF0F5)),
                      const SizedBox(height: 10),
                      Text(
                        delivery.courierName!,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                    if (allowed.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => _changeDeliveryStatus(delivery, data),
                        icon: const Icon(Icons.sync_alt_rounded, size: 17),
                        label: const Text('Change status'),
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

  Widget _parcelCard(_Parcel parcel, _GuardSnapshot data) {
    final delivery = data.deliveries.where(
      (item) => item.id == parcel.deliveryId,
    );
    final parent = delivery.isEmpty ? null : delivery.first;
    final matchingUnits = parent == null
        ? const <_GuardUnit>[]
        : data.units.where((item) => item.id == parent.unitId).toList();
    final unit = matchingUnits.isEmpty ? null : matchingUnits.first;
    final statusColor = _parcelStatusColor(parcel.status);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
                                parcel.parcelCode?.isNotEmpty == true
                                    ? parcel.parcelCode!
                                    : 'Parcel ${parcel.id.substring(0, 8)}',
                                style: const TextStyle(
                                  color: AppColors.ink,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${unit?.label ?? 'Delivery'} · ${parcel.storageLocation?.isNotEmpty == true ? parcel.storageLocation : 'No storage location'}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.inkSoft,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        _statusBadge(parcel.status, statusColor),
                      ],
                    ),
                    if (parcel.status == 'STORED') ...[
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => _changeParcelStatus(parcel, data),
                        icon: const Icon(Icons.task_alt_rounded, size: 17),
                        label: const Text('Update parcel status'),
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