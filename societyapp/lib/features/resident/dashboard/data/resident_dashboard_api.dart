import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:housing_society_app/app/session_manager.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    : kIsWeb
    ? 'http://localhost:5000/api/v1'
    : 'http://localhost:5000/api/v1';

class ResidentDashboardData {
  const ResidentDashboardData({
    this.societyName,
    this.societyLogoUrl,
    this.societyAddress,
    this.societyEmail,
    this.societyPhone,
    this.residentName,
    this.residentPhotoUrl,
    this.residentProfile,
    this.currency = 'INR',
    this.unitNumber,
    this.towerName,
    this.floorName,
    this.maintenance = const [],
    this.upcomingBookings = const [],
    this.notices = const [],
    this.kidsActivities = const [],
    this.communityEvents = const [],
    this.advertisements = const [],
  });

  final String? societyName;
  final String? societyLogoUrl;
  final String? societyAddress;
  final String? societyEmail;
  final String? societyPhone;
  final String? residentName;
  final String? residentPhotoUrl;
  final ResidentProfileDetails? residentProfile;
  final String currency;
  final String? unitNumber;
  final String? towerName;
  final String? floorName;
  final List<ResidentMaintenance> maintenance;
  final List<ResidentUpcomingBooking> upcomingBookings;
  final List<ResidentNotice> notices;
  final List<ResidentKidsActivity> kidsActivities;
  final List<ResidentCommunityEvent> communityEvents;
  final List<ResidentAdvertisement> advertisements;

  ResidentDashboardData copyWith({
    List<ResidentUpcomingBooking>? upcomingBookings,
  }) => ResidentDashboardData(
    societyName: societyName,
    societyLogoUrl: societyLogoUrl,
    societyAddress: societyAddress,
    societyEmail: societyEmail,
    societyPhone: societyPhone,
    residentName: residentName,
    residentPhotoUrl: residentPhotoUrl,
    residentProfile: residentProfile,
    currency: currency,
    unitNumber: unitNumber,
    towerName: towerName,
    floorName: floorName,
    maintenance: maintenance,
    upcomingBookings: upcomingBookings ?? this.upcomingBookings,
    notices: notices,
    kidsActivities: kidsActivities,
    communityEvents: communityEvents,
    advertisements: advertisements,
  );

  factory ResidentDashboardData.fromJson(Map<String, dynamic> json) {
    final society = _asMap(json['society']);
    final resident = _asMap(json['resident']);
    final account = _asMap(json['account']);
    final unit = _asMap(json['unit']);
    final maintenanceRows = json['maintenance'] is List
        ? json['maintenance'] as List<dynamic>
        : json['maintenance'] is Map<String, dynamic>
        ? [json['maintenance']]
        : const <dynamic>[];
    final bookingRows = json['upcomingBookings'] as List<dynamic>?;
    final legacyBooking = _asMap(json['upcomingBooking']);
    final noticeRows = json['notices'] as List<dynamic>? ?? const [];
    return ResidentDashboardData(
      societyName: _string(society?['name']),
      societyLogoUrl: _imageUrl(society?['logoUrl']),
      societyAddress: _string(society?['address']),
      societyEmail: _string(society?['email']),
      societyPhone: _string(society?['phone']),
      residentName: _string(resident?['name']),
      residentPhotoUrl:
          _imageUrl(account?['photoUrl']) ?? _imageUrl(resident?['photoUrl']),
      residentProfile: resident == null
          ? null
          : ResidentProfileDetails.fromJson(resident),
      currency: _string(society?['currency']) ?? 'INR',
      unitNumber: _string(unit?['number']),
      towerName: _string(unit?['tower']),
      floorName: _string(unit?['floor']),
      maintenance: maintenanceRows
          .whereType<Map<String, dynamic>>()
          .map(ResidentMaintenance.fromJson)
          .toList(),
      upcomingBookings: (bookingRows ?? (legacyBooking == null ? [] : [legacyBooking]))
          .whereType<Map<String, dynamic>>()
          .map(ResidentUpcomingBooking.fromJson)
          .toList(),
      notices: noticeRows
          .whereType<Map<String, dynamic>>()
          .map(ResidentNotice.fromJson)
          .toList(),
      kidsActivities: (json['kidsActivities'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ResidentKidsActivity.fromJson)
          .toList(),
      communityEvents: (json['communityEvents'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ResidentCommunityEvent.fromJson)
          .toList(),
      advertisements: (json['advertisements'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ResidentAdvertisement.fromJson)
          .toList(),
    );
  }
}

class ResidentAdvertisement {
  const ResidentAdvertisement({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.description,
    required this.startsOn,
    required this.endsOn,
    required this.maxViewsPerResident,
    required this.impressionCount,
  });

  final String id;
  final String title;
  final String imageUrl;
  final String description;
  final DateTime? startsOn;
  final DateTime? endsOn;
  final int maxViewsPerResident;
  final int impressionCount;

  factory ResidentAdvertisement.fromJson(Map<String, dynamic> json) => ResidentAdvertisement(
    id: '${json['id'] ?? ''}',
    title: _string(json['title']) ?? 'Advertisement',
    imageUrl: _imageUrl(json['image_url']) ?? '',
    description: _string(json['description']) ?? '',
    startsOn: _parseCalendarDate(json['starts_on']),
    endsOn: _parseCalendarDate(json['ends_on']),
    maxViewsPerResident: int.tryParse('${json['max_views_per_resident'] ?? 1}') ?? 1,
    impressionCount: int.tryParse('${json['impression_count'] ?? 0}') ?? 0,
  );
}

class ResidentKidsActivity {
  const ResidentKidsActivity({
    required this.id,
    required this.name,
    required this.description,
    required this.activityDate,
    required this.activityDay,
    required this.activityTime,
    required this.activityEndTime,
    required this.minimumAge,
    required this.maximumAge,
    required this.registrationRequired,
    required this.registrationOpen,
    this.registrationDeadline,
    required this.registered,
    required this.children,
    this.winnerPrize,
  });

  final String id;
  final String name;
  final String description;
  final DateTime? activityDate;
  final String activityDay;
  final String activityTime;
  final String activityEndTime;
  final int minimumAge;
  final int maximumAge;
  final bool registrationRequired;
  final bool registrationOpen;
  final DateTime? registrationDeadline;
  final String? winnerPrize;
  final bool registered;
  final List<ResidentActivityChild> children;

  factory ResidentKidsActivity.fromJson(Map<String, dynamic> json) => ResidentKidsActivity(
    id: '${json['id'] ?? ''}',
    name: _string(json['name']) ?? 'Kids activity',
    description: _string(json['description']) ?? '',
    activityDate: _parseCalendarDate(json['activity_date']),
    activityDay: _string(json['activity_day']) ?? '',
    activityTime: _activityTimeLabel(json['activity_time']),
    activityEndTime: _activityTimeLabel(json['activity_end_time'] ?? json['activity_time']),
    minimumAge: int.tryParse('${json['minimum_age'] ?? 0}') ?? 0,
    maximumAge: int.tryParse('${json['maximum_age'] ?? 0}') ?? 0,
    registrationRequired: json['registration_required'] != false,
    registrationOpen: json['registration_open'] == true,
    registrationDeadline: DateTime.tryParse('${json['registration_deadline'] ?? ''}'),
    winnerPrize: _string(json['winner_prize']),
    registered: json['registered'] == true,
    children: (json['children'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ResidentActivityChild.fromJson)
        .toList(),
  );
}

class ResidentActivityChild {
  const ResidentActivityChild({required this.name, required this.age});
  final String name;
  final int age;
  factory ResidentActivityChild.fromJson(Map<String, dynamic> json) => ResidentActivityChild(
    name: _string(json['name']) ?? '',
    age: int.tryParse('${json['age'] ?? 0}') ?? 0,
  );
}

class ResidentCommunityEvent {
  const ResidentCommunityEvent({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.venue,
    required this.startAt,
    required this.endAt,
    this.registrationStartAt,
    this.registrationEndAt,
    this.capacity,
    this.remainingCapacity,
    this.registeredCount = 0,
    this.registrationOpen = false,
    this.registered = false,
    this.rsvpId,
    this.teamName,
    this.isFree = true,
  });

  final String id;
  final String title;
  final String description;
  final String category;
  final String venue;
  final DateTime? startAt;
  final DateTime? endAt;
  final DateTime? registrationStartAt;
  final DateTime? registrationEndAt;
  final int? capacity;
  final int? remainingCapacity;
  final int registeredCount;
  final bool registrationOpen;
  final bool registered;
  final String? rsvpId;
  final String? teamName;
  final bool isFree;

  factory ResidentCommunityEvent.fromJson(Map<String, dynamic> json) => ResidentCommunityEvent(
    id: '${json['id'] ?? ''}',
    title: _string(json['title']) ?? 'Community event',
    description: _string(json['description']) ?? '',
    category: (_string(json['category']) ?? 'OTHER').toUpperCase(),
    venue: _string(json['venue']) ?? 'Venue to be announced',
    startAt: DateTime.tryParse('${json['start_at'] ?? ''}')?.toLocal(),
    endAt: DateTime.tryParse('${json['end_at'] ?? ''}')?.toLocal(),
    registrationStartAt: DateTime.tryParse('${json['registration_start_at'] ?? ''}')?.toLocal(),
    registrationEndAt: DateTime.tryParse('${json['registration_end_at'] ?? ''}')?.toLocal(),
    capacity: int.tryParse('${json['capacity'] ?? ''}'),
    remainingCapacity: int.tryParse('${json['remaining_capacity'] ?? ''}'),
    registeredCount: int.tryParse('${json['registered_count'] ?? 0}') ?? 0,
    registrationOpen: json['registration_open'] == true,
    registered: json['registered'] == true,
    rsvpId: _string(json['rsvp_id']),
    teamName: _string(json['team_name']),
    isFree: json['is_free'] != false,
  );
}

class ResidentProfileDetails {
  const ResidentProfileDetails({
    this.email,
    this.phone,
    this.alternatePhone,
    this.dateOfBirth,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.emergencyContactRelation,
    this.role,
    this.status,
  });

  final String? email;
  final String? phone;
  final String? alternatePhone;
  final String? dateOfBirth;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? emergencyContactRelation;
  final String? role;
  final String? status;

  factory ResidentProfileDetails.fromJson(Map<String, dynamic> json) =>
      ResidentProfileDetails(
        email: _string(json['email']),
        phone: _string(json['phone']),
        alternatePhone: _string(json['alternatePhone']),
        dateOfBirth: _string(json['dateOfBirth']),
        emergencyContactName: _string(json['emergencyContactName']),
        emergencyContactPhone: _string(json['emergencyContactPhone']),
        emergencyContactRelation: _string(json['emergencyContactRelation']),
        role: _string(json['role']),
        status: _string(json['status']),
      );
}

class ResidentUpcomingBooking {
  const ResidentUpcomingBooking({
    required this.amenityName,
    required this.status,
    required this.slotDate,
    required this.startTime,
    required this.endTime,
  });

  final String amenityName;
  final String status;
  final DateTime? slotDate;
  final String startTime;
  final String endTime;

  factory ResidentUpcomingBooking.fromJson(Map<String, dynamic> json) =>
      ResidentUpcomingBooking(
        amenityName: _string(json['amenity_name']) ?? 'Amenity',
        status: _string(json['status']) ?? 'PENDING_PAYMENT',
        slotDate: _parseCalendarDate(json['slot_date']),
        startTime: _timeLabel(json['start_time']),
        endTime: _timeLabel(json['end_time']),
      );
}

class ResidentMaintenance {
  const ResidentMaintenance({
    required this.amount,
    required this.dueDate,
    required this.status,
    this.billingPeriod,
    this.invoiceNumber,
    this.description,
  });

  final num amount;
  final DateTime? dueDate;
  final String status;
  final String? billingPeriod;
  final String? invoiceNumber;
  final String? description;

  factory ResidentMaintenance.fromJson(Map<String, dynamic> json) =>
      ResidentMaintenance(
        amount: num.tryParse('${json['outstanding_amount'] ?? 0}') ?? 0,
        dueDate: _parseCalendarDate(json['due_date']),
        status: _string(json['status']) ?? 'ISSUED',
        billingPeriod: _string(json['billing_period']),
        invoiceNumber: _string(json['invoice_number']),
        description: _string(json['description']),
      );
}

class ResidentNotice {
  const ResidentNotice({
    required this.title,
    required this.description,
    required this.status,
    this.postedAt,
    this.scheduledAt,
    this.expiresAt,
  });

  final String title;
  final String description;
  final String status;
  final DateTime? postedAt;
  final DateTime? scheduledAt;
  final DateTime? expiresAt;

  factory ResidentNotice.fromJson(Map<String, dynamic> json) => ResidentNotice(
    title: _string(json['title']) ?? '',
    description: _string(json['description']) ?? '',
    status: _string(json['status']) ?? 'PUBLISHED',
    postedAt: DateTime.tryParse(
      '${json['posted_at'] ?? json['scheduled_at'] ?? json['created_at'] ?? ''}',
    ),
    scheduledAt: DateTime.tryParse('${json['scheduled_at'] ?? ''}'),
    expiresAt: DateTime.tryParse('${json['expires_at'] ?? ''}'),
  );
}

class ResidentDashboardApi {
  ResidentDashboardApi._();

  static Future<ResidentDashboardData> load(String accessToken) async {
    final client = http.Client();
    try {
      final response = await client
          .get(
            Uri.parse('$_apiBaseUrl/resident-dashboard'),
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentDashboardException(
          _string(body['message']) ?? 'Could not load your resident dashboard.',
        );
      }
      final data = _asMap(body['data']);
      if (data == null) {
        throw const ResidentDashboardException(
          'The server returned an unexpected dashboard response.',
        );
      }
      return ResidentDashboardData.fromJson(data);
    } on ResidentDashboardException {
      rethrow;
    } on http.ClientException {
      throw const ResidentDashboardException(
        'Cannot reach the server. Check the connection and try again.',
      );
    } on TimeoutException {
      throw const ResidentDashboardException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const ResidentDashboardException(
        'The server returned invalid dashboard data.',
      );
    } finally {
      client.close();
    }
  }

  static Future<void> recordAdvertisementImpression(String accessToken, String id) =>
      _postAdvertisementAction(accessToken, id, 'impression');

  static Future<void> dismissAdvertisement(String accessToken, String id) =>
      _postAdvertisementAction(accessToken, id, 'dismiss');

  static Future<void> registerForCommunityEvent(
    String accessToken,
    String eventId, {
    String? teamName,
    required List<String> participantNames,
  }) async {
    final client = http.Client();
    try {
      final response = await client.post(
        Uri.parse('$_apiBaseUrl/resident-dashboard/community-events/$eventId/register'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({'teamName': teamName, 'participantNames': participantNames}),
      ).timeout(const Duration(seconds: 15));
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final body = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body) as Map<String, dynamic>;
        throw ResidentDashboardException(_string(body['message']) ?? 'Could not register for this event.');
      }
    } on http.ClientException {
      throw const ResidentDashboardException('Cannot reach the server.');
    } on TimeoutException {
      throw const ResidentDashboardException('The server took too long to respond.');
    } finally {
      client.close();
    }
  }

  static Future<void> _postAdvertisementAction(String accessToken, String id, String action) async {
    final client = http.Client();
    try {
      final response = await client.post(
        Uri.parse('$_apiBaseUrl/advertisements/resident/$id/$action'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $accessToken'},
      ).timeout(const Duration(seconds: 12));
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final body = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body) as Map<String, dynamic>;
        throw ResidentDashboardException(_string(body['message']) ?? 'Could not update advertisement view.');
      }
    } on http.ClientException {
      throw const ResidentDashboardException('Cannot reach the server.');
    } on TimeoutException {
      throw const ResidentDashboardException('The server took too long to respond.');
    } finally {
      client.close();
    }
  }
}

class ResidentDashboardException implements Exception {
  const ResidentDashboardException(this.message);
  final String message;

  @override
  String toString() => message;
}

Map<String, dynamic>? _asMap(Object? value) =>
    value is Map<String, dynamic> ? value : null;

String? _string(Object? value) {
  final result = value?.toString().trim();
  return result == null || result.isEmpty || result == 'null' ? null : result;
}

String? _imageUrl(Object? value) {
  final path = _string(value);
  if (path == null) return null;
  final uri = Uri.tryParse(path);
  if (uri == null) return null;
  if (uri.hasScheme) return uri.toString();
  return Uri.parse(_apiBaseUrl).resolve(path).toString();
}

DateTime? _parseCalendarDate(Object? value) {
  final raw = value?.toString();
  if (raw == null || raw.length < 10) return null;
  final pieces = raw.substring(0, 10).split('-');
  if (pieces.length != 3) return null;
  final year = int.tryParse(pieces[0]);
  final month = int.tryParse(pieces[1]);
  final day = int.tryParse(pieces[2]);
  if (year == null || month == null || day == null) return null;
  return DateTime(year, month, day);
}

String _timeLabel(Object? value) {
  final raw = value?.toString() ?? '';
  return raw.length >= 5 ? raw.substring(0, 5) : raw;
}

String _activityTimeLabel(Object? value) {
  final raw = _timeLabel(value);
  final parts = raw.split(':');
  if (parts.length != 2) return raw;
  final hour24 = int.tryParse(parts[0]);
  if (hour24 == null || hour24 < 0 || hour24 > 23) return raw;
  final period = hour24 >= 12 ? 'PM' : 'AM';
  final hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12;
  return '$hour12:${parts[1]} $period';
}
