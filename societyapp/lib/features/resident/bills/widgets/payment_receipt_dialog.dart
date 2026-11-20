import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../data/resident_bills_api.dart';

class PaymentReceiptDialog extends StatelessWidget {
  const PaymentReceiptDialog({
    super.key,
    required this.payment,
    this.societyName,
  });

  final ResidentPaymentRecord payment;
  final String? societyName;

  static Future<void> show(
    BuildContext context, {
    required ResidentPaymentRecord payment,
    String? societyName,
  }) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) =>
        PaymentReceiptDialog(payment: payment, societyName: societyName),
  );

  @override
  Widget build(BuildContext context) {
    final currency = String.fromCharCode(0x20B9);
    final amountFormatted =
        '$currency ${payment.amount.toStringAsFixed(2).replaceFirst(RegExp(r'\.00$'), '')}';
    final dateLabel = payment.paymentDate != null
        ? '${payment.paymentDate!.day} ${_monthName(payment.paymentDate!.month)} ${payment.paymentDate!.year}'
        : 'Date unavailable';

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      padding: EdgeInsets.fromLTRB(
        22,
        14,
        22,
        28 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD9DEEA),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: payment.isSuccess
                          ? const Color(0xFFE4F7F1)
                          : payment.isPending
                          ? const Color(0xFFFFF4E7)
                          : const Color(0xFFFFF0F0),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      payment.isSuccess
                          ? Icons.check_circle_rounded
                          : payment.isPending
                          ? Icons.schedule_rounded
                          : Icons.cancel_rounded,
                      color: payment.isSuccess
                          ? const Color(0xFF229B78)
                          : payment.isPending
                          ? const Color(0xFFE28A38)
                          : const Color(0xFFC53D4B),
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          societyName ?? 'Housing Society',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.muted,
                            letterSpacing: .5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          payment.isSuccess
                              ? 'Payment Receipt'
                              : 'Transaction Details',
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _statusBadge(payment.status),
                ],
              ),
              const SizedBox(height: 22),
              Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 18,
                  horizontal: 16,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF7F8FC),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFEBEFF5)),
                ),
                child: Column(
                  children: [
                    Text(
                      payment.isSuccess
                          ? 'TOTAL PAID AMOUNT'
                          : 'PAYMENT AMOUNT',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1,
                        color: AppColors.muted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      amountFormatted,
                      style: const TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                        letterSpacing: -0.5,
                      ),
                    ),
                    if (payment.receiptNumber != null) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAE8FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Receipt #: ${payment.receiptNumber}',
                          style: const TextStyle(
                            color: AppColors.indigo,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'TRANSACTION DETAILS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                  color: AppColors.muted,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFEBEFF5)),
                ),
                child: Column(
                  children: [
                    _row('Payment Reference', payment.paymentReference),
                    const Divider(height: 18, color: Color(0xFFF0F3F8)),
                    _row(
                      'Maintenance Bill',
                      payment.billingPeriod ??
                          payment.invoiceNumber ??
                          'Maintenance',
                    ),
                    if (payment.invoiceNumber != null) ...[
                      const Divider(height: 18, color: Color(0xFFF0F3F8)),
                      _row('Invoice Number', payment.invoiceNumber!),
                    ],
                    const Divider(height: 18, color: Color(0xFFF0F3F8)),
                    _row('Payment Method', payment.displayMethod),
                    const Divider(height: 18, color: Color(0xFFF0F3F8)),
                    _row('Payment Date', dateLabel),
                    if (payment.gatewayTransactionId != null) ...[
                      const Divider(height: 18, color: Color(0xFFF0F3F8)),
                      _row('Transaction ID', payment.gatewayTransactionId!),
                    ],
                    if (payment.verificationRemarks != null &&
                        payment.verificationRemarks!.isNotEmpty) ...[
                      const Divider(height: 18, color: Color(0xFFF0F3F8)),
                      _row('Verification', payment.verificationRemarks!),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.indigo,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                  child: const Text(
                    'Close Receipt',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Expanded(
        flex: 4,
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF7F8A9D),
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      const SizedBox(width: 8),
      Expanded(
        flex: 5,
        child: Text(
          value,
          textAlign: TextAlign.end,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.ink,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    ],
  );

  Widget _statusBadge(String status) {
    final upper = status.toUpperCase();
    final (label, color, bg) = switch (upper) {
      'SUCCESS' ||
      'VERIFIED' ||
      'PAID' => ('PAID', const Color(0xFF229B78), const Color(0xFFE4F7F1)),
      'VERIFICATION_PENDING' || 'PENDING' => (
        'PENDING',
        const Color(0xFFD1802E),
        const Color(0xFFFFF4E7),
      ),
      'INITIATED' => (
        'PROCESSING',
        const Color(0xFF4784DB),
        const Color(0xFFE8F1FF),
      ),
      _ => (
        upper.replaceAll('_', ' '),
        const Color(0xFFC53D4B),
        const Color(0xFFFFF0F0),
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: .5,
        ),
      ),
    );
  }

  String _monthName(int month) => const [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][month - 1];
}
