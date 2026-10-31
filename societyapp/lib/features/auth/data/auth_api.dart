import 'dart:async';
import 'dart:convert';
import 'dart:io';

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:5000/api/v1',
);

class AuthenticatedUser {
  const AuthenticatedUser({
    required this.name,
    required this.email,
    required this.accessToken,
  });

  final String name;
  final String email;
  final String accessToken;
}

class AuthApi {
  AuthApi._();

  static Future<AuthenticatedUser> login({
    required String email,
    required String password,
  }) async {
    final client = HttpClient()
      ..connectionTimeout = const Duration(seconds: 12);
    try {
      final request = await client
          .postUrl(Uri.parse('$_apiBaseUrl/auth/login'))
          .timeout(const Duration(seconds: 15));
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({'email': email, 'password': password}));

      final response = await request.close().timeout(
        const Duration(seconds: 20),
      );
      final responseText = await utf8.decoder.bind(response).join();
      final body = responseText.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(responseText) as Map<String, dynamic>;

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
      );
    } on AuthException {
      rethrow;
    } on SocketException {
      throw const AuthException(
        'Cannot reach the server. Make sure the backend is running and the API address is correct.',
      );
    } on TimeoutException {
      throw const AuthException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const AuthException('The server returned an invalid response.');
    } finally {
      client.close(force: true);
    }
  }
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => message;
}
