import 'dart:convert';

import 'package:http/http.dart' as http;

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');
String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    : 'http://localhost:5000/api/v1';

class DomesticHelper {
  const DomesticHelper({
    required this.id,
    required this.name,
    required this.mobileNumber,
    required this.staffType,
    this.profilePhotoUrl,
  });

  final String id;
  final String name;
  final String mobileNumber;
  final String staffType;
  final String? profilePhotoUrl;

  factory DomesticHelper.fromJson(Map<String, dynamic> json) => DomesticHelper(
    id: '${json['id'] ?? ''}',
    name: '${json['name'] ?? 'Domestic helper'}',
    mobileNumber: '${json['mobileNumber'] ?? ''}',
    staffType: '${json['staffType'] ?? 'OTHER'}',
    profilePhotoUrl: json['profilePhotoUrl']?.toString(),
  );
}

class DomesticHelpersApi {
  static Future<List<DomesticHelper>> list(String accessToken) async {
    final response = await http.get(
      Uri.parse('$_apiBaseUrl/resident-dashboard/staff-directory'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } on FormatException {
      throw Exception('Staff directory returned an invalid server response.');
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = body is Map ? body['message'] : null;
      throw Exception(message?.toString() ?? 'Could not load staff records (HTTP ${response.statusCode}).');
    }
    final rows = body is Map ? body['data'] : null;
    if (rows is! List) throw Exception('Staff directory response did not contain a staff list.');
    return rows
        .whereType<Map>()
        .map((row) => DomesticHelper.fromJson(Map<String, dynamic>.from(row)))
        .toList(growable: false);
  }
}
