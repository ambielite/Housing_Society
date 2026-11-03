import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_complaints_api.dart';
import 'new_complaint_screen.dart';

class ResidentComplaintsScreen extends StatefulWidget {
  const ResidentComplaintsScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentComplaintsScreen> createState() =>
      _ResidentComplaintsScreenState();
}

class _ResidentComplaintsScreenState extends State<ResidentComplaintsScreen> {
  late Future<List<ResidentComplaint>> _complaintsFuture;

  @override
  void initState() {
    super.initState();
    _complaintsFuture = _loadComplaints();
  }

  Future<List<ResidentComplaint>> _loadComplaints() =>
      ResidentComplaintsApi.listComplaints(widget.user.accessToken);

  Future<void> _refresh() async {
    final next = _loadComplaints();
    setState(() => _complaintsFuture = next);
    await next;
  }

  Future<void> _newComplaint() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => NewComplaintScreen(user: widget.user),
      ),
    );
    if (created == true && mounted) await _refresh();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFF5F7FB),
        appBar: AppBar(
          backgroundColor: const Color(0xFFF5F7FB),
          title: const Text('Help & Complaints'),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _newComplaint,
          backgroundColor: AppColors.indigo,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add_rounded),
          label: const Text('New complaint'),
        ),
        body: SafeArea(
          child: RefreshIndicator(
            color: AppColors.indigo,
            onRefresh: _refresh,
            child: FutureBuilder<List<ResidentComplaint>>(
              future: _complaintsFuture,
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return _messageState(
                    snapshot.error.toString(),
                    retry: () => setState(() => _complaintsFuture = _loadComplaints()),
                  );
                }
                if (!snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppColors.indigo),
                  );
                }
                final complaints = snapshot.data!;
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                  children: [
                    _header(complaints.length),
                    const SizedBox(height: 20),
                    if (complaints.isEmpty)
                      _emptyState()
                    else
                      ...complaints.map((complaint) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _complaintCard(complaint),
                          )),
                  ],
                );
              },
            ),
          ),
        ),
      );

  Widget _header(int count) => Container(
        padding: const EdgeInsets.all(19),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          gradient: const LinearGradient(
            colors: [Color(0xFF6557E9), Color(0xFF8878F6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x286455E9),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .16),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.support_agent_rounded,
                color: Colors.white,
                size: 27,
              ),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Helpdesk',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$count ${count == 1 ? 'complaint' : 'complaints'} submitted',
                    style: const TextStyle(
                      color: Color(0xFFE7E4FF),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _complaintCard(ResidentComplaint complaint) => Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showDetails(complaint),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFEBEFF5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        complaint.subject,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _statusBadge(complaint.status),
                  ],
                ),
                const SizedBox(height: 9),
                Text(
                  complaint.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF7F8A9D),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 13),
                Row(
                  children: [
                    if (complaint.categoryName != null) ...[
                      Icon(
                        Icons.label_outline_rounded,
                        size: 14,
                        color: AppColors.indigo.withValues(alpha: .8),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          complaint.categoryName!,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.indigo,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Expanded(
                      child: Text(
                        complaint.ticketNumber,
                        textAlign: TextAlign.end,
                        style: const TextStyle(
                          color: Color(0xFF8994A7),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );

  Widget _statusBadge(String status) {
    final color = switch (status.toUpperCase()) {
      'RESOLVED' || 'CLOSED' => const Color(0xFF229B78),
      'IN_PROGRESS' || 'ASSIGNED' => const Color(0xFF4784DB),
      'ON_HOLD' => const Color(0xFFE28A38),
      _ => AppColors.indigo,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Future<void> _showDetails(ResidentComplaint complaint) =>
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    complaint.ticketNumber,
                    style: const TextStyle(
                      color: AppColors.indigo,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    complaint.subject,
                    style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _statusBadge(complaint.status),
                  if (complaint.categoryName != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Category  ·  ${complaint.categoryName}',
                      style: const TextStyle(
                        color: Color(0xFF7F8A9D),
                        fontSize: 12,
                      ),
                    ),
                  ],
                  const SizedBox(height: 18),
                  Text(
                    complaint.description,
                    style: const TextStyle(
                      color: Color(0xFF59657A),
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Close'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

  Widget _emptyState() => Container(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: const Column(
          children: [
            Icon(Icons.inbox_outlined, color: AppColors.muted, size: 42),
            SizedBox(height: 12),
            Text(
              'No complaints yet',
              style: TextStyle(
                color: AppColors.ink,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Submit a complaint and the society team will follow up.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF8994A7), fontSize: 12),
            ),
          ],
        ),
      );

  Widget _messageState(String message, {VoidCallback? retry}) =>
      ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(28),
        children: [
          const SizedBox(height: 100),
          Text(message, textAlign: TextAlign.center),
          if (retry != null) ...[
            const SizedBox(height: 14),
            Center(child: FilledButton(onPressed: retry, child: const Text('Try again'))),
          ],
        ],
      );
}
