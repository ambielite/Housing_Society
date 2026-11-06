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

class ResidentDeliveryNotification {
  const ResidentDeliveryNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    this.createdAt,
  });

  final String id;
  final String title;
  final String message;
  final String type;
  final DateTime? createdAt;

  factory ResidentDeliveryNotification.fromJson(Map<String, dynamic> json) =>
      ResidentDeliveryNotification(
        id: '${json['id'] ?? ''}',
        title: '${json['title'] ?? 'Delivery update'}',
        message: '${json['message'] ?? ''}',
        type: '${json['reference_type'] ?? 'DELIVERY'}',
        createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
      );
}

class ResidentDeliveryNotificationsApi {
  ResidentDeliveryNotificationsApi._();

  static Future<List<ResidentDeliveryNotification>> list(String token) async {
    final data = await _request(token, '/deliveries/resident-notifications');
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(ResidentDeliveryNotification.fromJson)
        .toList();
  }

  static Future<void> markRead(String token, String id) async {
    await _request(token, '/deliveries/resident-notifications/$id/read',
        method: 'PATCH');
  }

  static Future<dynamic> _request(String token, String path,
      {String method = 'GET'}) async {
    try {
      final uri = Uri.parse('$_apiBaseUrl$path');
      final response = method == 'GET'
          ? await http.get(uri, headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer $token',
              'Cache-Control': 'no-cache, no-store',
            }).timeout(const Duration(seconds: 15))
          : await http.patch(uri, headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer $token',
            }).timeout(const Duration(seconds: 15));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentDeliveryNotificationException(
            body['message']?.toString() ?? 'Could not load delivery updates.');
      }
      return body['data'];
    } on ResidentDeliveryNotificationException {
      rethrow;
    } on http.ClientException {
      throw const ResidentDeliveryNotificationException(
          'Cannot reach the server.');
    } on TimeoutException {
      throw const ResidentDeliveryNotificationException(
          'The server took too long to respond.');
    } on FormatException {
      throw const ResidentDeliveryNotificationException(
          'The server returned invalid data.');
    }
  }
}

class ResidentDeliveryNotificationException implements Exception {
  const ResidentDeliveryNotificationException(this.message);
  final String message;
}
