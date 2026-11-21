import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../widgets/resident_back_button.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_bills_api.dart';
import '../widgets/payment_method_sheet.dart';
import '../widgets/payment_receipt_dialog.dart';

class ResidentFinanceScreen extends StatefulWidget {
  const ResidentFinanceScreen({super.key, required this.user, this.onBack});

  final AuthenticatedUser user;
  final VoidCallback? onBack;

  @override
  State<ResidentFinanceScreen> createState() => _ResidentFinanceScreenState();
}

class _ResidentFinanceScreenState extends State<ResidentFinanceScreen> {
  static const _soft = Color(0xFF5B6479);
  static const _border = Color(0xFFE3E7EF);

  // Bill detail text: a deep shade of the screen's button colour, so it is
  // clearly readable and matches the rest of the page.
  Color get _label => Color.lerp(_tabColor(context), Colors.black, .62)!;

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
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        leading: ResidentBackButton(
          onPressed: widget.onBack ?? () => Navigator.of(context).maybePop(),
        ),
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
          ? Center(
              child: CircularProgressIndicator(color: _tabColor(context)),
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
                Expanded(
                  // Smooth cross-fade between the two lists.
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    switchInCurve: Curves.easeOutCubic,
                    switchOutCurve: Curves.easeIn,
                    layoutBuilder: (current, previous) => Stack(
                      fit: StackFit.expand,
                      children: [...previous, if (current != null) current],
                    ),
                    transitionBuilder: (child, animation) => FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, .02),
                          end: Offset.zero,
                        ).animate(animation),
                        child: child,
                      ),
                    ),
                    child: KeyedSubtree(
                      key: ValueKey<bool>(_showHistory),
                      child: _showHistory ? _historyList() : _duesList(),
                    ),
                  ),
                ),
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
        color: _tabColor(context),
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
            color: selected ? Colors.white : Colors.white.withValues(alpha: .16),
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
                  color: selected ? _soft : Colors.white70,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      );

  // Same tab style as the other resident screens: the selected tab is filled
  // with the button colour, with a smooth fade and a hover tint.
  Widget _sectionSwitcher() => _TabStrip(
    labels: const ['Pay dues', 'Payment history'],
    selected: _showHistory ? 1 : 0,
    color: _tabColor(context),
    onChanged: (index) => setState(() => _showHistory = index == 1),
  );

  Widget _duesList() {
    if (_dues.isEmpty) {
      return _emptyView('You have no outstanding maintenance dues.');
    }
    return RefreshIndicator(
      color: _tabColor(context),
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
        border: Border.all(color: _border),
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
            style: TextStyle(color: _label, fontSize: 11),
          ),
          const SizedBox(height: 13),
          _amountRow('Previous balance', invoice.previousBalance),
          _amountRow('Total amount', invoice.totalAmount),
          _amountRow('Current charges', invoice.subtotal),
          _amountRow('Tax', invoice.taxAmount),
          _amountRow('Penalty', invoice.penaltyAmount),
          _amountRow('Paid amount', invoice.paidAmount),
          const Divider(height: 17, color: _border),
          _amountRow('Outstanding', invoice.outstandingAmount, emphasize: true),
          if (invoice.items.isNotEmpty) ...[
            const SizedBox(height: 9),
            Text(
              'Bill breakdown',
              style: TextStyle(
                color: _label,
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
                        style: TextStyle(color: _label, fontSize: 11),
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
      color: _tabColor(context),
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
                  border: Border.all(color: _border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: _tabColor(context).withValues(alpha: .10),
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: Icon(
                        Icons.receipt_long_outlined,
                        color: _tabColor(context),
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
                              color: _soft,
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            payment.paymentReference,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: _soft,
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
            style: const TextStyle(color: _soft),
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
        style: const TextStyle(color: _soft, fontSize: 13),
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
                  color: emphasize ? AppColors.ink : _label,
                  fontSize: 11,
                  fontWeight: emphasize ? FontWeight.w800 : FontWeight.w500,
                ),
              ),
            ),
            Text(
              _money(amount),
              style: TextStyle(
                color: emphasize ? _tabColor(context) : AppColors.ink,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      );

  // Each status has its own look: solid, tinted, outlined, or neutral.
  Widget _statusChip(String status) {
    final upper = status.toUpperCase();
    final accent = _tabColor(context);
    String label = upper.replaceAll('_', ' ');
    Color foreground = _soft;
    Color background = const Color(0xFFF0F2F6);
    Color? borderColor;
    IconData? icon;

    switch (upper) {
      case 'SUCCESS':
      case 'VERIFIED':
      case 'PAID':
        // Solid green with a check.
        label = 'PAID';
        foreground = Colors.white;
        background = const Color(0xFF229B78);
        icon = Icons.check_rounded;
        break;
      case 'INITIATED':
      case 'PENDING':
        // Blue tint with a border and a sync icon.
        label = 'PROCESSING';
        foreground = const Color(0xFF2F6FCB);
        background = const Color(0xFF4784DB).withValues(alpha: .10);
        borderColor = const Color(0xFF4784DB).withValues(alpha: .45);
        icon = Icons.sync_rounded;
        break;
      case 'VERIFICATION_PENDING':
        // Amber tint with a border and an hourglass.
        label = 'PENDING VERIFICATION';
        foreground = const Color(0xFFB45F0A);
        background = const Color(0xFFE28A38).withValues(alpha: .13);
        borderColor = const Color(0xFFE28A38).withValues(alpha: .55);
        icon = Icons.hourglass_top_rounded;
        break;
      case 'FAILED':
      case 'CANCELLED':
        // Outlined red on white.
        foreground = const Color(0xFFC53D4B);
        background = Colors.white;
        borderColor = const Color(0xFFC53D4B);
        icon = Icons.close_rounded;
        break;
      case 'ISSUED':
        // Button colour tint.
        foreground = accent;
        background = accent.withValues(alpha: .10);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: borderColor == null
            ? null
            : Border.all(color: borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: foreground),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: foreground,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: .3,
            ),
          ),
        ],
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

/// Colour used by the app's buttons, read from the theme so tabs always match.
Color _tabColor(BuildContext context) {
  final theme = Theme.of(context);
  return theme.filledButtonTheme.style?.backgroundColor?.resolve(
        const <WidgetState>{},
      ) ??
      theme.colorScheme.primary;
}

/// Segmented tab strip. The selected tab is filled with [color]; the fill
/// fades in/out smoothly when the selection changes, and unselected tabs get a
/// light tint on hover.
class _TabStrip extends StatefulWidget {
  const _TabStrip({
    required this.labels,
    required this.selected,
    required this.onChanged,
    required this.color,
    this.counts,
    this.scrollable = false,
  });

  final List<String> labels;
  final List<int>? counts;
  final int selected;
  final ValueChanged<int> onChanged;
  final Color color;
  final bool scrollable;

  @override
  State<_TabStrip> createState() => _TabStripState();
}

class _TabStripState extends State<_TabStrip> {
  int? _hover;

  @override
  Widget build(BuildContext context) {
    final row = Row(
      mainAxisSize: widget.scrollable ? MainAxisSize.min : MainAxisSize.max,
      children: [
        for (var i = 0; i < widget.labels.length; i++)
          widget.scrollable ? _tab(i) : Expanded(child: _tab(i)),
      ],
    );
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE9ECF3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: widget.scrollable
          ? SingleChildScrollView(scrollDirection: Axis.horizontal, child: row)
          : row,
    );
  }

  Widget _tab(int i) {
    final selected = i == widget.selected;
    final hovered = _hover == i && !selected;
    final color = widget.color;
    final count = widget.counts?[i];
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = i),
      onExit: (_) {
        if (_hover == i) setState(() => _hover = null);
      },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => widget.onChanged(i),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          alignment: Alignment.center,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? color
                : hovered
                ? color.withValues(alpha: .10)
                : color.withValues(alpha: 0),
            borderRadius: BorderRadius.circular(9),
          ),
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOutCubic,
            style: TextStyle(
              color: selected
                  ? Colors.white
                  : hovered
                  ? color
                  : const Color(0xFF5B6479),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    widget.labels[i],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (count != null) ...[
                  const SizedBox(width: 6),
                  Opacity(
                    opacity: .75,
                    child: Text(
                      '$count',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
