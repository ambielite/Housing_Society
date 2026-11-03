import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _apiBaseUrl {
  if (_configuredApiBaseUrl.isNotEmpty) return _configuredApiBaseUrl;
  return kIsWeb
      ? 'http://localhost:5000/api/v1'
      : 'http://10.0.2.2:5000/api/v1';
}

class AuthenticatedUser {
  const AuthenticatedUser({
    required this.name,
    required this.email,
    required this.accessToken,
    required this.roles,
    required this.permissions,
    this.employeeCode,
  });

  final String name;
  final String email;
  final String accessToken;
  final List<String> roles;
  final List<String> permissions;
  final String? employeeCode;
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
              if (securityCode != null) 'securityCode': securityCode,
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
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => message;
}
