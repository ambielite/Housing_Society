import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../dashboard/data/resident_dashboard_api.dart';
import '../data/resident_amenities_api.dart';
import 'resident_amenity_detail_screen.dart';

class ResidentAmenitiesScreen extends StatefulWidget {
  const ResidentAmenitiesScreen({
    super.key,
    required this.user,
    this.onBookingCreated,
  });

  final AuthenticatedUser user;
  final ValueChanged<ResidentUpcomingBooking>? onBookingCreated;

  @override
  State<ResidentAmenitiesScreen> createState() => _ResidentAmenitiesScreenState();
}

class _ResidentAmenitiesScreenState extends State<ResidentAmenitiesScreen> {
  static const _amenityText = AppColors.ink;
  static const _amenityMuted = Color(0xFF5B6479);
  static const _soft = Color(0xFF5B6479);
  static const _border = Color(0xFFE3E7EF);

  // Cards use the same colour as the tabs, so the whole screen shares one palette.
  Color get _amenityAccent => _tabColor(context);
  Color get _amenityIconBackground =>
      _tabColor(context).withValues(alpha: .10);

  List<ResidentAmenity> _amenities = const [];
  String? _loadError;
  bool _initialLoading = true;
  bool _refreshing = false;
  int _typeTab = 0;
  ResidentAmenity? _selectedAmenity;

  @override
  void initState() {
    super.initState();
    _loadAmenities();
  }

  Future<List<ResidentAmenity>> _load() =>
      ResidentAmenitiesApi.listAmenities(widget.user.accessToken);

  Future<void> _refresh() async {
    await _loadAmenities(refresh: true);
  }

  Future<void> _loadAmenities({bool refresh = false}) async {
    if (_refreshing) return;
    if (mounted) {
      setState(() {
        _refreshing = true;
        if (!refresh) _initialLoading = true;
        _loadError = null;
      });
    }
    try {
      final amenities = await _load();
      if (!mounted) return;
      setState(() {
        _amenities = amenities;
        _loadError = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _loadError = error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _refreshing = false;
          _initialLoading = false;
        });
      }
    }
  }

  // Distinct amenity types, in the order they first appear.
  List<String> get _types {
    final types = <String>[];
    for (final amenity in _amenities) {
      if (!types.contains(amenity.type)) types.add(amenity.type);
    }
    return types;
  }

  String _typeLabel(String type) => type
      .replaceAll('_', ' ')
      .toLowerCase()
      .split(' ')
      .map((word) =>
          word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
      .join(' ');

  @override
  Widget build(BuildContext context) {
    final selectedAmenity = _selectedAmenity;
    if (selectedAmenity != null) {
      return ResidentAmenityDetailScreen(
        user: widget.user,
        amenity: selectedAmenity,
        onBookingCreated: widget.onBookingCreated,
        onClose: () => setState(() => _selectedAmenity = null),
      );
    }

    return Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          title: const Text('Amenities'),
          actions: [
            IconButton(
              tooltip: 'Refresh amenities',
              onPressed: _refreshing ? null : _refresh,
              icon: _refreshing
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
          child: RefreshIndicator(
            color: _amenityAccent,
            onRefresh: _refresh,
            child: _initialLoading
                ? Center(
                    child: CircularProgressIndicator(color: _amenityAccent),
                  )
                : _loadError != null && _amenities.isEmpty
                    ? _state(_loadError!,
                        icon: Icons.wifi_off_rounded,
                        retry: () => _loadAmenities())
                    : _amenities.isEmpty
                        ? _state(
                            'Your society has not added any amenities yet.',
                            icon: Icons.pool_outlined,
                          )
                        : _list(),
          ),
        ),
      );
  }

  Widget _list() {
    final types = _types;
    final tab = _typeTab > types.length ? 0 : _typeTab;
    final visible = tab == 0
        ? _amenities
        : _amenities.where((item) => item.type == types[tab - 1]).toList();
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
      children: [
        _intro(_amenities.length),
        if (_loadError != null) ...[
          const SizedBox(height: 10),
          Text('Could not refresh amenities. Pull down to retry.',
              style: TextStyle(color: _amenityMuted)),
        ],
        if (types.length > 1) ...[
          const SizedBox(height: 16),
          _TabStrip(
            labels: ['All', ...types.map(_typeLabel)],
            counts: [
              _amenities.length,
              ...types.map(
                (type) => _amenities.where((item) => item.type == type).length,
              ),
            ],
            selected: tab,
            color: _tabColor(context),
            scrollable: true,
            onChanged: (index) => setState(() => _typeTab = index),
          ),
        ],
        const SizedBox(height: 16),
        _TabContent(
          stateKey: tab,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ...visible.asMap().entries.map((entry) => _FadeIn(
                    index: entry.key,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _amenityCard(entry.value),
                    ),
                  )),
            ],
          ),
        ),
      ],
    );
  }

  Widget _intro(int count) => Container(
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
                  child: Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: _amenityIconBackground,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.spa_rounded,
                            color: _amenityAccent, size: 26),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Explore your society',
                                style: TextStyle(
                                  color: _amenityText,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                )),
                            const SizedBox(height: 4),
                            Text('$count amenities available to residents',
                                style: const TextStyle(
                                  color: _soft,
                                  fontSize: 13,
                                )),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );

  Widget _amenityCard(ResidentAmenity amenity) => _HoverLift(
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => setState(() => _selectedAmenity = amenity),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _border),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _amenityIconBackground,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(_iconFor(amenity.type), color: _amenityAccent),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(amenity.name, style: const TextStyle(
                color: _amenityText, fontSize: 15, fontWeight: FontWeight.w700,
                      )),
                      const SizedBox(height: 5),
                      Text(
                        [amenity.type.replaceAll('_', ' '), if (amenity.location != null) amenity.location!]
                            .where((text) => text.isNotEmpty).join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: _soft, fontSize: 12),
                      ),
                      if (amenity.capacity != null) ...[
                        const SizedBox(height: 4),
                        Text('Capacity ${amenity.capacity}', style: const TextStyle(
                          color: _soft, fontSize: 11,
                        )),
                      ],
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: _amenityAccent),
              ],
            ),
          ),
        ),
      ));

  Widget _state(String message, {required IconData icon, VoidCallback? retry}) =>
      ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(30),
        children: [
          const SizedBox(height: 100),
          Icon(icon, color: _amenityMuted, size: 44),
          const SizedBox(height: 14),
          Text(message, textAlign: TextAlign.center,
              style: const TextStyle(color: _amenityText)),
          if (retry != null) ...[
            const SizedBox(height: 16),
            Center(child: FilledButton(onPressed: retry, child: const Text('Try again'))),
          ],
        ],
      );
}

IconData _iconFor(String type) {
  final value = type.toUpperCase();
  if (value.contains('POOL')) return Icons.pool_rounded;
  if (value.contains('GYM') || value.contains('FITNESS')) return Icons.fitness_center_rounded;
  if (value.contains('HALL') || value.contains('PARTY')) return Icons.celebration_rounded;
  if (value.contains('SPORT') || value.contains('COURT')) return Icons.sports_tennis_rounded;
  return Icons.spa_rounded;
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
                ? [
                    BoxShadow(
                      color: _tabColor(context).withValues(alpha: .14),
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
