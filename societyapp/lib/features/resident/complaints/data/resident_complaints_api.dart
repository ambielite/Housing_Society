import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    : kIsWeb
    ? 'http://localhost:5000/api/v1'
    : 'http://10.0.2.2:5000/api/v1';

class ComplaintCategory {
  const ComplaintCategory({required this.id, required this.name});
  final String id;
  final String name;

  factory ComplaintCategory.fromJson(Map<String, dynamic> json) =>
      ComplaintCategory(
        id: '${json['id'] ?? ''}',
        name: '${json['name'] ?? 'Other'}',
      );
}

class ResidentComplaint {
  const ResidentComplaint({
    required this.id,
    required this.ticketNumber,
    required this.subject,
    required this.description,
    required this.status,
    required this.priority,
    this.categoryName,
    this.openedAt,
  });

  final String id;
  final String ticketNumber;
  final String subject;
  final String description;
  final String status;
  final String priority;
  final String? categoryName;
  final DateTime? openedAt;

  factory ResidentComplaint.fromJson(Map<String, dynamic> json) =>
      ResidentComplaint(
        id: '${json['id'] ?? ''}',
        ticketNumber: '${json['ticket_no'] ?? ''}',
        subject: '${json['subject'] ?? ''}',
        description: '${json['description'] ?? ''}',
        status: '${json['status'] ?? 'OPEN'}',
        priority: '${json['priority'] ?? 'MEDIUM'}',
        categoryName: json['category_name']?.toString(),
        openedAt: DateTime.tryParse('${json['opened_at'] ?? ''}'),
      );

  ResidentComplaint withCategoryName(String? value) => ResidentComplaint(
        id: id,
        ticketNumber: ticketNumber,
        subject: subject,
        description: description,
        status: status,
        priority: priority,
        categoryName: categoryName ?? value,
        openedAt: openedAt,
      );
}

class ResidentComplaintsApi {
  ResidentComplaintsApi._();

  static Future<List<ComplaintCategory>> listCategories(String token) async {
    final rows = await _get(token, '/resident-complaints/categories');
    return (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(ComplaintCategory.fromJson)
        .toList();
  }

  static Future<List<ResidentComplaint>> listComplaints(String token) async {
    final rows = await _get(token, '/resident-complaints');
    return (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(ResidentComplaint.fromJson)
        .toList();
  }

  static Future<ResidentComplaint> create({
    required String token,
    required String categoryId,
    required String categoryName,
    required String subject,
    required String description,
  }) async {
    final result = await _send(
      token,
      '/resident-complaints',
      method: 'POST',
      payload: {
        'categoryId': categoryId,
        'subject': subject,
        'description': description,
      },
    );
    if (result is Map<String, dynamic>) {
      return ResidentComplaint.fromJson(result).withCategoryName(categoryName);
    }
    throw const ResidentComplaintException(
      'The server did not return the submitted complaint.',
    );
  }

  static Future<dynamic> _get(String token, String path) async {
    return _request(token, path, method: 'GET');
  }

  static Future<dynamic> _send(
    String token,
    String path, {
    required String method,
    required Map<String, dynamic> payload,
  }) => _request(token, path, method: method, payload: payload);

  static Future<dynamic> _request(
    String token,
    String path, {
    required String method,
    Map<String, dynamic>? payload,
  }) async {
    final client = http.Client();
    try {
      final headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        if (payload != null) 'Content-Type': 'application/json',
      };
      final uri = Uri.parse('$_apiBaseUrl$path');
      final response = await (method == 'GET'
              ? client.get(uri, headers: headers)
              : client.post(
                  uri,
                  headers: headers,
                  body: payload == null ? null : jsonEncode(payload),
                ))
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentComplaintException(
          body['message']?.toString() ?? 'Could not load Helpdesk data.',
        );
      }
      return body['data'];
    } on ResidentComplaintException {
      rethrow;
    } on http.ClientException {
      throw const ResidentComplaintException(
        'Cannot reach the server. Check your connection and try again.',
      );
    } on TimeoutException {
      throw const ResidentComplaintException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const ResidentComplaintException(
        'The server returned an invalid response.',
      );
    } finally {
      client.close();
    }
  }
}

class ResidentComplaintException implements Exception {
  const ResidentComplaintException(this.message);
  final String message;

  @override
  String toString() => message;
}
