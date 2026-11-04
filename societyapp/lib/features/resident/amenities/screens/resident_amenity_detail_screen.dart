import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_amenities_api.dart';

class ResidentAmenityDetailScreen extends StatefulWidget {
  const ResidentAmenityDetailScreen({
    super.key,
    required this.user,
    required this.amenity,
  });

  final AuthenticatedUser user;
  final ResidentAmenity amenity;

  @override
  State<ResidentAmenityDetailScreen> createState() =>
      _ResidentAmenityDetailScreenState();
}

class _ResidentAmenityDetailScreenState
    extends State<ResidentAmenityDetailScreen> with WidgetsBindingObserver {
  late Future<List<ResidentAmenitySlot>> _slotsFuture;
  Timer? _slotsRefreshTimer;
  bool _refreshingSlots = false;
  bool _booking = false;
  String? _bookingError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _slotsFuture = _loadSlots();
    _slotsRefreshTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) {
        if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
          _refreshSlots();
        }
      },
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refreshSlots();
  }

  @override
  void dispose() {
    _slotsRefreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<List<ResidentAmenitySlot>> _loadSlots() =>
      ResidentAmenitiesApi.listSlots(widget.user.accessToken, widget.amenity.id);

  Future<void> _refreshSlots() async {
    if (!mounted || _refreshingSlots) return;
    _refreshingSlots = true;
    try {
      final slots = await _loadSlots();
      if (mounted) setState(() => _slotsFuture = Future.value(slots));
    } catch (_) {
      // Keep the last successful slot list on transient refresh failures.
    } finally {
      _refreshingSlots = false;
    }
  }

  Future<void> _book(ResidentAmenitySlot slot) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm booking'),
        content: Text(
          'Book ${widget.amenity.name} for ${_dateLabel(slot.date)} '
          '(${slot.startTime}–${slot.endTime})? The listed price is '
          '${_money(slot.price)}.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Book now')),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    setState(() {
      _booking = true;
      _bookingError = null;
    });
    try {
      final booking = await ResidentAmenitiesApi.createBooking(
        token: widget.user.accessToken,
        slotId: slot.id,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Booking ${booking.bookingNumber} submitted (${booking.status.replaceAll('_', ' ').toLowerCase()}).'),
        backgroundColor: const Color(0xFF229B78),
      ));
      Navigator.of(context).pop(true);
    } on ResidentAmenitiesException catch (error) {
      if (mounted) setState(() => _bookingError = error.message);
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFF5F7FB),
        appBar: AppBar(
          backgroundColor: const Color(0xFFF5F7FB),
          title: Text(widget.amenity.name),
          actions: [
            IconButton(
              tooltip: 'Refresh available times',
              onPressed: _refreshSlots,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: SafeArea(
          child: FutureBuilder<List<ResidentAmenitySlot>>(
            future: _slotsFuture,
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return _message(snapshot.error.toString(), retry: () {
                  setState(() => _slotsFuture = _loadSlots());
                });
              }
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator(color: AppColors.indigo));
              }
              final slots = snapshot.data!;
              return ListView(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
                children: [
                  _amenitySummary(),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      const Expanded(
                        child: Text('Time slots', style: TextStyle(
                          color: AppColors.ink,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        )),
                      ),
                      Text(
                        '${slots.length} ${slots.length == 1 ? 'slot' : 'slots'}',
                        style: const TextStyle(
                          color: Color(0xFF7F8A9D),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_bookingError != null) ...[
                    _errorBanner(_bookingError!),
                    const SizedBox(height: 10),
                  ],
                  if (slots.isEmpty)
                    _emptySlots()
                  else
                    ...slots.map((slot) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _slotCard(slot),
                        )),
                ],
              );
            },
          ),
        ),
      );

  Widget _amenitySummary() => Container(
        padding: const EdgeInsets.all(19),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            colors: [Color(0xFF6557E9), Color(0xFF8878F6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.spa_rounded, color: Colors.white, size: 27),
              const SizedBox(width: 11),
              Expanded(child: Text(widget.amenity.name, style: const TextStyle(
                color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800,
              ))),
            ]),
            const SizedBox(height: 12),
            Text(
              [widget.amenity.type.replaceAll('_', ' '), if (widget.amenity.location != null) widget.amenity.location!]
                  .where((value) => value.isNotEmpty).join(' · '),
              style: const TextStyle(color: Color(0xFFE7E4FF), fontSize: 12),
            ),
            if (widget.amenity.capacity != null) ...[
              const SizedBox(height: 6),
              Text('Capacity ${widget.amenity.capacity}', style: const TextStyle(
                color: Color(0xFFE7E4FF), fontSize: 12,
              )),
            ],
          ],
        ),
      );

  Widget _slotCard(ResidentAmenitySlot slot) => Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(17),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: Row(
          children: [
            Container(
              width: 43,
              height: 43,
              decoration: BoxDecoration(
                color: const Color(0xFFECE9FF),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(Icons.schedule_rounded, color: AppColors.indigo, size: 21),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_dateLabel(slot.date), style: const TextStyle(
                    color: AppColors.ink, fontSize: 13, fontWeight: FontWeight.w800,
                  )),
                  const SizedBox(height: 4),
                  Text('${slot.startTime} – ${slot.endTime}', style: const TextStyle(
                    color: Color(0xFF7F8A9D), fontSize: 11,
                  )),
                  const SizedBox(height: 4),
                  Text('${_money(slot.price)} · Capacity ${slot.capacity}', style: const TextStyle(
                    color: AppColors.indigo, fontSize: 10, fontWeight: FontWeight.w700,
                  )),
                ],
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 38,
              child: FilledButton(
                onPressed: _booking ||
                        slot.status.toUpperCase() != 'AVAILABLE' ||
                        _isPast(slot)
                    ? null
                    : () => _book(slot),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.indigo,
                  padding: const EdgeInsets.symmetric(horizontal: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _booking
                    ? const SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(
                        _isPast(slot)
                            ? 'Past'
                            : slot.status.toUpperCase() == 'AVAILABLE'
                            ? 'Book'
                            : slot.status.replaceAll('_', ' '),
                        style: const TextStyle(fontSize: 11),
                      ),
              ),
            ),
          ],
        ),
      );

  Widget _emptySlots() => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: const Column(children: [
          Icon(Icons.event_busy_rounded, color: AppColors.muted, size: 38),
          SizedBox(height: 10),
          Text('No time slots have been added yet', style: TextStyle(
            color: AppColors.ink, fontWeight: FontWeight.w800,
          )),
          SizedBox(height: 5),
          Text('Please check again later.', style: TextStyle(
            color: Color(0xFF8994A7), fontSize: 12,
          )),
        ]),
      );

  Widget _message(String text, {VoidCallback? retry}) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(text, textAlign: TextAlign.center),
            if (retry != null) ...[
              const SizedBox(height: 14),
              FilledButton(onPressed: retry, child: const Text('Try again')),
            ],
          ]),
        ),
      );

  Widget _errorBanner(String text) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFECEE),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(text, style: const TextStyle(color: Color(0xFF9D2635), fontSize: 12)),
      );
}

String _dateLabel(DateTime? date) {
  if (date == null) return 'Date unavailable';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

bool _isPast(ResidentAmenitySlot slot) {
  final date = slot.date;
  if (date == null) return true;
  final timeParts = slot.startTime.split(':');
  final hour = int.tryParse(timeParts.first) ?? 0;
  final minute = timeParts.length > 1 ? int.tryParse(timeParts[1]) ?? 0 : 0;
  return DateTime(date.year, date.month, date.day, hour, minute)
      .isBefore(DateTime.now());
}

String _money(num amount) => '₹${amount.toStringAsFixed(2)}';
