import 'dart:async';
import 'dart:js' as js;

class RazorpayCheckout {
  Future<Map<String, String>?> open(Map<String, Object?> options) {
    final completer = Completer<Map<String, String>?>();
    options['handler'] = js.allowInterop((dynamic response) {
      if (!completer.isCompleted) {
        completer.complete({
          'razorpay_payment_id': '${response.razorpay_payment_id}',
          'razorpay_order_id': '${response.razorpay_order_id}',
          'razorpay_signature': '${response.razorpay_signature}',
        });
      }
    });
    options['modal'] = {'ondismiss': js.allowInterop(() {
      if (!completer.isCompleted) completer.complete(null);
    })};
    final checkout = js.JsObject(js.context['Razorpay'], [js.JsObject.jsify(options)]);
    checkout.callMethod('on', ['payment.failed', js.allowInterop((dynamic _) {
      if (!completer.isCompleted) completer.complete(null);
    })]);
    checkout.callMethod('open');
    return completer.future;
  }

  void dispose() {}
}
