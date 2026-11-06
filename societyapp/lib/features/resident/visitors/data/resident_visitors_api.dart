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

class ResidentVisitorRecord {
  const ResidentVisitorRecord({
    required this.id,
    required this.visitorName,
    required this.visitorType,
    required this.gateName,
    required this.status,
    required this.residentDecision,
    required this.createdAt,
  });

  final String id;
  final String visitorName;
  final String visitorType;
  final String gateName;
  final String status;
  final String residentDecision;
  final DateTime? createdAt;

  factory ResidentVisitorRecord.fromJson(Map<String, dynamic> json) =>
      ResidentVisitorRecord(
        id: '${json['id'] ?? ''}',
        visitorName: '${json['visitor_name'] ?? 'Visitor'}',
        visitorType: '${json['visitor_type'] ?? 'GUEST'}',
        gateName: '${json['gate_name'] ?? 'Main gate'}',
        status: '${json['status'] ?? 'EXPECTED'}'.toUpperCase(),
        residentDecision:
            '${json['resident_decision'] ?? 'NOT_REQUIRED'}'.toUpperCase(),
        createdAt: DateTime.tryParse(
          '${json['created_at'] ?? json['requested_at'] ?? ''}',
        ),
      );
}

typedef ResidentVisitorRequest = ResidentVisitorRecord;

class ResidentVisitorsApi {
  ResidentVisitorsApi._();

  static Future<List<ResidentVisitorRecord>> listPending(String token) =>
      _list(token, '/visitors/resident-requests');

  static Future<List<ResidentVisitorRecord>> listHistory(String token) =>
      _list(token, '/visitors/resident-history');

  static Future<List<ResidentVisitorRecord>> _list(String token, String path) async {
    final rows = await _request(token, path);
    if (rows is! List) {
      throw const ResidentVisitorException('The server returned invalid visitor records.');
    }
    return rows
        .whereType<Map<String, dynamic>>()
        .map(ResidentVisitorRecord.fromJson)
        .toList();
  }

  static Future<void> decide({
    required String token,
    required String passId,
    required String decision,
  }) async {
    await _request(
      token,
      '/visitors/resident-requests/$passId/decision',
      method: 'PATCH',
      payload: {'decision': decision},
    );
  }

  static Future<void> createPreApproval({
    required String token,
    required String name,
    required String phone,
    required DateTime expectedFrom,
    required String purpose,
  }) async {
    await _request(token, '/visitors/resident-invites', method: 'POST', payload: {
      'name': name,
      'phone': phone,
      'visitorType': 'GUEST',
      'expectedFrom': expectedFrom.toUtc().toIso8601String(),
      'purpose': purpose,
    });
  }

  static Future<dynamic> _request(
    String token,
    String path, {
    String method = 'GET',
    Map<String, dynamic>? payload,
  }) async {
    try {
      final uri = Uri.parse('$_apiBaseUrl$path').replace(
        queryParameters: method == 'GET'
            ? {'_refresh': DateTime.now().microsecondsSinceEpoch.toString()}
            : null,
      );
      final response = await (method == 'GET'
              ? http.get(uri, headers: {
                  'Accept': 'application/json',
                  'Authorization': 'Bearer $token',
                  'Cache-Control': 'no-cache, no-store',
                })
              : method == 'POST'
                  ? http.post(uri,
                      headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer $token',
                        'Content-Type': 'application/json',
                      },
                      body: jsonEncode(payload))
                  : http.patch(uri,
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer $token',
                    'Content-Type': 'application/json',
                  },
                  body: jsonEncode(payload)))
          .timeout(const Duration(seconds: 15));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentVisitorException(
          body['message']?.toString() ?? 'Could not load visitor records.',
        );
      }
      return body['data'];
    } on ResidentVisitorException {
      rethrow;
    } on http.ClientException {
      throw const ResidentVisitorException(
        'Cannot reach the server. Check your connection and try again.',
      );
    } on TimeoutException {
      throw const ResidentVisitorException('The server took too long to respond.');
    } on FormatException {
      throw const ResidentVisitorException('The server returned invalid data.');
    }
  }
}

class ResidentVisitorException implements Exception {
  const ResidentVisitorException(this.message);
  final String message;

  @override
  String toString() => message;
}
