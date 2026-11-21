import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

@JS('Razorpay')
extension type _Razorpay._(JSObject _) implements JSObject {
  external factory _Razorpay(JSAny options);
  external void open();
  external void on(String event, JSFunction callback);
}

class RazorpayCheckout {
  Future<Map<String, String>?> open(Map<String, Object?> options) {
    final completer = Completer<Map<String, String>?>();

    options['handler'] = (JSAny? response) {
      if (completer.isCompleted) return;
      final payment = response! as JSObject;
      completer.complete({
        'razorpay_payment_id':
            (payment['razorpay_payment_id'] as JSString).toDart,
        'razorpay_order_id':
            (payment['razorpay_order_id'] as JSString).toDart,
        'razorpay_signature':
            (payment['razorpay_signature'] as JSString).toDart,
      });
    }.toJS;

    options['modal'] = {
      'ondismiss': (() {
        if (!completer.isCompleted) completer.complete(null);
      }).toJS,
    };

    final checkout = _Razorpay(options.jsify()!);
    checkout.on(
      'payment.failed',
      ((JSAny? _) {
        if (!completer.isCompleted) completer.complete(null);
      }).toJS,
    );
    checkout.open();
    return completer.future;
  }

  void dispose() {}
}
