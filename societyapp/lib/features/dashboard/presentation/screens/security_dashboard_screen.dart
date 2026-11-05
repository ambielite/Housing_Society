import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:housing_society_app/app/session_manager.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../../../resident/dashboard/screens/resident_home_screen.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    : kIsWeb
    ? 'http://localhost:5000/api/v1'
    : 'http://10.0.2.2:5000/api/v1';

/// Routes residents to their existing home and opens the security dashboard
/// for the security login flow.
class SecurityDashboardScreen extends StatelessWidget {
  const SecurityDashboardScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  Widget build(BuildContext context) {
    const residentRoles = {
      'RESIDENT_APP',
      'RESIDENT',
      'OWNER',
      'PRIMARY_OWNER',
      'CO_OWNER',
      'TENANT',
      'FAMILY_MEMBER',
    };
    final isResidentAccount =
        user.employeeCode == null &&
        (user.roles.isEmpty ||
            user.roles.any(
              (role) => residentRoles.contains(role.trim().toUpperCase()),
            ));

    if (isResidentAccount) return ResidentHomeScreen(user: user);
    final isSecurityAccount =
        user.employeeCode?.trim().isNotEmpty == true &&
        user.roles.any((role) => role.trim().toUpperCase() == 'SECURITY_HEAD');
    if (isSecurityAccount) return _SecurityHome(user: user);
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.badge_outlined,
                color: AppColors.indigo,
                size: 42,
              ),
              const SizedBox(height: 12),
              const Text(
                'Security login required',
                style: TextStyle(
                  color: AppColors.ink,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Sign in using the security option and your employee code.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.muted),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
                  (_) => false,
                ),
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('Back to sign in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SecurityHome extends StatefulWidget {
  const _SecurityHome({required this.user});

  final AuthenticatedUser user;

  @override
  State<_SecurityHome> createState() => _SecurityHomeState();
}

class _SecurityHomeState extends State<_SecurityHome> {
  int _tab = 0;
  String _visitorFilter = 'ALL';
  late Future<_GuardSnapshot> _snapshot;

  @override
  void initState() {
    super.initState();
    _snapshot = _GuardApi.load(widget.user);
  }

  Future<void> _refresh() async {
    final request = _GuardApi.load(widget.user);
    setState(() => _snapshot = request);
    await request;
  }

  Future<void> _changePass(_GuardPass pass, String action) async {
    try {
      if (action == 'ARRIVAL') {
        await _GuardApi.patch(
          '/visitors/passes/${pass.id}/arrival',
          const {},
          widget.user.accessToken,
        );
      } else if (action == 'ENTRY') {
        await _GuardApi.patch('/visitors/passes/${pass.id}/entry', {
          'capturedBy': widget.user.userId,
        }, widget.user.accessToken);
      } else {
        await _GuardApi.patch('/visitors/passes/${pass.id}/exit', {
          'capturedBy': widget.user.userId,
        }, widget.user.accessToken);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            action == 'ARRIVAL'
                ? 'Visitor arrival recorded.'
                : action == 'ENTRY'
                ? 'Visitor entry recorded.'
                : 'Visitor exit recorded.',
          ),
        ),
      );
      await _refresh();
    } on _GuardApiException catch (error) {
      if (mounted) _showError(error.message);
    }
  }

  Future<void> _registerWalkIn(_GuardSnapshot data) async {
    if (data.gates.isEmpty) {
      _showError('There is no active gate configured for this society.');
      return;
    }
    final name = TextEditingController();
    final phone = TextEditingController();
    final deliveryCompany = TextEditingController();
    final formKey = GlobalKey<FormState>();
    String? visitorType;
    String? gateId;
    bool saving = false;
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: _surface(
            context,
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
            child: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCE2EE),
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text('Register a visitor', style: _titleStyle(20)),
                  const SizedBox(height: 6),
                  const Text(
                    'Create a walk-in record for the selected gate.',
                    style: TextStyle(color: AppColors.muted),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: name,
                    textCapitalization: TextCapitalization.words,
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter the visitor name.'
                        : null,
                    decoration: _fieldDecoration(
                      'Visitor name',
                      Icons.person_outline_rounded,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: phone,
                    keyboardType: TextInputType.phone,
                    decoration: _fieldDecoration(
                      'Phone (optional)',
                      Icons.phone_outlined,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: visitorType,
                    decoration: _fieldDecoration(
                      'Visitor type',
                      Icons.category_outlined,
                    ),
                    hint: const Text('Select visitor type'),
                    validator: (value) => value == null
                        ? 'Select a visitor type.'
                        : null,
                    items: const [
                      DropdownMenuItem(value: 'GUEST', child: Text('Guest')),
                      DropdownMenuItem(
                        value: 'DELIVERY_PERSON',
                        child: Text('Delivery person'),
                      ),
                      DropdownMenuItem(
                        value: 'SERVICE_PROVIDER',
                        child: Text('Service provider'),
                      ),
                      DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                    ],
                    onChanged: (value) =>
                        setSheetState(() => visitorType = value),
                  ),
                  if (visitorType == 'DELIVERY_PERSON') ...[
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: deliveryCompany,
                      validator: (value) =>
                          visitorType == 'DELIVERY_PERSON' &&
                              (value == null || value.trim().isEmpty)
                          ? 'Enter the delivery company.'
                          : null,
                      decoration: _fieldDecoration(
                        'Delivery company',
                        Icons.local_shipping_outlined,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: gateId,
                    decoration: _fieldDecoration(
                      'Entry gate',
                      Icons.door_front_door_outlined,
                    ),
                    hint: const Text('Select entry gate'),
                    validator: (value) => value == null
                        ? 'Select an entry gate.'
                        : null,
                    items: data.gates
                        .map(
                          (gate) => DropdownMenuItem(
                            value: gate.id,
                            child: Text(gate.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setSheetState(() => gateId = value),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    height: 52,
                    child: FilledButton.icon(
                      onPressed: saving
                          ? null
                          : () async {
                              if (!formKey.currentState!.validate()) {
                                return;
                              }
                              setSheetState(() => saving = true);
                              try {
                                final profile = await _GuardApi.post(
                                  '/visitors/profiles',
                                  {
                                    'societyId': widget.user.societyId,
                                    'name': name.text.trim(),
                                    'visitorType': visitorType!,
                                    'phone': phone.text.trim(),
                                    'deliveryCompany':
                                        visitorType == 'DELIVERY_PERSON'
                                        ? deliveryCompany.text.trim()
                                        : null,
                                  },
                                  widget.user.accessToken,
                                );
                                final profileId = profile['id']?.toString();
                                if (profileId == null || profileId.isEmpty) {
                                  throw const _GuardApiException(
                                    'The server did not return a visitor record.',
                                  );
                                }
                                await _GuardApi.post('/visitors/passes', {
                                  'visitorProfileId': profileId,
                                  'gateId': gateId!,
                                  'passNo':
                                      'WALKIN-${DateTime.now().millisecondsSinceEpoch}',
                                }, widget.user.accessToken);
                                if (sheetContext.mounted) {
                                  Navigator.pop(sheetContext, true);
                                }
                              } on _GuardApiException catch (error) {
                                setSheetState(() => saving = false);
                                if (mounted) {
                                  _showError(error.message);
                                }
                              }
                            },
                      icon: saving
                          ? const SizedBox.square(
                              dimension: 17,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.person_add_alt_1_rounded),
                      label: Text(
                        saving ? 'Saving visitor...' : 'Create visitor pass',
                      ),
                    ),
                  ),
                ],
              ),
              ),
            ),
          ),
        ),
      ),
    );
    name.dispose();
    phone.dispose();
    deliveryCompany.dispose();
    if (created == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Visitor registered. Record their arrival when they reach the gate.',
          ),
        ),
      );
      await _refresh();
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF9D2635),
      ),
    );
  }

  void _signOut() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFF5F7FB),
    body: SafeArea(
      bottom: false,
      child: FutureBuilder<_GuardSnapshot>(
        future: _snapshot,
        builder: (context, state) {
          if (state.hasError) {
            return _errorView(state.error.toString());
          }
          if (!state.hasData) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.indigo),
            );
          }
          final data = state.data!;
          return Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  color: AppColors.indigo,
                  onRefresh: _refresh,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(18, 14, 18, 24),
                    children: [
                      Center(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 720),
                          child: Column(
                            children: [
                              _header(data),
                              const SizedBox(height: 18),
                              switch (_tab) {
                                0 => _overview(data),
                                1 => _visitors(data),
                                2 => _gateLog(data),
                                _ => _profile(),
                              },
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              _bottomBar(),
            ],
          );
        },
      ),
    ),
  );

  Widget _header(_GuardSnapshot data) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(24),
      gradient: const LinearGradient(
        colors: [AppColors.indigo, AppColors.violet],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      boxShadow: const [
        BoxShadow(
          color: Color(0x286455E9),
          blurRadius: 20,
          offset: Offset(0, 9),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .16),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.apartment_rounded, color: Colors.white),
            ),
            const SizedBox(width: 11),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'HOUSING SOCIETY',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'SECURITY OPERATIONS',
                    style: TextStyle(
                      color: Color(0xFFE5E3FF),
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.15,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: _signOut,
              tooltip: 'Sign out',
              icon: const Icon(Icons.logout_rounded, color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 19),
        Text(
          'Hello, ${_firstName(widget.user.name)}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 23,
            fontWeight: FontWeight.w800,
            letterSpacing: -.4,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          '${data.gates.length} ${data.gates.length == 1 ? 'gate' : 'gates'} assigned  ·  Employee ${widget.user.employeeCode ?? '—'}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Color(0xFFE7E5FF),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 17),
        Row(
          children: [
            _headerMetric(data.activeCount.toString(), 'Inside'),
            const SizedBox(width: 9),
            _headerMetric(data.expectedCount.toString(), 'Expected'),
            const SizedBox(width: 9),
            _headerMetric(data.arrivedCount.toString(), 'At gate'),
          ],
        ),
      ],
    ),
  );

  Widget _headerMetric(String value, String label) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .14),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFFE7E5FF),
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    ),
  );

  Widget _overview(_GuardSnapshot data) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Row(
        children: [
          Expanded(
            child: _statCard(
              'Expected visitors',
              data.expectedCount.toString(),
              Icons.event_available_rounded,
              const Color(0xFFEDEBFF),
              AppColors.indigo,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _statCard(
              'Visitors inside',
              data.activeCount.toString(),
              Icons.groups_rounded,
              const Color(0xFFE8F7F1),
              const Color(0xFF199866),
            ),
          ),
        ],
      ),
      const SizedBox(height: 20),
      _sectionHeading('Gate activity', '${data.passes.length} passes'),
      const SizedBox(height: 10),
      if (data.actionablePasses.isEmpty)
        _emptyCard('No visitors are waiting at the gate right now.')
      else
        ...data.actionablePasses
            .take(5)
            .map(
              (pass) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _passCard(pass, data),
              ),
            ),
      const SizedBox(height: 10),
      _sectionHeading('Quick actions', 'Security desk'),
      const SizedBox(height: 10),
      Row(
        children: [
          Expanded(
            child: _quickAction(
              icon: Icons.person_add_alt_1_rounded,
              title: 'Register visitor',
              subtitle: 'Create a walk-in pass',
              onTap: () => _registerWalkIn(data),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _quickAction(
              icon: Icons.receipt_long_rounded,
              title: 'Gate log',
              subtitle: 'Review recent entries',
              onTap: () => setState(() => _tab = 2),
            ),
          ),
        ],
      ),
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: Row(
          children: [
            const Icon(Icons.shield_outlined, color: AppColors.indigo),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Keep each entry and exit recorded to maintain an accurate gate log.',
                style: TextStyle(
                  color: AppColors.inkSoft,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  );

  Widget _visitors(_GuardSnapshot data) {
    const filters = ['ALL', 'EXPECTED', 'ARRIVED', 'INSIDE', 'EXITED'];
    final visible = _visitorFilter == 'ALL'
        ? data.passes
        : data.passes.where((pass) => pass.status == _visitorFilter).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeading('Visitor passes', '${visible.length} records'),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: filters
                .map(
                  (filter) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        filter == 'ALL' ? 'All' : _statusLabel(filter),
                      ),
                      selected: _visitorFilter == filter,
                      onSelected: (_) =>
                          setState(() => _visitorFilter = filter),
                      selectedColor: const Color(0xFFEAE8FF),
                      labelStyle: TextStyle(
                        color: _visitorFilter == filter
                            ? AppColors.indigo
                            : AppColors.inkSoft,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                      side: BorderSide(
                        color: _visitorFilter == filter
                            ? AppColors.indigo.withValues(alpha: .25)
                            : const Color(0xFFE4E9F1),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 8),
        if (visible.isEmpty)
          _emptyCard('No visitor passes match this filter.')
        else
          ...visible.map(
            (pass) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _passCard(pass, data),
            ),
          ),
      ],
    );
  }

  Widget _gateLog(_GuardSnapshot data) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _sectionHeading('Recent gate log', '${data.events.length} events'),
      const SizedBox(height: 12),
      if (data.events.isEmpty)
        _emptyCard('Gate entries and exits will appear here.')
      else
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 15),
          decoration: _cardDecoration(),
          child: Column(
            children: data.events.take(60).map((event) {
              final pass = data.passById[event.passId];
              final isEntry = event.type == 'ENTRY';
              return _logRow(
                isEntry ? Icons.login_rounded : Icons.logout_rounded,
                isEntry ? 'Visitor entry' : 'Visitor exit',
                '${pass == null ? 'Pass' : _visitorName(pass, data)}  ·  ${data.gateName(event.gateId)}',
                _formatDate(event.at),
                isEntry ? const Color(0xFF199866) : const Color(0xFF67758E),
              );
            }).toList(),
          ),
        ),
    ],
  );

  Widget _profile() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _sectionHeading('Guard profile', 'Signed in'),
      const SizedBox(height: 12),
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFECEBFF), Color(0xFFF6F5FF)],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE3E4FA)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 29,
              backgroundColor: AppColors.indigo,
              foregroundImage: widget.user.profilePictureUrl == null
                  ? null
                  : NetworkImage(widget.user.profilePictureUrl!),
              child: widget.user.profilePictureUrl == null
                  ? Text(
                      _initials(widget.user.name),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.user.name, style: _titleStyle(17)),
                  const SizedBox(height: 4),
                  Text(
                    'Security guard  ·  ${widget.user.employeeCode ?? 'Code unavailable'}',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 14),
      Container(
        decoration: _cardDecoration(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            _profileRow(Icons.mail_outline_rounded, 'Email', widget.user.email),
            _profileRow(
              Icons.phone_outlined,
              'Phone',
              widget.user.phone ?? 'Not provided',
            ),
            _profileRow(
              Icons.badge_outlined,
              'Employee code',
              widget.user.employeeCode ?? 'Not provided',
            ),
          ],
        ),
      ),
      const SizedBox(height: 18),
      OutlinedButton.icon(
        onPressed: _signOut,
        icon: const Icon(Icons.logout_rounded),
        label: const Text('Sign out'),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFB43D4B),
          minimumSize: const Size.fromHeight(50),
          side: const BorderSide(color: Color(0xFFFFD5D8)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    ],
  );

  Widget _passCard(_GuardPass pass, _GuardSnapshot data) {
    final statusColor = _statusColor(pass.status);
    final action = switch (pass.status) {
      'EXPECTED' => ('Record arrival', 'ARRIVAL'),
      'ARRIVED' => ('Allow entry', 'ENTRY'),
      'INSIDE' || 'OVERSTAY' => ('Record exit', 'EXIT'),
      _ => (null, null),
    };
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFEDEBFF),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.person_pin_circle_outlined,
                  color: AppColors.indigo,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _visitorName(pass, data),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${_visitorTypeLabel(pass, data)}  ·  ${data.gateName(pass.gateId)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              _statusBadge(pass.status, statusColor),
            ],
          ),
          const SizedBox(height: 11),
          Row(
            children: [
              const Icon(
                Icons.confirmation_number_outlined,
                size: 15,
                color: AppColors.muted,
              ),
              const SizedBox(width: 5),
              Text(
                'Pass ${pass.passNo}',
                style: const TextStyle(
                  color: AppColors.inkSoft,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text(
                _formatDate(pass.createdAt),
                style: const TextStyle(color: AppColors.muted, fontSize: 10),
              ),
            ],
          ),
          if (action.$1 != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 43,
              child: FilledButton.icon(
                onPressed: () => _changePass(pass, action.$2!),
                icon: Icon(
                  action.$2 == 'EXIT'
                      ? Icons.logout_rounded
                      : Icons.arrow_forward_rounded,
                  size: 17,
                ),
                label: Text(action.$1!),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.indigo,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _statCard(
    String title,
    String value,
    IconData icon,
    Color tint,
    Color accent,
  ) => Container(
    padding: const EdgeInsets.all(14),
    decoration: _cardDecoration(),
    child: Row(
      children: [
        Container(
          width: 39,
          height: 39,
          decoration: BoxDecoration(
            color: tint,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: accent),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _quickAction({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    child: InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFEBEFF5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFEDEBFF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.indigo, size: 20),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.ink,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              subtitle,
              style: const TextStyle(color: AppColors.muted, fontSize: 10),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _sectionHeading(String title, String trailing) => Row(
    children: [
      Expanded(child: Text(title, style: _titleStyle(16))),
      Text(
        trailing,
        style: const TextStyle(
          color: AppColors.muted,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    ],
  );

  Widget _emptyCard(String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 23),
    decoration: _cardDecoration(),
    child: Column(
      children: [
        const Icon(
          Icons.shield_moon_outlined,
          color: AppColors.muted,
          size: 30,
        ),
        const SizedBox(height: 9),
        Text(
          text,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.muted, fontSize: 12),
        ),
      ],
    ),
  );

  Widget _logRow(
    IconData icon,
    String title,
    String subtitle,
    String time,
    Color color,
  ) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .1),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 10),
              ),
            ],
          ),
        ),
        const SizedBox(width: 5),
        Text(
          time,
          style: const TextStyle(color: AppColors.muted, fontSize: 10),
        ),
      ],
    ),
  );

  Widget _profileRow(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 14),
    child: Row(
      children: [
        Icon(icon, color: AppColors.indigo, size: 19),
        const SizedBox(width: 11),
        SizedBox(
          width: 102,
          child: Text(
            label,
            style: const TextStyle(color: AppColors.muted, fontSize: 12),
          ),
        ),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.inkSoft,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );

  Widget _statusBadge(String status, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      _statusLabel(status),
      style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w800),
    ),
  );

  Widget _bottomBar() => Container(
    decoration: const BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: Color(0xFFEAEFF5))),
    ),
    child: SafeArea(
      top: false,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 7, 8, 5),
            child: Row(
              children: [
                _navItem(Icons.shield_outlined, 'Overview', 0),
                _navItem(Icons.groups_2_outlined, 'Visitors', 1),
                _navItem(Icons.receipt_long_outlined, 'Gate log', 2),
                _navItem(Icons.person_outline_rounded, 'Profile', 3),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  Widget _navItem(IconData icon, String label, int index) => Expanded(
    child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => setState(() => _tab = index),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 21,
              color: _tab == index ? AppColors.indigo : const Color(0xFFA0AABD),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: _tab == index ? FontWeight.w800 : FontWeight.w600,
                color: _tab == index
                    ? AppColors.indigo
                    : const Color(0xFFA0AABD),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _errorView(Object error) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              color: AppColors.muted,
              size: 42,
            ),
            const SizedBox(height: 12),
            const Text(
              'Could not load the security dashboard',
              style: TextStyle(
                color: AppColors.ink,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 7),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _refresh,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
            TextButton(onPressed: _signOut, child: const Text('Sign out')),
          ],
        ),
      ),
    ),
  );
}

class _GuardSnapshot {
  const _GuardSnapshot({
    required this.gates,
    required this.profiles,
    required this.passes,
    required this.events,
  });

  final List<_Gate> gates;
  final Map<String, _Visitor> profiles;
  final List<_GuardPass> passes;
  final List<_GateEvent> events;

  int get activeCount => passes
      .where((pass) => pass.status == 'INSIDE' || pass.status == 'OVERSTAY')
      .length;
  int get expectedCount =>
      passes.where((pass) => pass.status == 'EXPECTED').length;
  int get arrivedCount =>
      passes.where((pass) => pass.status == 'ARRIVED').length;
  List<_GuardPass> get actionablePasses => passes
      .where(
        (pass) =>
            pass.status == 'EXPECTED' ||
            pass.status == 'ARRIVED' ||
            pass.status == 'INSIDE' ||
            pass.status == 'OVERSTAY',
      )
      .toList();
  Map<String, _GuardPass> get passById => {
    for (final pass in passes) pass.id: pass,
  };
  String gateName(String id) {
    for (final gate in gates) {
      if (gate.id == id) return gate.name;
    }
    return 'Society gate';
  }
}

class _Gate {
  const _Gate(this.id, this.name);
  final String id;
  final String name;
  factory _Gate.fromJson(Map<String, dynamic> json) =>
      _Gate('${json['id'] ?? ''}', '${json['name'] ?? 'Gate'}');
}

class _Visitor {
  const _Visitor({
    required this.id,
    required this.name,
    required this.type,
    this.phone,
  });
  final String id;
  final String name;
  final String type;
  final String? phone;
  factory _Visitor.fromJson(Map<String, dynamic> json) => _Visitor(
    id: '${json['id'] ?? ''}',
    name: '${json['name'] ?? 'Visitor'}',
    type: '${json['visitor_type'] ?? 'GUEST'}',
    phone: json['phone']?.toString(),
  );
}

class _GuardPass {
  const _GuardPass({
    required this.id,
    required this.gateId,
    required this.profileId,
    required this.passNo,
    required this.status,
    required this.createdAt,
  });
  final String id;
  final String gateId;
  final String profileId;
  final String passNo;
  final String status;
  final DateTime? createdAt;
  factory _GuardPass.fromJson(Map<String, dynamic> json) => _GuardPass(
    id: '${json['id'] ?? ''}',
    gateId: '${json['gate_id'] ?? ''}',
    profileId: '${json['visitor_profile_id'] ?? ''}',
    passNo: '${json['pass_no'] ?? '—'}',
    status: '${json['status'] ?? 'EXPECTED'}'.toUpperCase(),
    createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
  );
}

class _GateEvent {
  const _GateEvent({
    required this.type,
    required this.passId,
    required this.gateId,
    required this.at,
  });
  final String type;
  final String passId;
  final String gateId;
  final DateTime? at;
  factory _GateEvent.fromJson(Map<String, dynamic> json) => _GateEvent(
    type: '${json['event_type'] ?? ''}'.toUpperCase(),
    passId: '${json['visitor_pass_id'] ?? ''}',
    gateId: '${json['gate_id'] ?? ''}',
    at: DateTime.tryParse('${json['event_at'] ?? ''}'),
  );
}

class _GuardApi {
  static Future<_GuardSnapshot> load(AuthenticatedUser user) async {
    final societyId = user.societyId;
    if (societyId == null || societyId.isEmpty) {
      throw const _GuardApiException(
        'This guard account is not linked to a society. Ask an administrator to check the staff assignment.',
      );
    }
    final gatesJson = await _get('/gates', user.accessToken);
    final gates = gatesJson
        .map(_Gate.fromJson)
        .where((gate) => gate.id.isNotEmpty)
        .toList();
    final profilesFuture = _get('/visitors/profiles', user.accessToken, {
      'societyId': societyId,
    });
    final eventsFuture = _get('/visitors/gate-events', user.accessToken, {
      'societyId': societyId,
    });
    final passFutures = gates.map(
      (gate) => _get('/visitors/passes', user.accessToken, {'gateId': gate.id}),
    );
    final results = await Future.wait([
      profilesFuture,
      eventsFuture,
      ...passFutures,
    ]);
    final profiles = <String, _Visitor>{
      for (final row in results[0])
        if ('${row['id'] ?? ''}'.isNotEmpty)
          '${row['id']}': _Visitor.fromJson(row),
    };
    final events = results[1].map(_GateEvent.fromJson).toList();
    final passes = results
        .skip(2)
        .expand((rows) => rows)
        .map(_GuardPass.fromJson)
        .toList();
    passes.sort(
      (a, b) => (b.createdAt ?? DateTime(1970)).compareTo(
        a.createdAt ?? DateTime(1970),
      ),
    );
    events.sort(
      (a, b) => (b.at ?? DateTime(1970)).compareTo(a.at ?? DateTime(1970)),
    );
    return _GuardSnapshot(
      gates: gates,
      profiles: profiles,
      passes: passes,
      events: events,
    );
  }

  static Future<List<Map<String, dynamic>>> _get(
    String path,
    String token, [
    Map<String, String>? query,
  ]) async {
    try {
      final uri = Uri.parse('$_apiBaseUrl$path')
          .replace(queryParameters: query);
      final response = await http
          .get(
            uri,
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw _GuardApiException(
          body['message']?.toString() ?? 'Could not load security data.',
        );
      }
      final data = body['data'];
      if (data is! List) return const [];
      return data.whereType<Map<String, dynamic>>().toList();
    } on _GuardApiException {
      rethrow;
    } on http.ClientException {
      throw const _GuardApiException(
        'Cannot reach the server. Check the backend and API address.',
      );
    } on TimeoutException {
      throw const _GuardApiException(
        'The server took too long to respond. Pull down to try again.',
      );
    } on FormatException {
      throw const _GuardApiException(
        'The server returned invalid security dashboard data.',
      );
    }
  }

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> payload,
    String token,
  ) => _send('POST', path, payload, token);
  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> payload,
    String token,
  ) => _send('PATCH', path, payload, token);

  static Future<Map<String, dynamic>> _send(
    String method,
    String path,
    Map<String, dynamic> payload,
    String token,
  ) async {
    try {
      final uri = Uri.parse('$_apiBaseUrl$path');
      final response =
          await (method == 'POST'
                  ? http.post(
                      uri,
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer $token',
                      },
                      body: jsonEncode(payload),
                    )
                  : http.patch(
                      uri,
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer $token',
                      },
                      body: jsonEncode(payload),
                    ))
              .timeout(const Duration(seconds: 20));
      final body = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 401) SessionManager.expire();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw _GuardApiException(
          body['message']?.toString() ?? 'The request could not be completed.',
        );
      }
      return body['data'] is Map<String, dynamic>
          ? body['data'] as Map<String, dynamic>
          : const {};
    } on _GuardApiException {
      rethrow;
    } on http.ClientException {
      throw const _GuardApiException(
        'Cannot reach the server. Check the backend and try again.',
      );
    } on TimeoutException {
      throw const _GuardApiException(
        'The server took too long to respond. Try again.',
      );
    } on FormatException {
      throw const _GuardApiException(
        'The server returned an invalid response.',
      );
    }
  }
}

class _GuardApiException implements Exception {
  const _GuardApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

Widget _surface(
  BuildContext context, {
  required Widget child,
  EdgeInsetsGeometry padding = const EdgeInsets.all(18),
}) => Container(
  width: double.infinity,
  padding: padding,
  decoration: BoxDecoration(
    color: Theme.of(context).colorScheme.surface,
    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
  ),
  child: child,
);

InputDecoration _fieldDecoration(String label, IconData icon) =>
    InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: AppColors.muted),
      filled: true,
      fillColor: const Color(0xFFFCFCFF),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFDDE3F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFDDE3F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.indigo, width: 1.5),
      ),
    );

BoxDecoration _cardDecoration() => BoxDecoration(
  color: Colors.white,
  borderRadius: BorderRadius.circular(18),
  border: Border.all(color: const Color(0xFFEBEFF5)),
  boxShadow: const [
    BoxShadow(color: Color(0x080F1A35), blurRadius: 14, offset: Offset(0, 5)),
  ],
);

TextStyle _titleStyle(double size) => TextStyle(
  color: AppColors.ink,
  fontSize: size,
  fontWeight: FontWeight.w800,
  letterSpacing: -.3,
);
String _firstName(String value) {
  final parts = value.trim().split(RegExp(r'\s+'));
  return parts.isEmpty || parts.first.isEmpty ? 'Guard' : parts.first;
}

String _initials(String value) => value
    .trim()
    .split(RegExp(r'\s+'))
    .where((part) => part.isNotEmpty)
    .take(2)
    .map((part) => part[0].toUpperCase())
    .join();
String _visitorName(_GuardPass pass, _GuardSnapshot data) =>
    data.profiles[pass.profileId]?.name ?? 'Visitor';
String _visitorTypeLabel(_GuardPass pass, _GuardSnapshot data) =>
    switch (data.profiles[pass.profileId]?.type.toUpperCase()) {
      'GUEST' => 'Guest',
      'DELIVERY_PERSON' => 'Delivery',
      'SERVICE_PROVIDER' => 'Service provider',
      'STAFF' => 'Staff',
      'OTHER' => 'Other visitor',
      _ => pass.status == 'OVERSTAY' ? 'Overstay' : 'Visitor',
    };
String _statusLabel(String status) => switch (status) {
  'ARRIVED' => 'At gate',
  'EXPECTED' => 'Expected',
  'INSIDE' => 'Inside',
  'OVERSTAY' => 'Overstay',
  'EXITED' => 'Exited',
  'CANCELLED' => 'Cancelled',
  _ => status,
};
Color _statusColor(String status) => switch (status) {
  'ARRIVED' => const Color(0xFFB16A00),
  'EXPECTED' => const Color(0xFF3977D5),
  'INSIDE' => const Color(0xFF199866),
  'OVERSTAY' => const Color(0xFFC53D4B),
  'EXITED' => const Color(0xFF67758E),
  _ => AppColors.muted,
};
String _formatDate(DateTime? date) {
  if (date == null) return 'Time unavailable';
  final local = date.toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final period = local.hour < 12 ? 'AM' : 'PM';
  return '${local.day}/${local.month}  $hour:$minute $period';
}
