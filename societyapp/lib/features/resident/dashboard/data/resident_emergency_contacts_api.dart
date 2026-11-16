import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:housing_society_app/app/session_manager.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl.replaceFirst(RegExp(r'/v1/?$'), '')
    : kIsWeb
    ? 'http://localhost:5000/api'
    : 'http://localhost:5000/api';

class ResidentEmergencyContact {
  const ResidentEmergencyContact({
    required this.name,
    required this.category,
    required this.phone,
    this.alternatePhone,
    this.email,
    this.address,
    this.operatingHours,
    this.available24x7 = false,
    this.notes,
    this.isActive = true,
  });

  final String name;
  final String category;
  final String phone;
  final String? alternatePhone;
  final String? email;
  final String? address;
  final String? operatingHours;
  final bool available24x7;
  final String? notes;
  final bool isActive;

  factory ResidentEmergencyContact.fromJson(Map<String, dynamic> json) =>
      ResidentEmergencyContact(
        name: _string(json['name']) ?? 'Emergency contact',
        category: _string(json['category']) ?? 'OTHER',
        phone: _string(json['phone']) ?? '',
        alternatePhone: _string(json['alternatePhone']),
        email: _string(json['email']),
        address: _string(json['address']),
        operatingHours: _string(json['operatingHours']),
        available24x7: json['available24x7'] == true,
        notes: _string(json['notes']),
        isActive: json['isActive'] != false,
      );
}

class ResidentEmergencyContactsApi {
  ResidentEmergencyContactsApi._();

  static Future<List<ResidentEmergencyContact>> list(String accessToken) async {
    final client = http.Client();
    try {
      final response = await client
          .get(
            Uri.parse('$_apiBaseUrl/society-emergency-contacts'),
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
        throw ResidentEmergencyContactsException(
          _string(body['message']) ?? 'Could not load emergency contacts.',
        );
      }
      final rows = body['data'];
      if (rows is! List) return const [];
      return rows
          .whereType<Map<String, dynamic>>()
          .map(ResidentEmergencyContact.fromJson)
          .where((contact) => contact.phone.isNotEmpty)
          .toList();
    } on ResidentEmergencyContactsException {
      rethrow;
    } on http.ClientException {
      throw const ResidentEmergencyContactsException(
        'Cannot reach the server. Check the connection and try again.',
      );
    } on TimeoutException {
      throw const ResidentEmergencyContactsException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const ResidentEmergencyContactsException(
        'The server returned invalid emergency contact data.',
      );
    } finally {
      client.close();
    }
  }
}

class ResidentEmergencyContactsException implements Exception {
  const ResidentEmergencyContactsException(this.message);
  final String message;

  @override
  String toString() => message;
}

String? _string(Object? value) {
  final result = value?.toString().trim();
  return result == null || result.isEmpty || result == 'null' ? null : result;
}
