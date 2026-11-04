import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_amenities_api.dart';
import 'resident_amenity_detail_screen.dart';

class ResidentAmenitiesScreen extends StatefulWidget {
  const ResidentAmenitiesScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentAmenitiesScreen> createState() => _ResidentAmenitiesScreenState();
}

class _ResidentAmenitiesScreenState extends State<ResidentAmenitiesScreen> {
  late Future<List<ResidentAmenity>> _amenitiesFuture;

  @override
  void initState() {
    super.initState();
    _amenitiesFuture = _load();
  }

  Future<List<ResidentAmenity>> _load() =>
      ResidentAmenitiesApi.listAmenities(widget.user.accessToken);

  Future<void> _refresh() async {
    final future = _load();
    setState(() => _amenitiesFuture = future);
    await future;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFF5F7FB),
        appBar: AppBar(
          backgroundColor: const Color(0xFFF5F7FB),
          title: const Text('Amenities'),
        ),
        body: SafeArea(
          child: RefreshIndicator(
            color: AppColors.indigo,
            onRefresh: _refresh,
            child: FutureBuilder<List<ResidentAmenity>>(
              future: _amenitiesFuture,
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return _state(
                    snapshot.error.toString(),
                    icon: Icons.wifi_off_rounded,
                    retry: () => setState(() => _amenitiesFuture = _load()),
                  );
                }
                if (!snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppColors.indigo),
                  );
                }
                final amenities = snapshot.data!;
                if (amenities.isEmpty) {
                  return _state('Your society has not added any amenities yet.',
                      icon: Icons.pool_outlined);
                }
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
                  children: [
                    _intro(amenities.length),
                    const SizedBox(height: 18),
                    ...amenities.map((amenity) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _amenityCard(amenity),
                        )),
                  ],
                );
              },
            ),
          ),
        ),
      );

  Widget _intro(int count) => Container(
        padding: const EdgeInsets.all(19),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            colors: [Color(0xFF6557E9), Color(0xFF8878F6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Row(
          children: [
            const Icon(Icons.spa_rounded, color: Colors.white, size: 32),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Explore your society', style: TextStyle(
                    color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800,
                  )),
                  const SizedBox(height: 4),
                  Text('$count amenities available to residents', style: const TextStyle(
                    color: Color(0xFFE7E4FF), fontSize: 12,
                  )),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _amenityCard(ResidentAmenity amenity) => Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => Navigator.of(context).push<void>(MaterialPageRoute<void>(
            builder: (_) => ResidentAmenityDetailScreen(
              user: widget.user,
              amenity: amenity,
            ),
          )),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFEBEFF5)),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFFECE9FF),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(_iconFor(amenity.type), color: AppColors.indigo),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(amenity.name, style: const TextStyle(
                        color: AppColors.ink, fontSize: 15, fontWeight: FontWeight.w800,
                      )),
                      const SizedBox(height: 5),
                      Text(
                        [amenity.type.replaceAll('_', ' '), if (amenity.location != null) amenity.location!]
                            .where((text) => text.isNotEmpty).join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xFF7F8A9D), fontSize: 11),
                      ),
                      if (amenity.capacity != null) ...[
                        const SizedBox(height: 4),
                        Text('Capacity ${amenity.capacity}', style: const TextStyle(
                          color: Color(0xFF8994A7), fontSize: 10,
                        )),
                      ],
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: AppColors.indigo),
              ],
            ),
          ),
        ),
      );

  Widget _state(String message, {required IconData icon, VoidCallback? retry}) =>
      ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(30),
        children: [
          const SizedBox(height: 100),
          Icon(icon, color: AppColors.muted, size: 44),
          const SizedBox(height: 14),
          Text(message, textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.ink)),
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
