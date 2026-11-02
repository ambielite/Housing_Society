import 'dart:async';
import 'dart:convert';
import 'dart:io';

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:5000/api/v1',
);

class ResidentDashboardData {
  const ResidentDashboardData({
    this.societyName,
    this.societyLogoUrl,
    this.residentPhotoUrl,
    this.currency = 'INR',
    this.unitNumber,
    this.towerName,
    this.maintenance,
    this.notices = const [],
  });

  final String? societyName;
  final String? societyLogoUrl;
  final String? residentPhotoUrl;
  final String currency;
  final String? unitNumber;
  final String? towerName;
  final ResidentMaintenance? maintenance;
  final List<ResidentNotice> notices;

  factory ResidentDashboardData.fromJson(Map<String, dynamic> json) {
    final society = _asMap(json['society']);
    final resident = _asMap(json['resident']);
    final unit = _asMap(json['unit']);
    final maintenance = _asMap(json['maintenance']);
    final noticeRows = json['notices'] as List<dynamic>? ?? const [];
    return ResidentDashboardData(
      societyName: _string(society?['name']),
      societyLogoUrl: _imageUrl(society?['logoUrl']),
      residentPhotoUrl: _imageUrl(resident?['photoUrl']),
      currency: _string(society?['currency']) ?? 'INR',
      unitNumber: _string(unit?['number']),
      towerName: _string(unit?['tower']),
      maintenance: maintenance == null
          ? null
          : ResidentMaintenance.fromJson(maintenance),
      notices: noticeRows
          .whereType<Map<String, dynamic>>()
          .map(ResidentNotice.fromJson)
          .toList(),
    );
  }
}

class ResidentMaintenance {
  const ResidentMaintenance({
    required this.amount,
    required this.dueDate,
    required this.status,
    this.billingPeriod,
    this.invoiceNumber,
    this.description,
  });

  final num amount;
  final DateTime? dueDate;
  final String status;
  final String? billingPeriod;
  final String? invoiceNumber;
  final String? description;

  factory ResidentMaintenance.fromJson(Map<String, dynamic> json) =>
      ResidentMaintenance(
        amount: num.tryParse('${json['outstanding_amount'] ?? 0}') ?? 0,
        dueDate: DateTime.tryParse('${json['due_date'] ?? ''}'),
        status: _string(json['status']) ?? 'ISSUED',
        billingPeriod: _string(json['billing_period']),
        invoiceNumber: _string(json['invoice_number']),
        description: _string(json['description']),
      );
}

class ResidentNotice {
  const ResidentNotice({
    required this.title,
    required this.description,
    required this.status,
    this.postedAt,
  });

  final String title;
  final String description;
  final String status;
  final DateTime? postedAt;

  factory ResidentNotice.fromJson(Map<String, dynamic> json) => ResidentNotice(
        title: _string(json['title']) ?? '',
        description: _string(json['description']) ?? '',
        status: _string(json['status']) ?? 'PUBLISHED',
        postedAt: DateTime.tryParse(
          '${json['posted_at'] ?? json['scheduled_at'] ?? json['created_at'] ?? ''}',
        ),
      );
}

class ResidentDashboardApi {
  ResidentDashboardApi._();

  static Future<ResidentDashboardData> load(String accessToken) async {
    final client = HttpClient()
      ..connectionTimeout = const Duration(seconds: 12);
    try {
      final request = await client
          .getUrl(Uri.parse('$_apiBaseUrl/resident-dashboard'))
          .timeout(const Duration(seconds: 15));
      request.headers
        ..set(HttpHeaders.acceptHeader, ContentType.json.mimeType)
        ..set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');

      final response = await request.close().timeout(
        const Duration(seconds: 20),
      );
      final responseText = await utf8.decoder.bind(response).join();
      final body = responseText.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(responseText) as Map<String, dynamic>;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentDashboardException(
          _string(body['message']) ?? 'Could not load your resident dashboard.',
        );
      }
      final data = _asMap(body['data']);
      if (data == null) {
        throw const ResidentDashboardException(
          'The server returned an unexpected dashboard response.',
        );
      }
      return ResidentDashboardData.fromJson(data);
    } on ResidentDashboardException {
      rethrow;
    } on SocketException {
      throw const ResidentDashboardException(
        'Cannot reach the server. Check the connection and try again.',
      );
    } on TimeoutException {
      throw const ResidentDashboardException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const ResidentDashboardException(
        'The server returned invalid dashboard data.',
      );
    } finally {
      client.close(force: true);
    }
  }
}

class ResidentDashboardException implements Exception {
  const ResidentDashboardException(this.message);
  final String message;

  @override
  String toString() => message;
}

Map<String, dynamic>? _asMap(Object? value) =>
    value is Map<String, dynamic> ? value : null;

String? _string(Object? value) {
  final result = value?.toString().trim();
  return result == null || result.isEmpty || result == 'null' ? null : result;
}

String? _imageUrl(Object? value) {
  final path = _string(value);
  if (path == null) return null;
  final uri = Uri.tryParse(path);
  if (uri == null) return null;
  if (uri.hasScheme) return uri.toString();
  return Uri.parse(_apiBaseUrl).resolve(path).toString();
}
