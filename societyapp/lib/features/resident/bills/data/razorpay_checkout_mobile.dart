import 'dart:async';
import 'package:razorpay_flutter/razorpay_flutter.dart';

class RazorpayCheckout {
  final Razorpay _razorpay = Razorpay();

  Future<Map<String, String>?> open(Map<String, Object?> options) {
    final completer = Completer<Map<String, String>?>();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse result) {
      if (!completer.isCompleted && result.paymentId != null && result.orderId != null && result.signature != null) {
        completer.complete({
          'razorpay_payment_id': result.paymentId!,
          'razorpay_order_id': result.orderId!,
          'razorpay_signature': result.signature!,
        });
      } else if (!completer.isCompleted) {
        completer.complete(null);
      }
    });
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse _) {
      if (!completer.isCompleted) completer.complete(null);
    });
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse _) {});
    _razorpay.open(options);
    return completer.future;
  }

  void dispose() => _razorpay.clear();
}
