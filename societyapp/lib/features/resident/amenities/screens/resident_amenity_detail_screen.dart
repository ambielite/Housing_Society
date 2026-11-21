import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../widgets/resident_back_button.dart';
import '../../../auth/data/auth_api.dart';
import '../../dashboard/data/resident_dashboard_api.dart';
import '../data/resident_amenities_api.dart';

class ResidentAmenityDetailScreen extends StatefulWidget {
  const ResidentAmenityDetailScreen({
    super.key,
    required this.user,
    required this.amenity,
    this.onBookingCreated,
    this.onClose,
  });

  final AuthenticatedUser user;
  final ResidentAmenity amenity;
  final ValueChanged<ResidentUpcomingBooking>? onBookingCreated;
  final VoidCallback? onClose;

  @override
  State<ResidentAmenityDetailScreen> createState() =>
      _ResidentAmenityDetailScreenState();
}

class _ResidentAmenityDetailScreenState
    extends State<ResidentAmenityDetailScreen> with WidgetsBindingObserver {
  static const _amenityText = AppColors.ink;
  static const _amenityMuted = Color(0xFF5B6479);
  static const _soft = Color(0xFF5B6479);
  static const _border = Color(0xFFE3E7EF);

  // Cards use the same colour as the tabs, so the whole screen shares one palette.
  Color get _amenityAccent => _tabColor(context);
  Color get _amenityAccentBackground =>
      _tabColor(context).withValues(alpha: .10);

  late Future<List<ResidentAmenitySlot>> _slotsFuture;
  Timer? _bookingStatusTimer;
  bool _refreshingSlots = false;
  bool _refreshingBookings = false;
  bool _bookingsLoaded = false;
  DateTime _lastObservedDay = DateTime.now();
  String? _bookingsError;
  Map<String, ResidentAmenityBooking> _bookingsBySlotId = {};
  String? _bookingError;
  int _slotTab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _slotsFuture = _loadSlots();
    _loadBookings();
    _bookingStatusTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) {
        _expireSlotsOnDateChange();
        _refreshBookingStatusInBackground();
      },
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _expireSlotsOnDateChange();
      _refreshBookingStatusInBackground();
    }
  }

  @override
  void dispose() {
    _bookingStatusTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<List<ResidentAmenitySlot>> _loadSlots() =>
      ResidentAmenitiesApi.listSlots(widget.user.accessToken, widget.amenity.id);

  void _expireSlotsOnDateChange() {
    final now = DateTime.now();
    if (now.year == _lastObservedDay.year &&
        now.month == _lastObservedDay.month &&
        now.day == _lastObservedDay.day) {
      return;
    }
    setState(() => _lastObservedDay = DateTime(now.year, now.month, now.day));
  }

  Future<void> _loadBookings() async {
    if (_refreshingBookings) return;
    _refreshingBookings = true;
    try {
      final bookings = await ResidentAmenitiesApi.listMyBookings(
        widget.user.accessToken,
      );
      if (!mounted) return;
      final nextBookings = Map<String, ResidentAmenityBooking>.fromEntries(
        bookings
            .where((booking) =>
                !{'CANCELLED', 'EXPIRED'}.contains(booking.status.toUpperCase()))
            .where((booking) => booking.amenitySlotId.isNotEmpty)
            .map((booking) => MapEntry(booking.amenitySlotId, booking)),
      );
      final bookingsChanged =
          nextBookings.length != _bookingsBySlotId.length ||
          nextBookings.entries.any(
            (entry) =>
                _bookingsBySlotId[entry.key]?.status != entry.value.status,
          );
      if (!bookingsChanged && _bookingsLoaded && _bookingsError == null) {
        return;
      }
      setState(() {
        _bookingsBySlotId = nextBookings;
        _bookingsLoaded = true;
        _bookingsError = null;
      });
    } on ResidentAmenitiesException catch (error) {
      if (!mounted) return;
      if (_bookingsError == error.message && _bookingsLoaded) return;
      setState(() {
        _bookingsLoaded = true;
        _bookingsError = error.message;
      });
    } finally {
      _refreshingBookings = false;
    }
  }

  Future<void> _refreshBookingStatusInBackground() async {
    if (!mounted ||
        _refreshingBookings ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ModalRoute.of(context)?.isCurrent == false) {
      return;
    }
    await _loadBookings();
  }

  Future<void> _refreshSlots() async {
    if (!mounted || _refreshingSlots) return;
    setState(() => _refreshingSlots = true);
    try {
      final slots = await _loadSlots();
      if (mounted) setState(() => _slotsFuture = Future.value(slots));
      await _loadBookings();
    } catch (_) {
      // Keep the last successful slot list on transient refresh failures.
    } finally {
      if (mounted) setState(() => _refreshingSlots = false);
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
    setState(() => _bookingError = null);
    try {
      final booking = await ResidentAmenitiesApi.createBooking(
        token: widget.user.accessToken,
        slotId: slot.id,
      );
      if (!mounted) return;
      setState(() => _bookingsBySlotId = {
        ..._bookingsBySlotId,
        slot.id: booking,
      });
      widget.onBookingCreated?.call(ResidentUpcomingBooking(
        amenityName: widget.amenity.name,
        status: booking.status,
        slotDate: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      ));
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(
          'Booking ${booking.bookingNumber} submitted. It will be confirmed after payment verification.',
        ),
        backgroundColor: const Color(0xFF229B78),
      ));
    } on ResidentAmenitiesException catch (error) {
      if (mounted) setState(() => _bookingError = error.message);
    }
  }

  // A slot the resident has already booked.
  bool _isBooked(ResidentAmenitySlot slot) =>
      _bookingsBySlotId.containsKey(slot.id);

  // A slot the resident can still book right now.
  bool _isAvailable(ResidentAmenitySlot slot) =>
      _bookingsLoaded &&
      _bookingsError == null &&
      !_isBooked(slot) &&
      slot.status.toUpperCase() == 'AVAILABLE';

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          leading: ResidentBackButton(
            onPressed:
                widget.onClose ?? () => Navigator.of(context).maybePop(),
          ),
          title: Text(widget.amenity.name),
          actions: [
            IconButton(
              tooltip: 'Refresh available times',
              onPressed: _refreshingSlots ? null : _refreshSlots,
              icon: _refreshingSlots
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh_rounded),
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
                return Center(child: CircularProgressIndicator(color: _amenityAccent));
              }
              final slots = snapshot.data!
                  .where((slot) => !_isBeforeToday(slot.date))
                  .toList();
              final availableCount = slots.where(_isAvailable).length;
              final bookedCount = slots.where(_isBooked).length;
              final visible = switch (_slotTab) {
                1 => slots.where(_isAvailable).toList(),
                2 => slots.where(_isBooked).toList(),
                _ => slots,
              };
              return ListView(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
                children: [
                  _amenitySummary(),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      const Expanded(child: _SectionTitle('Time slots')),
                      Text(
                        '${slots.length} ${slots.length == 1 ? 'slot' : 'slots'}',
                        style: const TextStyle(
                          color: _soft,
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
                  if (_bookingsError != null) ...[
                    _errorBanner('Could not check your existing bookings. Refresh to try again.'),
                    const SizedBox(height: 10),
                  ],
                  if (slots.isEmpty)
                    _emptySlots()
                  else ...[
                    _TabStrip(
                      labels: const ['All', 'Available', 'Booked'],
                      counts: [slots.length, availableCount, bookedCount],
                      selected: _slotTab,
                      color: _tabColor(context),
                      onChanged: (index) => setState(() => _slotTab = index),
                    ),
                    const SizedBox(height: 14),
                    _TabContent(
                      stateKey: _slotTab,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (visible.isEmpty)
                            _filteredEmpty()
                          else
                            ...visible.asMap().entries.map((entry) => _FadeIn(
                                  index: entry.key,
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: _slotCard(entry.value),
                                  ),
                                )),
                        ],
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      );

  Widget _amenitySummary() => Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: _amenityAccent),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: _amenityAccentBackground,
                            borderRadius: BorderRadius.circular(11),
                          ),
                          child: Icon(Icons.spa_rounded, color: _amenityAccent, size: 23),
                        ),
                        const SizedBox(width: 11),
                        Expanded(child: Text(widget.amenity.name, style: const TextStyle(
                          color: _amenityText, fontSize: 18, fontWeight: FontWeight.w700,
                        ))),
                      ]),
                      const SizedBox(height: 12),
                      Text(
                        [widget.amenity.type.replaceAll('_', ' '), if (widget.amenity.location != null) widget.amenity.location!]
                            .where((value) => value.isNotEmpty).join(' · '),
                        style: const TextStyle(color: _soft, fontSize: 13),
                      ),
                      if (widget.amenity.capacity != null) ...[
                        const SizedBox(height: 6),
                        Text('Capacity ${widget.amenity.capacity}', style: const TextStyle(
                          color: _soft, fontSize: 13,
                        )),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );

  Widget _slotCard(ResidentAmenitySlot slot) => Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: Row(
          children: [
            Container(
              width: 43,
              height: 43,
              decoration: BoxDecoration(
                color: _amenityAccentBackground,
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(Icons.schedule_rounded, color: _amenityAccent, size: 21),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_dateLabel(slot.date), style: const TextStyle(
                    color: _amenityText, fontSize: 14, fontWeight: FontWeight.w700,
                  )),
                  const SizedBox(height: 4),
                  Text('${slot.startTime} – ${slot.endTime}', style: const TextStyle(
                    color: _soft, fontSize: 12,
                  )),
                  const SizedBox(height: 4),
                  Text('${_money(slot.price)} · Capacity ${slot.capacity}', style: TextStyle(
                    color: _amenityAccent, fontSize: 11, fontWeight: FontWeight.w700,
                  )),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (_bookingsBySlotId[slot.id]?.status.toUpperCase() == 'CONFIRMED')
              _bookingBadge('Booking confirmed', const Color(0xFFE3F5EC), const Color(0xFF136B42))
            else if (_bookingsBySlotId.containsKey(slot.id))
              _bookingBadge('Booked', const Color(0xFFFFF4DF), const Color(0xFF9B6500))
            else if (_bookingsError != null)
              _slotStateLabel('Unavailable', const Color(0xFFFFE9EB), const Color(0xFFB4232F))
            else if (!_bookingsLoaded)
              _slotStateLabel('Checking', _amenityAccentBackground, _amenityAccent)
            else if (slot.status.toUpperCase() != 'AVAILABLE')
              _slotStateLabel(
                slot.status.replaceAll('_', ' '),
                const Color(0xFFE7E7E7),
                const Color(0xFF888888),
              )
            else
              _BookSlotButton(onBook: () => _book(slot)),
          ],
        ),
      );

  Widget _bookingBadge(String label, Color background, Color foreground) =>
      Container(
        constraints: const BoxConstraints(maxWidth: 116),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: foreground,
            fontSize: 10,
            fontWeight: FontWeight.w800,
          ),
        ),
      );

  Widget _slotStateLabel(String label, Color background, Color foreground) =>
      Container(
        constraints: const BoxConstraints(minWidth: 78, maxWidth: 116),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(color: foreground, fontSize: 11),
        ),
      );

  Widget _filteredEmpty() => Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: const Text(
          'No time slots in this view.',
          textAlign: TextAlign.center,
          style: TextStyle(color: _soft, fontSize: 13),
        ),
      );

  Widget _emptySlots() => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: const Column(children: [
          Icon(Icons.event_busy_rounded, color: _amenityMuted, size: 38),
          SizedBox(height: 10),
          Text('No upcoming time slots are available', style: TextStyle(
            color: _amenityText, fontWeight: FontWeight.w800,
          )),
          SizedBox(height: 5),
          Text('Please check again later.', style: TextStyle(
            color: _amenityMuted, fontSize: 12,
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
          color: const Color(0xFFFFE9EB),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(text, style: const TextStyle(color: Color(0xFFB4232F), fontSize: 12)),
      );
}

String _dateLabel(DateTime? date) {
  if (date == null) return 'Date unavailable';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

bool _isBeforeToday(DateTime? date) {
  if (date == null) return true;
  final today = DateTime.now();
  return DateTime(date.year, date.month, date.day)
      .isBefore(DateTime(today.year, today.month, today.day));
}

String _money(num amount) => '₹${amount.toStringAsFixed(2)}';

class _BookSlotButton extends StatefulWidget {
  const _BookSlotButton({required this.onBook});

  final Future<void> Function() onBook;

  @override
  State<_BookSlotButton> createState() => _BookSlotButtonState();
}

class _BookSlotButtonState extends State<_BookSlotButton> {
  bool _submitting = false;

  Future<void> _submit() async {
    if (_submitting) return;
    setState(() => _submitting = true);
    try {
      await widget.onBook();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 78,
        child: FilledButton(
          onPressed: _submitting ? null : _submit,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _submitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('Book', style: TextStyle(fontSize: 11)),
        ),
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
              color: _tabColor(context),
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
