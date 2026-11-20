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

class ResidentAppNotification {
  const ResidentAppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.priority,
    this.referenceType,
    this.createdAt,
    this.scheduledAt,
    this.expiresAt,
  });

  final String id;
  final String title;
  final String message;
  final String type;
  final String priority;
  final String? referenceType;
  final DateTime? createdAt;
  final DateTime? scheduledAt;
  final DateTime? expiresAt;

  factory ResidentAppNotification.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : const <String, dynamic>{};
    return ResidentAppNotification(
        id: '${json['id'] ?? ''}',
        title: '${json['title'] ?? json['subject'] ?? 'Notification'}',
        message: '${json['message'] ?? ''}',
        type: '${json['notification_type'] ?? 'OPERATIONAL'}',
        priority: '${json['priority'] ?? 'MEDIUM'}',
        referenceType: json['reference_type']?.toString(),
        createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
        scheduledAt: DateTime.tryParse('${data['scheduledAt'] ?? ''}'),
        expiresAt: DateTime.tryParse('${data['expiresAt'] ?? ''}'),
      );
  }
}

class ResidentNotificationsApi {
  ResidentNotificationsApi._();

  static Future<List<ResidentAppNotification>> listUnread(
    String accessToken,
  ) async {
    final data = await _request(
      accessToken,
      '/resident-dashboard/notifications',
    );
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(ResidentAppNotification.fromJson)
        .where((notification) => notification.id.isNotEmpty)
        .toList();
  }

  static Future<void> markRead(String accessToken, String id) async {
    await _request(
      accessToken,
      '/resident-dashboard/notifications/$id/read',
      method: 'PATCH',
    );
  }

  static Future<dynamic> _request(
    String accessToken,
    String path, {
    String method = 'GET',
  }) async {
    final client = http.Client();
    try {
      final uri = Uri.parse('$_apiBaseUrl$path');
      final response =
          await (method == 'GET'
                  ? client.get(uri, headers: _headers(accessToken))
                  : client.patch(uri, headers: _headers(accessToken)))
              .timeout(const Duration(seconds: 15));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentNotificationsException(
          body['message']?.toString() ?? 'Could not load notifications.',
        );
      }
      return body['data'];
    } on ResidentNotificationsException {
      rethrow;
    } on http.ClientException {
      throw const ResidentNotificationsException('Cannot reach the server.');
    } on TimeoutException {
      throw const ResidentNotificationsException(
        'The server took too long to respond.',
      );
    } on FormatException {
      throw const ResidentNotificationsException(
        'The server returned invalid notification data.',
      );
    } finally {
      client.close();
    }
  }

  static Map<String, String> _headers(String accessToken) => {
    'Accept': 'application/json',
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store',
  };
}

class ResidentNotificationsException implements Exception {
  const ResidentNotificationsException(this.message);
  final String message;

  @override
  String toString() => message;
}
