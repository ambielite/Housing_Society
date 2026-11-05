import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:housing_society_app/app/session_manager.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _apiBaseUrl {
  if (_configuredApiBaseUrl.isNotEmpty) return _configuredApiBaseUrl;
  return kIsWeb
      ? 'http://localhost:5000/api/v1'
      : 'http://10.0.2.2:5000/api/v1';
}

class AuthenticatedUser {
  const AuthenticatedUser({
    required this.userId,
    required this.name,
    required this.email,
    required this.accessToken,
    required this.roles,
    required this.permissions,
    this.employeeCode,
    this.phone,
    this.profilePictureUrl,
    this.status,
    this.societyId,
    this.createdAt,
    this.lastLoginAt,
  });

  final String userId;
  final String name;
  final String email;
  final String accessToken;
  final List<String> roles;
  final List<String> permissions;
  final String? employeeCode;
  final String? phone;
  final String? profilePictureUrl;
  final String? status;
  final String? societyId;
  final DateTime? createdAt;
  final DateTime? lastLoginAt;
}

class AuthApi {
  AuthApi._();

  static Future<AuthenticatedUser> login({
    required String email,
    required String password,
    String? securityCode,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_apiBaseUrl/auth/login'),
            headers: const {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email,
              'password': password,
              ...?securityCode == null ? null : {'securityCode': securityCode},
            }),
          )
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AuthException(
          body['message'] as String? ?? 'Sign in failed. Please try again.',
        );
      }

      final data = body['data'] as Map<String, dynamic>?;
      final user = data?['user'] as Map<String, dynamic>?;
      final token = data?['accessToken'] as String?;
      if (user == null || token == null || token.isEmpty) {
        throw const AuthException(
          'The server returned an unexpected response.',
        );
      }

      final firstName = (user['first_name'] ?? user['firstName'] ?? '')
          .toString();
      final lastName = (user['last_name'] ?? user['lastName'] ?? '').toString();
      final fullName = '$firstName $lastName'.trim();

      return AuthenticatedUser(
        userId: (user['id'] ?? '').toString(),
        name: fullName.isEmpty ? email : fullName,
        email: (user['email'] ?? email).toString(),
        accessToken: token,
        roles: (user['roles'] as List<dynamic>? ?? const [])
            .map((role) => role.toString())
            .toList(growable: false),
        permissions: (user['permissions'] as List<dynamic>? ?? const [])
            .map((permission) => permission.toString())
            .toList(growable: false),
        employeeCode: user['guard_employee_code']?.toString(),
        phone: user['phone']?.toString(),
        profilePictureUrl: user['profile_picture_url']?.toString(),
        status: user['status']?.toString(),
        societyId: user['society_id']?.toString(),
        createdAt: DateTime.tryParse('${user['created_at'] ?? ''}'),
        lastLoginAt: DateTime.tryParse('${user['last_login_at'] ?? ''}'),
      );
    } on AuthException {
      rethrow;
    } on http.ClientException {
      throw const AuthException(
        'Cannot reach the server. Make sure the backend is running and the API address is correct.',
      );
    } on TimeoutException {
      throw const AuthException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const AuthException('The server returned an invalid response.');
    }
  }

  static Future<void> changePassword({
    required String accessToken,
    required String currentPassword,
    required String newPassword,
  }) async {
    await _authenticatedPost('/auth/change-password', accessToken, {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  static Future<void> forgotPassword({required String email}) async {
    await _post('/auth/forgot-password', {'email': email});
  }

  static Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _post('/auth/reset-password', {
      'token': token,
      'newPassword': newPassword,
    });
  }

  static Future<void> _authenticatedPost(
    String path,
    String accessToken,
    Map<String, dynamic> payload,
  ) async {
    await _post(path, payload, accessToken: accessToken);
  }

  static Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> payload, {
    String? accessToken,
  }) async {
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (accessToken != null) headers['Authorization'] = 'Bearer $accessToken';
      final response = await http
          .post(
            Uri.parse('$_apiBaseUrl$path'),
            headers: headers,
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (accessToken != null && response.statusCode == 401) {
        SessionManager.expire();
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AuthException(
          body['message'] as String? ?? 'The request could not be completed.',
        );
      }
      return body['data'] as Map<String, dynamic>? ?? const {};
    } on AuthException {
      rethrow;
    } on http.ClientException {
      throw const AuthException('Cannot reach the server. Try again.');
    } on TimeoutException {
      throw const AuthException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const AuthException('The server returned an invalid response.');
    }
  }
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => message;
}
