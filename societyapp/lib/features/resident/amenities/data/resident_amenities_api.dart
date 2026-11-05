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
    : 'http://10.0.2.2:5000/api/v1';

class ResidentAmenity {
  const ResidentAmenity({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.location,
    this.capacity,
    this.bookingRequired = true,
  });

  final String id;
  final String name;
  final String type;
  final String status;
  final String? location;
  final int? capacity;
  final bool bookingRequired;

  factory ResidentAmenity.fromJson(Map<String, dynamic> json) =>
      ResidentAmenity(
        id: '${json['id'] ?? ''}',
        name: '${json['name'] ?? 'Amenity'}',
        type: '${json['amenity_type'] ?? ''}',
        status: '${json['status'] ?? 'ACTIVE'}',
        location: _optionalString(json['location']),
        capacity: int.tryParse('${json['capacity'] ?? ''}'),
        bookingRequired: json['booking_required'] != false,
      );
}

class ResidentAmenitySlot {
  const ResidentAmenitySlot({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.capacity,
    required this.price,
    required this.status,
  });

  final String id;
  final DateTime? date;
  final String startTime;
  final String endTime;
  final int capacity;
  final num price;
  final String status;

  factory ResidentAmenitySlot.fromJson(Map<String, dynamic> json) =>
      ResidentAmenitySlot(
        id: '${json['id'] ?? ''}',
        date: _dateOnly(json['slot_date']),
        startTime: _timeString(json['start_time']),
        endTime: _timeString(json['end_time']),
        capacity: int.tryParse('${json['capacity'] ?? 0}') ?? 0,
        price: num.tryParse('${json['price'] ?? 0}') ?? 0,
        status: '${json['status'] ?? 'AVAILABLE'}',
      );
}

class ResidentAmenityBooking {
  const ResidentAmenityBooking({
    required this.bookingNumber,
    required this.status,
    required this.amount,
    required this.amenitySlotId,
  });

  final String bookingNumber;
  final String status;
  final num amount;
  final String amenitySlotId;

  factory ResidentAmenityBooking.fromJson(Map<String, dynamic> json) =>
      ResidentAmenityBooking(
        bookingNumber: '${json['booking_no'] ?? ''}',
        status: '${json['status'] ?? 'PENDING_PAYMENT'}',
        amount: num.tryParse('${json['amount'] ?? 0}') ?? 0,
        amenitySlotId: '${json['amenity_slot_id'] ?? ''}',
      );
}

class ResidentAmenitiesApi {
  ResidentAmenitiesApi._();

  static Future<List<ResidentAmenity>> listAmenities(String token) async =>
      _list(token, '/resident-amenities', ResidentAmenity.fromJson);

  static Future<List<ResidentAmenityBooking>> listMyBookings(String token) async =>
      _list(token, '/resident-amenities/bookings', ResidentAmenityBooking.fromJson);

  static Future<List<ResidentAmenitySlot>> listSlots(
    String token,
    String amenityId,
  ) async => _list(
        token,
        '/resident-amenities/$amenityId/slots',
        ResidentAmenitySlot.fromJson,
      );

  static Future<ResidentAmenityBooking> createBooking({
    required String token,
    required String slotId,
    int guestsCount = 0,
  }) async {
    final data = await _request(
      token,
      '/resident-amenities/bookings',
      method: 'POST',
      payload: {'amenitySlotId': slotId, 'guestsCount': guestsCount},
    );
    if (data is Map<String, dynamic>) {
      return ResidentAmenityBooking.fromJson(data);
    }
    throw const ResidentAmenitiesException('The server returned an invalid booking.');
  }

  static Future<List<T>> _list<T>(
    String token,
    String path,
    T Function(Map<String, dynamic>) parse,
  ) async {
    final rows = await _request(token, path);
    if (rows is! List) {
      throw const ResidentAmenitiesException('The server returned invalid amenity data.');
    }
    return rows.whereType<Map<String, dynamic>>().map(parse).toList();
  }

  static Future<dynamic> _request(
    String token,
    String path, {
    String method = 'GET',
    Map<String, dynamic>? payload,
  }) async {
    try {
      var uri = Uri.parse('$_apiBaseUrl$path');
      if (method == 'GET') {
        uri = uri.replace(queryParameters: {
          ...uri.queryParameters,
          '_refresh': DateTime.now().microsecondsSinceEpoch.toString(),
        });
      }
      final headers = <String, String>{
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        if (method == 'GET') ...{
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        if (payload != null) 'Content-Type': 'application/json',
      };
      final response = await (method == 'GET'
              ? http.get(uri, headers: headers)
              : http.post(uri, headers: headers, body: jsonEncode(payload)))
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentAmenitiesException(
          body['message']?.toString() ?? 'Could not load amenities.',
        );
      }
      return body['data'];
    } on ResidentAmenitiesException {
      rethrow;
    } on http.ClientException {
      throw const ResidentAmenitiesException(
        'Cannot reach the server. Check your connection and try again.',
      );
    } on TimeoutException {
      throw const ResidentAmenitiesException('The server took too long to respond.');
    } on FormatException {
      throw const ResidentAmenitiesException('The server returned invalid data.');
    }
  }
}

class ResidentAmenitiesException implements Exception {
  const ResidentAmenitiesException(this.message);
  final String message;

  @override
  String toString() => message;
}

String? _optionalString(Object? value) {
  final result = value?.toString().trim();
  return result == null || result.isEmpty || result == 'null' ? null : result;
}

String _timeString(Object? value) {
  final time = value?.toString() ?? '';
  if (time.length < 5) return time;
  final parts = time.substring(0, 5).split(':');
  if (parts.length != 2) return time.substring(0, 5);
  final hour = int.tryParse(parts[0]);
  if (hour == null || hour < 0 || hour > 23) return time.substring(0, 5);
  return '${hour % 12 == 0 ? 12 : hour % 12}:${parts[1]} ${hour >= 12 ? 'PM' : 'AM'}';
}

DateTime? _dateOnly(Object? value) {
  final raw = value?.toString();
  if (raw == null || raw.length < 10) return null;
  final parts = raw.substring(0, 10).split('-');
  if (parts.length != 3) return null;
  final year = int.tryParse(parts[0]);
  final month = int.tryParse(parts[1]);
  final day = int.tryParse(parts[2]);
  if (year == null || month == null || day == null) return null;
  return DateTime(year, month, day);
}
