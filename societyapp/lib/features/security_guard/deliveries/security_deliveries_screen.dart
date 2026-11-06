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
            _deliverySwitch('Deliveries', 0),
            const SizedBox(width: 8),
            _deliverySwitch('Parcels', 1),
            const Spacer(),
            IconButton(
              tooltip: 'Refresh deliveries and parcels',
              onPressed: _refreshDeliveries,
              icon: const Icon(Icons.refresh_rounded),
              color: AppColors.indigo,
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _sectionHeading(
                showingDeliveries ? 'Incoming deliveries' : 'Parcel storage',
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
            label: Text(showingDeliveries ? 'Register delivery' : 'Log parcel'),
          ),
        ),
        const SizedBox(height: 12),
        ValueListenableBuilder<int>(
          valueListenable: _deliveryRevision,
          builder: (context, _, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: showingDeliveries
                ? data.deliveries.isEmpty
                    ? [_emptyCard('Incoming deliveries will appear here.')]
                    : data.deliveries
                          .map((delivery) => _deliveryCard(delivery, data))
                          .toList()
                : data.parcels.isEmpty
                    ? [_emptyCard('Parcels logged at the gate will appear here.')]
                    : data.parcels
                          .map((parcel) => _parcelCard(parcel, data))
                          .toList(),
          ),
        ),
      ],
    );
  }

  Widget _deliverySwitch(String label, int index) => ChoiceChip(
    label: Text(label),
    selected: _deliveryTab == index,
    onSelected: (_) => setState(() => _deliveryTab = index),
    selectedColor: const Color(0xFFEAE8FF),
    labelStyle: TextStyle(
      color: _deliveryTab == index ? AppColors.indigo : AppColors.inkSoft,
      fontWeight: FontWeight.w700,
      fontSize: 12,
    ),
    side: BorderSide(
      color: _deliveryTab == index
          ? AppColors.indigo.withValues(alpha: .25)
          : const Color(0xFFE1E6EF),
    ),
  );

  Widget _deliveryCard(_Delivery delivery, _GuardSnapshot data) {
    final unit = data.units.where((item) => item.id == delivery.unitId);
    final unitLabel = unit.isEmpty ? 'Flat' : unit.first.label;
    final visitor = delivery.visitorProfileId == null
        ? null
        : data.profiles[delivery.visitorProfileId];
    final allowed = _deliveryTransitions[delivery.status] ?? const <String>[];
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(15),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _residentActionOrangeBg,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.local_shipping_outlined,
                  color: _residentActionOrange,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _humanize(delivery.type),
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '$unitLabel${visitor == null ? '' : ' · ${visitor.name}'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              _statusBadge(delivery.status, _deliveryStatusColor(delivery.status)),
            ],
          ),
          if (delivery.courierName?.isNotEmpty == true) ...[
            const SizedBox(height: 10),
            Text(
              delivery.courierName!,
              style: const TextStyle(color: AppColors.muted, fontSize: 11),
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
    );
  }

  Widget _parcelCard(_Parcel parcel, _GuardSnapshot data) {
    final delivery = data.deliveries.where((item) => item.id == parcel.deliveryId);
    final parent = delivery.isEmpty ? null : delivery.first;
    final matchingUnits = parent == null
        ? const <_GuardUnit>[]
        : data.units.where((item) => item.id == parent.unitId).toList();
    final unit = matchingUnits.isEmpty ? null : matchingUnits.first;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(15),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _residentActionBlueBg,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.inventory_2_outlined,
                  color: _residentActionBlue,
                ),
              ),
              const SizedBox(width: 10),
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
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${unit?.label ?? 'Delivery'} · ${parcel.storageLocation?.isNotEmpty == true ? parcel.storageLocation : 'No storage location'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              _statusBadge(parcel.status, _parcelStatusColor(parcel.status)),
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
    );
  }
}
