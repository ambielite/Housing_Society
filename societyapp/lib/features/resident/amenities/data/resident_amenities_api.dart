import 'dart:async';
import 'dart:convert';
import 'dart:io';

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:5000/api/v1',
);

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
  });

  final String bookingNumber;
  final String status;
  final num amount;

  factory ResidentAmenityBooking.fromJson(Map<String, dynamic> json) =>
      ResidentAmenityBooking(
        bookingNumber: '${json['booking_no'] ?? ''}',
        status: '${json['status'] ?? 'PENDING_PAYMENT'}',
        amount: num.tryParse('${json['amount'] ?? 0}') ?? 0,
      );
}

class ResidentAmenitiesApi {
  ResidentAmenitiesApi._();

  static Future<List<ResidentAmenity>> listAmenities(String token) async =>
      _list(token, '/resident-amenities', ResidentAmenity.fromJson);

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
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 12);
    try {
      final uri = Uri.parse('$_apiBaseUrl$path');
      final request = await (method == 'GET'
              ? client.getUrl(uri)
              : client.postUrl(uri))
          .timeout(const Duration(seconds: 15));
      request.headers
        ..set(HttpHeaders.acceptHeader, ContentType.json.mimeType)
        ..set(HttpHeaders.authorizationHeader, 'Bearer $token');
      if (payload != null) {
        request.headers.contentType = ContentType.json;
        request.write(jsonEncode(payload));
      }
      final response = await request.close().timeout(const Duration(seconds: 20));
      final text = await utf8.decoder.bind(response).join();
      final body = text.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(text) as Map<String, dynamic>;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentAmenitiesException(
          body['message']?.toString() ?? 'Could not load amenities.',
        );
      }
      return body['data'];
    } on ResidentAmenitiesException {
      rethrow;
    } on SocketException {
      throw const ResidentAmenitiesException(
        'Cannot reach the server. Check your connection and try again.',
      );
    } on TimeoutException {
      throw const ResidentAmenitiesException('The server took too long to respond.');
    } on FormatException {
      throw const ResidentAmenitiesException('The server returned invalid data.');
    } finally {
      client.close(force: true);
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
  return time.length >= 5 ? time.substring(0, 5) : time;
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
