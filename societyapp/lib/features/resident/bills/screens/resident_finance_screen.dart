import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_bills_api.dart';
import '../widgets/payment_method_sheet.dart';
import '../widgets/payment_receipt_dialog.dart';

class ResidentFinanceScreen extends StatefulWidget {
  const ResidentFinanceScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentFinanceScreen> createState() => _ResidentFinanceScreenState();
}

class _ResidentFinanceScreenState extends State<ResidentFinanceScreen> {
  List<ResidentInvoice> _dues = const [];
  List<ResidentPaymentRecord> _payments = const [];
  bool _loading = true;
  String? _error;
  bool _showHistory = false;

  double get _totalOutstanding => _dues.fold<double>(
    0,
    (total, invoice) => total + invoice.outstandingAmount.toDouble(),
  );

  ResidentInvoice? get _nextDueInvoice {
    final invoices = _dues.where((invoice) => invoice.dueDate != null).toList()
      ..sort((a, b) => a.dueDate!.compareTo(b.dueDate!));
    return invoices.isEmpty ? null : invoices.first;
  }

  DateTime? get _nextDueDate => _nextDueInvoice?.dueDate;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ResidentBillsApi.getOutstandingDues(widget.user.accessToken),
        ResidentBillsApi.getPaymentHistory(widget.user.accessToken),
      ]);
      if (!mounted) return;
      setState(() {
        _dues = results[0] as List<ResidentInvoice>;
        _payments = results[1] as List<ResidentPaymentRecord>;
        _loading = false;
      });
    } on ResidentBillsException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7FB),
        title: const Text('Finance'),
        actions: [
          IconButton(
            onPressed: _loading ? null : _load,
            tooltip: 'Refresh payments',
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.indigo),
            )
          : _error != null
          ? _errorView()
          : Column(
              children: [
                _summaryCard(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 10, 18, 8),
                  child: _sectionSwitcher(),
                ),
                Expanded(child: _showHistory ? _historyList() : _duesList()),
              ],
            ),
    );
  }

  Widget _summaryCard() {
    final nextDue = _nextDueDate;
    final nextDueLabel = nextDue == null
        ? '—'
        : '${nextDue.day} ${_monthName(nextDue.month)}';
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 2, 16, 6),
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1B46),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Dues and receipts',
            style: TextStyle(
              color: Colors.white,
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _summaryTile(
                'Due now',
                _money(_totalOutstanding),
                selected: !_showHistory,
              ),
              const SizedBox(width: 8),
              _summaryTile('Pending dues', '${_dues.length}'),
              const SizedBox(width: 8),
              _summaryTile('Next due', nextDueLabel),
            ],
          ),
          if (_dues.isNotEmpty) ...[
            const SizedBox(height: 11),
            SizedBox(
              height: 44,
              child: FilledButton(
                onPressed: () => _startPayment(_nextDueInvoice ?? _dues.first),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.ink,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(13),
                  ),
                ),
                child: Text(
                  'Pay next bill · ${_money((_nextDueInvoice ?? _dues.first).outstandingAmount)}',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _summaryTile(String label, String value, {bool selected = false}) =>
      Expanded(
        child: Container(
          constraints: const BoxConstraints(minHeight: 60),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 9),
          decoration: BoxDecoration(
            color: selected ? Colors.white : const Color(0xFF34326F),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: selected ? AppColors.ink : Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: selected ? AppColors.inkSoft : Colors.white70,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      );

  Widget _sectionSwitcher() => Container(
    padding: const EdgeInsets.all(4),
    decoration: BoxDecoration(
      color: const Color(0xFFEAE8F7),
      borderRadius: BorderRadius.circular(14),
    ),
    child: Row(
      children: [
        _switchItem(
          'Pay dues',
          selected: !_showHistory,
          onTap: () => setState(() => _showHistory = false),
        ),
        _switchItem(
          'Payment history',
          selected: _showHistory,
          onTap: () => setState(() => _showHistory = true),
        ),
      ],
    ),
  );

  Widget _switchItem(
    String label, {
    required bool selected,
    required VoidCallback onTap,
  }) => Expanded(
    child: Material(
      color: selected ? Colors.white : Colors.transparent,
      borderRadius: BorderRadius.circular(11),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(11),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 5),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? AppColors.ink : const Color(0xFF70798B),
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    ),
  );

  Widget _duesList() {
    if (_dues.isEmpty) {
      return _emptyView('You have no outstanding maintenance dues.');
    }
    return RefreshIndicator(
      color: AppColors.indigo,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
        itemCount: _dues.length,
        separatorBuilder: (_, _) => const SizedBox(height: 11),
        itemBuilder: (context, index) => _invoiceCard(_dues[index]),
      ),
    );
  }

  Widget _invoiceCard(ResidentInvoice invoice) {
    final dueDate = invoice.dueDate == null
        ? 'Date unavailable'
        : _formatDate(invoice.dueDate!);
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEBEFF5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  invoice.invoiceNumber,
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              _statusChip(invoice.status),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            '${invoice.billingPeriod} · Due $dueDate',
            style: const TextStyle(color: Color(0xFF8994A7), fontSize: 11),
          ),
          const SizedBox(height: 13),
          _amountRow('Previous balance', invoice.previousBalance),
          _amountRow('Total amount', invoice.totalAmount),
          _amountRow('Current charges', invoice.subtotal),
          _amountRow('Tax', invoice.taxAmount),
          _amountRow('Penalty', invoice.penaltyAmount),
          _amountRow('Paid amount', invoice.paidAmount),
          const Divider(height: 17),
          _amountRow('Outstanding', invoice.outstandingAmount, emphasize: true),
          if (invoice.items.isNotEmpty) ...[
            const SizedBox(height: 9),
            const Text(
              'Bill breakdown',
              style: TextStyle(
                color: AppColors.inkSoft,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            ...invoice.items.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.description,
                        style: const TextStyle(
                          color: Color(0xFF68748A),
                          fontSize: 11,
                        ),
                      ),
                    ),
                    Text(
                      _money(item.totalAmount),
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            height: 44,
            child: FilledButton(
              onPressed: invoice.outstandingAmount > 0
                  ? () => _startPayment(invoice)
                  : null,
              child: Text('Pay ${_money(invoice.outstandingAmount)}'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _historyList() {
    if (_payments.isEmpty) return _emptyView('No payment transactions yet.');
    return RefreshIndicator(
      color: AppColors.indigo,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
        itemCount: _payments.length,
        separatorBuilder: (_, _) => const SizedBox(height: 9),
        itemBuilder: (context, index) {
          final payment = _payments[index];
          final date = payment.paymentDate == null
              ? 'Date unavailable'
              : _formatDate(payment.paymentDate!);
          return Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(17),
            child: InkWell(
              borderRadius: BorderRadius.circular(17),
              onTap: payment.isSuccess
                  ? () => PaymentReceiptDialog.show(context, payment: payment)
                  : null,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(17),
                  border: Border.all(color: const Color(0xFFEBEFF5)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFECE9FF),
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(
                        Icons.receipt_long_outlined,
                        color: AppColors.indigo,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            payment.billingPeriod ??
                                payment.invoiceNumber ??
                                'Maintenance payment',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.ink,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '$date · ${payment.displayMethod}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF8994A7),
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            payment.paymentReference,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF7B86A0),
                              fontSize: 9,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _money(payment.amount),
                          style: const TextStyle(
                            color: AppColors.ink,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 5),
                        _statusChip(payment.status),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _startPayment(ResidentInvoice invoice) async {
    await PaymentMethodSheet.show(
      context,
      user: widget.user,
      invoice: invoice,
      onPaymentCompleted: () => unawaited(_load()),
    );
  }

  Widget _errorView() => Center(
    child: Padding(
      padding: const EdgeInsets.all(26),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_rounded, color: AppColors.muted, size: 38),
          const SizedBox(height: 12),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.inkSoft),
          ),
          const SizedBox(height: 13),
          FilledButton(onPressed: _load, child: const Text('Try again')),
        ],
      ),
    ),
  );

  Widget _emptyView(String message) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(color: Color(0xFF8994A7), fontSize: 13),
      ),
    ),
  );

  Widget _amountRow(String label, num amount, {bool emphasize = false}) =>
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: emphasize ? AppColors.ink : const Color(0xFF7F8A9D),
                  fontSize: 11,
                  fontWeight: emphasize ? FontWeight.w800 : FontWeight.w500,
                ),
              ),
            ),
            Text(
              _money(amount),
              style: TextStyle(
                color: emphasize ? AppColors.indigo : AppColors.ink,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      );

  Widget _statusChip(String status) {
    final upper = status.toUpperCase();
    final (label, foreground, background) = switch (upper) {
      'SUCCESS' ||
      'VERIFIED' ||
      'PAID' => ('PAID', const Color(0xFF229B78), const Color(0xFFE4F7F1)),
      'INITIATED' || 'PENDING' => (
        'PROCESSING',
        const Color(0xFF4784DB),
        const Color(0xFFE8F1FF),
      ),
      'VERIFICATION_PENDING' => (
        'PENDING VERIFICATION',
        const Color(0xFFD1802E),
        const Color(0xFFFFF4E7),
      ),
      'FAILED' ||
      'CANCELLED' => (upper, const Color(0xFFC53D4B), const Color(0xFFFFF0F0)),
      _ => (
        upper.replaceAll('_', ' '),
        const Color(0xFF7F8A9D),
        const Color(0xFFF0F2F6),
      ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foreground,
          fontSize: 8,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  String _money(num value) =>
      '${_currencySymbol()} ${value.toStringAsFixed(2).replaceFirst(RegExp(r'\.00$'), '')}';
  String _currencySymbol() => String.fromCharCode(0x20B9);

  String _formatDate(DateTime value) =>
      '${value.day} ${_monthName(value.month)} ${value.year}';

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
