import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:housing_society_app/app/session_manager.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    // The Android emulator-only address (10.0.2.2) does not work on a real
    // phone. The physical-device debug setup uses `adb reverse`, so localhost
    // reaches the backend on the development computer just like it does on web.
    : 'http://localhost:5000/api/v1';

class ResidentDuesSummary {
  const ResidentDuesSummary({
    required this.totalOutstanding,
    required this.pendingDuesCount,
    this.nextDueDate,
    this.currency = 'INR',
    this.societyName,
    this.societyAddress,
    this.unitNumber,
    this.towerName,
  });

  final num totalOutstanding;
  final int pendingDuesCount;
  final DateTime? nextDueDate;
  final String currency;
  final String? societyName;
  final String? societyAddress;
  final String? unitNumber;
  final String? towerName;

  String get unitLabel {
    final parts = [
      if (towerName != null && towerName!.isNotEmpty) towerName!,
      if (unitNumber != null && unitNumber!.isNotEmpty) 'Flat $unitNumber',
    ];
    return parts.isEmpty ? 'Unit' : parts.join(' · ');
  }

  factory ResidentDuesSummary.fromJson(Map<String, dynamic> json) {
    final society = _asMap(json['society']);
    final unit = _asMap(json['unit']);
    return ResidentDuesSummary(
      totalOutstanding: num.tryParse('${json['totalOutstanding'] ?? 0}') ?? 0,
      pendingDuesCount: int.tryParse('${json['pendingDuesCount'] ?? 0}') ?? 0,
      nextDueDate: _parseCalendarDate(json['nextDueDate']),
      currency: _string(json['currency']) ?? 'INR',
      societyName: _string(society?['name']),
      societyAddress: _string(society?['address']),
      unitNumber: _string(unit?['number']),
      towerName: _string(unit?['tower']),
    );
  }
}

class ResidentInvoiceItem {
  const ResidentInvoiceItem({
    required this.id,
    required this.description,
    required this.amount,
    required this.quantity,
    required this.rate,
    required this.taxAmount,
    required this.totalAmount,
    required this.chargeCategory,
  });

  final String id;
  final String description;
  final num amount;
  final num quantity;
  final num rate;
  final num taxAmount;
  final num totalAmount;
  final String chargeCategory;

  factory ResidentInvoiceItem.fromJson(Map<String, dynamic> json) =>
      ResidentInvoiceItem(
        id: '${json['id'] ?? ''}',
        description: '${json['description'] ?? 'Charge Item'}',
        amount: num.tryParse('${json['amount'] ?? 0}') ?? 0,
        quantity: num.tryParse('${json['quantity'] ?? 1}') ?? 1,
        rate: num.tryParse('${json['rate'] ?? 0}') ?? 0,
        taxAmount: num.tryParse('${json['taxAmount'] ?? 0}') ?? 0,
        totalAmount: num.tryParse('${json['totalAmount'] ?? 0}') ?? 0,
        chargeCategory: '${json['chargeCategory'] ?? 'MAINTENANCE'}',
      );
}

class ResidentInvoice {
  const ResidentInvoice({
    required this.id,
    required this.invoiceNumber,
    required this.billingPeriod,
    required this.totalAmount,
    required this.paidAmount,
    required this.outstandingAmount,
    required this.status,
    this.invoiceDate,
    this.dueDate,
    this.previousBalance = 0,
    this.subtotal = 0,
    this.taxAmount = 0,
    this.penaltyAmount = 0,
    this.description,
    this.hasDocument = false,
    this.items = const [],
    this.currency = 'INR',
  });

  final String id;
  final String invoiceNumber;
  final String billingPeriod;
  final num totalAmount;
  final num paidAmount;
  final num outstandingAmount;
  final String status;
  final DateTime? invoiceDate;
  final DateTime? dueDate;
  final num previousBalance;
  final num subtotal;
  final num taxAmount;
  final num penaltyAmount;
  final String? description;
  final bool hasDocument;
  final List<ResidentInvoiceItem> items;
  final String currency;

  bool get isOverdue =>
      status.toUpperCase() == 'OVERDUE' ||
      (dueDate != null &&
          dueDate!.isBefore(DateTime.now()) &&
          outstandingAmount > 0);

  factory ResidentInvoice.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? const [];
    return ResidentInvoice(
      id: '${json['id'] ?? ''}',
      invoiceNumber: '${json['invoiceNumber'] ?? 'INV'}',
      billingPeriod: '${json['billingPeriod'] ?? ''}',
      invoiceDate: _parseCalendarDate(json['invoiceDate']),
      dueDate: _parseCalendarDate(json['dueDate']),
      previousBalance: num.tryParse('${json['previousBalance'] ?? 0}') ?? 0,
      subtotal: num.tryParse('${json['subtotal'] ?? 0}') ?? 0,
      taxAmount: num.tryParse('${json['taxAmount'] ?? 0}') ?? 0,
      penaltyAmount: num.tryParse('${json['penaltyAmount'] ?? 0}') ?? 0,
      totalAmount: num.tryParse('${json['totalAmount'] ?? 0}') ?? 0,
      paidAmount: num.tryParse('${json['paidAmount'] ?? 0}') ?? 0,
      outstandingAmount: num.tryParse('${json['outstandingAmount'] ?? 0}') ?? 0,
      status: '${json['status'] ?? 'ISSUED'}',
      description: _string(json['description']),
      hasDocument: json['hasDocument'] == true,
      currency: _string(json['currency']) ?? 'INR',
      items: rawItems
          .whereType<Map<String, dynamic>>()
          .map(ResidentInvoiceItem.fromJson)
          .toList(),
    );
  }
}

class ResidentPaymentRecord {
  const ResidentPaymentRecord({
    required this.id,
    required this.paymentReference,
    required this.paymentMethod,
    required this.paymentChannel,
    required this.amount,
    required this.status,
    this.receiptNumber,
    this.paymentDate,
    this.gatewayName,
    this.gatewayOrderId,
    this.gatewayTransactionId,
    this.verificationRemarks,
    this.verifiedAt,
    this.remarks,
    this.invoiceId,
    this.invoiceNumber,
    this.billingPeriod,
    this.invoiceDescription,
    this.selectedMethod,
    this.createdAt,
  });

  final String id;
  final String paymentReference;
  final String paymentMethod;
  final String paymentChannel;
  final num amount;
  final String status;
  final String? receiptNumber;
  final DateTime? paymentDate;
  final String? gatewayName;
  final String? gatewayOrderId;
  final String? gatewayTransactionId;
  final String? verificationRemarks;
  final DateTime? verifiedAt;
  final String? remarks;
  final String? invoiceId;
  final String? invoiceNumber;
  final String? billingPeriod;
  final String? invoiceDescription;
  final String? selectedMethod;
  final DateTime? createdAt;

  bool get isSuccess =>
      status.toUpperCase() == 'SUCCESS' || status.toUpperCase() == 'VERIFIED';
  bool get isPending =>
      status.toUpperCase() == 'VERIFICATION_PENDING' ||
      status.toUpperCase() == 'PENDING' ||
      status.toUpperCase() == 'INITIATED';
  bool get isFailed =>
      status.toUpperCase() == 'FAILED' || status.toUpperCase() == 'CANCELLED';

  String get displayMethod {
    final method = selectedMethod ?? paymentMethod;
    return switch (method.toUpperCase()) {
      'GOOGLE_PAY' || 'GPAY' => 'Google Pay',
      'PHONEPE' => 'PhonePe',
      'UPI' => 'UPI',
      'RUPAY_CARD' || 'CARD' => 'RuPay / Card',
      'CASH' => 'Cash (Office)',
      'CHEQUE' => 'Cheque',
      'NEFT' || 'RTGS' || 'BANK_TRANSFER' => 'Bank Transfer',
      _ => method.replaceAll('_', ' '),
    };
  }

  factory ResidentPaymentRecord.fromJson(Map<String, dynamic> json) =>
      ResidentPaymentRecord(
        id: '${json['id'] ?? ''}',
        paymentReference: '${json['paymentReference'] ?? ''}',
        receiptNumber: _string(json['receiptNumber']),
        paymentMethod: '${json['paymentMethod'] ?? 'ONLINE'}',
        paymentChannel: '${json['paymentChannel'] ?? 'GATEWAY'}',
        amount: num.tryParse('${json['amount'] ?? 0}') ?? 0,
        status: '${json['status'] ?? 'INITIATED'}',
        paymentDate: DateTime.tryParse('${json['paymentDate'] ?? ''}') ??
            _parseCalendarDate(json['paymentDate']),
        gatewayName: _string(json['gatewayName']),
        gatewayOrderId: _string(json['gatewayOrderId']),
        gatewayTransactionId: _string(json['gatewayTransactionId']),
        verificationRemarks: _string(json['verificationRemarks']),
        verifiedAt: DateTime.tryParse('${json['verifiedAt'] ?? ''}'),
        remarks: _string(json['remarks']),
        invoiceId: _string(json['invoiceId']),
        invoiceNumber: _string(json['invoiceNumber']),
        billingPeriod: _string(json['billingPeriod']),
        invoiceDescription: _string(json['invoiceDescription']),
        selectedMethod: _string(
          _asMap(json['metadata'])?['selectedMethod'] ?? json['selectedMethod'],
        ),
        createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}'),
      );
}

class ResidentPaymentResult {
  const ResidentPaymentResult({
    required this.status,
    required this.paymentId,
    required this.paymentReference,
    required this.amount,
    required this.message,
    this.receiptNumber,
    this.gatewayOrderId,
    this.checkoutKeyId,
    this.checkoutAmount,
    this.checkoutCurrency,
  });

  final String status;
  final String paymentId;
  final String paymentReference;
  final num amount;
  final String message;
  final String? receiptNumber;
  final String? gatewayOrderId;
  final String? checkoutKeyId;
  final int? checkoutAmount;
  final String? checkoutCurrency;

  factory ResidentPaymentResult.fromJson(Map<String, dynamic> json) {
    final payment = _asMap(json['payment']) ?? json;
    return ResidentPaymentResult(
      status: '${json['status'] ?? payment['status'] ?? 'INITIATED'}',
      paymentId: '${payment['id'] ?? ''}',
      paymentReference:
          '${payment['paymentReference'] ?? payment['payment_reference'] ?? ''}',
      amount: num.tryParse('${payment['amount'] ?? 0}') ?? 0,
      message: '${json['message'] ?? 'Payment processed'}',
      receiptNumber: _string(
        payment['receiptNumber'] ?? payment['receipt_number'],
      ),
      gatewayOrderId: _string(
        payment['gatewayOrderId'] ?? payment['gateway_order_id'],
      ),
      checkoutKeyId: _string(_asMap(payment['checkout'])?['keyId']),
      checkoutAmount: int.tryParse('${_asMap(payment['checkout'])?['amount'] ?? ''}'),
      checkoutCurrency: _string(_asMap(payment['checkout'])?['currency']),
    );
  }
}

class ResidentBillsApi {
  ResidentBillsApi._();

  static Future<ResidentDuesSummary> getSummary(String token) async {
    final dues = await getOutstandingDues(token);
    final dates =
        dues.map((invoice) => invoice.dueDate).whereType<DateTime>().toList()
          ..sort();
    return ResidentDuesSummary(
      totalOutstanding: dues.fold<num>(
        0,
        (total, invoice) => total + invoice.outstandingAmount,
      ),
      pendingDuesCount: dues.length,
      nextDueDate: dates.isEmpty ? null : dates.first,
    );
  }

  static Future<List<ResidentInvoice>> getOutstandingDues(String token) async {
    final data = await _get(token, '/resident/finance/dues');
    if (data is List<dynamic>) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(ResidentInvoice.fromJson)
          .toList();
    }
    throw const ResidentBillsException('Invalid outstanding dues response.');
  }

  static Future<List<ResidentPaymentRecord>> getPaymentHistory(
    String token,
  ) async {
    final data = await _get(token, '/resident/finance/payments');
    if (data is List<dynamic>) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(ResidentPaymentRecord.fromJson)
          .toList();
    }
    throw const ResidentBillsException('Invalid payment history response.');
  }

  static Future<ResidentPaymentResult> initiatePayment({
    required String token,
    required String invoiceId,
    required String paymentMethod,
  }) async {
    final payload = {
      'invoiceId': invoiceId,
      'method': paymentMethod,
      'idempotencyKey':
          'resident-$invoiceId-${DateTime.now().microsecondsSinceEpoch}',
    };
    final data = await _post(token, '/resident/finance/payments', payload);
    if (data is Map<String, dynamic>) {
      return ResidentPaymentResult.fromJson(data);
    }
    throw const ResidentBillsException('Failed to initiate payment.');
  }

  static Future<ResidentPaymentRecord> verifyRazorpayPayment({
    required String token,
    required String paymentId,
    required String razorpayPaymentId,
    required String razorpayOrderId,
    required String razorpaySignature,
  }) async {
    final data = await _post(token, '/resident/finance/payments/$paymentId/verify-razorpay', {
      'razorpay_payment_id': razorpayPaymentId,
      'razorpay_order_id': razorpayOrderId,
      'razorpay_signature': razorpaySignature,
    });
    if (data is Map<String, dynamic>) {
      return ResidentPaymentRecord.fromJson(data['payment'] as Map<String, dynamic>? ?? data);
    }
    throw const ResidentBillsException('Failed to verify Razorpay payment.');
  }

  static Future<dynamic> _get(String token, String path) =>
      _request(token, path, method: 'GET');

  static Future<dynamic> _post(
    String token,
    String path,
    Map<String, dynamic> payload,
  ) => _request(token, path, method: 'POST', payload: payload);

  static Future<dynamic> _request(
    String token,
    String path, {
    String method = 'GET',
    Map<String, dynamic>? payload,
  }) async {
    final client = http.Client();
    try {
      final uri = Uri.parse('$_apiBaseUrl$path');
      final headers = <String, String>{
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        if (payload != null) 'Content-Type': 'application/json',
      };
      final response =
          await (method == 'GET'
                  ? client.get(uri, headers: headers)
                  : client.post(
                      uri,
                      headers: headers,
                      body: jsonEncode(payload),
                    ))
              .timeout(const Duration(seconds: 25));

      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 401) {
        SessionManager.expire();
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ResidentBillsException(
          _string(body['message']) ??
              'Request failed (${response.statusCode}).',
        );
      }

      return body['data'];
    } on ResidentBillsException {
      rethrow;
    } on http.ClientException {
      throw const ResidentBillsException(
        'Cannot reach the server. Make sure the backend is running.',
      );
    } on TimeoutException {
      throw const ResidentBillsException('Server took too long to respond.');
    } on FormatException {
      throw const ResidentBillsException(
        'Invalid response received from server.',
      );
    } finally {
      client.close();
    }
  }
}

class ResidentBillsException implements Exception {
  const ResidentBillsException(this.message);
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

DateTime? _parseCalendarDate(Object? value) {
  final raw = value?.toString();
  if (raw == null || raw.length < 10) return null;
  final pieces = raw.substring(0, 10).split('-');
  if (pieces.length != 3) return null;
  final year = int.tryParse(pieces[0]);
  final month = int.tryParse(pieces[1]);
  final day = int.tryParse(pieces[2]);
  if (year == null || month == null || day == null) return null;
  return DateTime(year, month, day);
}
