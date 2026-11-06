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
import 'security_profile_screen.dart';

part '../../visitor_check_in/security_visitors_screen.dart';
part '../../gate_log/security_gate_log_screen.dart';
part '../../deliveries/security_deliveries_screen.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

const _residentActionGreenBg = Color(0xFFE4F7F1);
const _residentActionGreen = Color(0xFF229B78);
const _residentActionOrangeBg = Color(0xFFFFF1E5);
const _residentActionOrange = Color(0xFFE68A36);
const _residentActionBlueBg = Color(0xFFE8F1FF);
const _residentActionBlue = Color(0xFF4784DB);

const _deliveryTransitions = <String, List<String>>{
  'EXPECTED': ['ARRIVED', 'CANCELLED'],
  'ARRIVED': ['INSIDE', 'LEFT_AT_GATE', 'CANCELLED'],
  'INSIDE': ['PICKED_UP', 'EXITED', 'OVERSTAY', 'CANCELLED'],
  'LEFT_AT_GATE': ['PICKED_UP', 'OVERSTAY'],
  'OVERSTAY': ['PICKED_UP', 'EXITED'],
  'PICKED_UP': ['EXITED'],
  'EXITED': [],
  'CANCELLED': [],
};

String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    : kIsWeb
    ? 'http://localhost:5000/api/v1'
    : 'http://10.0.2.2:5000/api/v1';

String? _optionalString(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty || text == 'null' ? null : text;
}

String? _imageUrl(Object? value) {
  final path = _optionalString(value);
  if (path == null) return null;
  final uri = Uri.tryParse(path);
  if (uri == null) return null;
  return uri.hasScheme
      ? uri.toString()
      : Uri.parse(_apiBaseUrl).resolve(path).toString();
}

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
  int _deliveryTab = 0;
  String _visitorFilter = 'ALL';
  late Future<_GuardSnapshot> _snapshot;
  _GuardSnapshot? _loadedSnapshot;
  Timer? _deliverySyncTimer;
  Timer? _visitorPassSyncTimer;
  bool _deliverySyncRunning = false;
  bool _visitorPassSyncRunning = false;
  final ValueNotifier<int> _deliveryRevision = ValueNotifier(0);

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

  Future<void> _refreshDeliveries({bool showErrors = true}) async {
    final snapshot = _loadedSnapshot;
    if (snapshot == null || _deliverySyncRunning) return;
    _deliverySyncRunning = true;
    try {
      final updated = await _GuardApi.loadDeliveries(widget.user);
      if (!mounted) return;
      snapshot.deliveries
        ..clear()
        ..addAll(updated.deliveries);
      snapshot.parcels
        ..clear()
        ..addAll(updated.parcels);
      _deliveryRevision.value++;
    } on _GuardApiException catch (error) {
      if (showErrors && mounted) _showError(error.message);
    } catch (_) {
      if (showErrors && mounted) {
        _showError('Could not refresh deliveries. Please try again.');
      }
    } finally {
      _deliverySyncRunning = false;
    }
  }

  void _selectTab(int index) {
    _deliverySyncTimer?.cancel();
    _deliverySyncTimer = null;
    _visitorPassSyncTimer?.cancel();
    _visitorPassSyncTimer = null;
    if (index == 4) {
      unawaited(_openProfile());
      return;
    }
    setState(() => _tab = index);
    if (index == 1) {
      unawaited(_refreshVisitorPasses());
      _visitorPassSyncTimer = Timer.periodic(
        const Duration(seconds: 5),
        (_) => _refreshVisitorPasses(),
      );
    }
    if (index == 3) {
      unawaited(_refreshDeliveries(showErrors: false));
      _deliverySyncTimer = Timer.periodic(
        const Duration(seconds: 3),
        (_) => unawaited(_refreshDeliveries(showErrors: false)),
      );
    }
  }

  Future<void> _openProfile() async {
    _deliverySyncTimer?.cancel();
    _deliverySyncTimer = null;
    _visitorPassSyncTimer?.cancel();
    _visitorPassSyncTimer = null;
    final gateNames = _loadedSnapshot?.gates.map((gate) => gate.name).toList() ??
        const <String>[];
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => SecurityProfileScreen(
          user: widget.user,
          gateNames: gateNames,
          profilePhotoUrl: _loadedSnapshot?.accountPhotoUrl,
          onSignOut: _signOut,
        ),
      ),
    );
    if (mounted) setState(() => _tab = 0);
  }

  Future<void> _refreshVisitorPasses() async {
    final snapshot = _loadedSnapshot;
    if (!mounted || snapshot == null || _visitorPassSyncRunning || _tab != 1) {
      return;
    }
    _visitorPassSyncRunning = true;
    try {
      final passes = await _GuardApi.loadPasses(widget.user, snapshot.gates);
      if (!mounted) return;
      snapshot.passes
        ..clear()
        ..addAll(passes);
      snapshot.passes.sort(
        (a, b) => (b.createdAt ?? DateTime(1970)).compareTo(
          a.createdAt ?? DateTime(1970),
        ),
      );
      setState(() {});
    } catch (_) {
      // Keep the last visitor pass states visible on transient errors.
    } finally {
      _visitorPassSyncRunning = false;
    }
  }

  @override
  void dispose() {
    _deliverySyncTimer?.cancel();
    _visitorPassSyncTimer?.cancel();
    _deliveryRevision.dispose();
    super.dispose();
  }

  Future<void> _changePass(
    _GuardPass pass,
    String action,
    _GuardSnapshot data,
  ) async {
    try {
      Map<String, dynamic> response;
      if (action == 'ARRIVAL') {
        response = await _GuardApi.patch(
          '/visitors/passes/${pass.id}/arrival',
          const {},
          widget.user.accessToken,
        );
      } else if (action == 'ENTRY') {
        response = await _GuardApi.patch('/visitors/passes/${pass.id}/entry', {
          'capturedBy': widget.user.userId,
        }, widget.user.accessToken);
      } else if (action == 'CANCEL') {
        response = await _GuardApi.patch(
          '/visitors/passes/${pass.id}/cancel',
          const {},
          widget.user.accessToken,
        );
      } else {
        response = await _GuardApi.patch('/visitors/passes/${pass.id}/exit', {
          'capturedBy': widget.user.userId,
        }, widget.user.accessToken);
      }
      if (!mounted) return;
      final updatedPass = _GuardPass.fromJson(response);
      final eventType = action == 'ENTRY'
          ? 'ENTRY'
          : action == 'EXIT'
          ? 'EXIT'
          : null;
      setState(() {
        final index = data.passes.indexWhere((item) => item.id == pass.id);
        if (index >= 0) data.passes[index] = updatedPass;
        if (eventType != null) {
          data.events.insert(
            0,
            _GateEvent(
              type: eventType,
              passId: pass.id,
              gateId: pass.gateId,
              at: DateTime.now(),
            ),
          );
        }
      });
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
    final vehicleNo = TextEditingController();
    final formKey = GlobalKey<FormState>();
    String? visitorType;
    String? gateId;
    String? idType;
    _GuardDestination? destination;
    bool saving = false;
    final created = await showModalBottomSheet<Map<String, dynamic>>(
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
                  Row(
                    children: [
                      IconButton(
                        tooltip: 'Close visitor form',
                        onPressed: () => Navigator.of(sheetContext).pop(),
                        icon: const Icon(Icons.arrow_back_rounded),
                      ),
                      Expanded(
                        child: Text(
                          'Register a visitor',
                          style: _titleStyle(20),
                        ),
                      ),
                    ],
                  ),
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
                  _styledDropdownField<String>(
                    value: visitorType,
                    decoration: _fieldDecoration('Visitor type', Icons.category_outlined),
                    hint: 'Select visitor type',
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
                    onChanged: (value) => setSheetState(() => visitorType = value),
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
                  _styledDropdownField<String>(
                    value: idType,
                    decoration: _fieldDecoration('ID proof type (optional)', Icons.badge_outlined),
                    hint: 'Select ID proof type',
                    items: const [
                      DropdownMenuItem(value: 'AADHAAR', child: Text('Aadhaar')),
                      DropdownMenuItem(value: 'DRIVING_LICENSE', child: Text('Driving license')),
                      DropdownMenuItem(value: 'PASSPORT', child: Text('Passport')),
                      DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                    ],
                    onChanged: (value) => setSheetState(() => idType = value),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: vehicleNo,
                    textCapitalization: TextCapitalization.characters,
                    decoration: _fieldDecoration(
                      'Vehicle number (optional)',
                      Icons.directions_car_outlined,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (data.destinations.isEmpty)
                    InputDecorator(
                      decoration: _fieldDecoration(
                        'Visiting flat / resident',
                        Icons.apartment_rounded,
                      ),
                      child: const Text(
                        'No active resident and flat assignments available',
                        style: TextStyle(color: AppColors.muted),
                      ),
                    )
                  else
                    _styledDropdownField<_GuardDestination>(
                      value: destination,
                      decoration: _fieldDecoration(
                        'Visiting flat / resident',
                        Icons.apartment_rounded,
                      ),
                      hint: 'Select the resident being visited',
                      validator: (value) => value == null
                          ? 'Select the flat and resident being visited.'
                          : null,
                      items: data.destinations
                          .map(
                            (item) => DropdownMenuItem(
                              value: item,
                              child: Text(
                                item.label,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setSheetState(() => destination = value),
                    ),
                  const SizedBox(height: 12),
                  _styledDropdownField<String>(
                    value: gateId,
                    decoration: _fieldDecoration(
                      'Entry gate',
                      Icons.door_front_door_outlined,
                    ),
                    hint: 'Select entry gate',
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
                              if (data.destinations.isEmpty) {
                                _showError(
                                  'Add an active resident and assign a flat before registering visitors.',
                                );
                                return;
                              }
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
                                    'idType': idType,
                                    'vehicleNo': vehicleNo.text.trim().toUpperCase(),
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
                                final pass = await _GuardApi.post('/visitors/passes', {
                                  'visitorProfileId': profileId,
                                  'gateId': gateId!,
                                  'unitId': destination!.unitId,
                                  'residentId': destination!.residentId,
                                  'passNo':
                                      'WALKIN-${DateTime.now().millisecondsSinceEpoch}',
                                }, widget.user.accessToken);
                                if ('${pass['id'] ?? ''}'.isEmpty) {
                                  throw const _GuardApiException(
                                    'The server did not return the visitor pass.',
                                  );
                                }
                                if (sheetContext.mounted) {
                                  Navigator.pop(sheetContext, {
                                    'profile': profile,
                                    'pass': pass,
                                  });
                                }
                              } on _GuardApiException catch (error) {
                                if (sheetContext.mounted) {
                                  setSheetState(() => saving = false);
                                }
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
    vehicleNo.dispose();
    if (created != null && mounted) {
      final visitorJson = Map<String, dynamic>.from(
        created['profile'] as Map,
      );
      final passJson = Map<String, dynamic>.from(created['pass'] as Map);
      final visitor = _Visitor.fromJson(visitorJson);
      final pass = _GuardPass.fromJson(passJson);
      setState(() {
        data.profiles[visitor.id] = visitor;
        data.passes.removeWhere((item) => item.id == pass.id);
        data.passes.insert(0, pass);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Visitor registered. Record their arrival when they reach the gate.',
          ),
        ),
      );
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
          _loadedSnapshot = data;
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
                          constraints: const BoxConstraints(maxWidth: 900),
                          child: Column(
                            children: [
                              _header(data),
                              if (_tab == 0) ...[
                                const SizedBox(height: 24),
                                _greeting(),
                                const SizedBox(height: 20),
                                _securitySummaryCard(data),
                              ],
                              SizedBox(height: _tab == 0 ? 24 : 18),
                              switch (_tab) {
                                0 => _overview(data),
                                1 => _SecurityVisitorsScreen(owner: this, data: data),
                                2 => _SecurityGateLogScreen(owner: this, data: data),
                                3 => _SecurityDeliveriesScreen(owner: this, data: data),
                                _ => const SizedBox.shrink(),
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

  Widget _header(_GuardSnapshot data) => Row(
    children: [
      Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFE8ECF3)),
        ),
        child: data.societyLogoUrl == null
            ? const Icon(
                Icons.apartment_rounded,
                color: AppColors.indigo,
                size: 24,
              )
            : ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(
                  data.societyLogoUrl!,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const Icon(
                    Icons.apartment_rounded,
                    color: AppColors.indigo,
                    size: 24,
                  ),
                ),
              ),
      ),
      const SizedBox(width: 11),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              data.societyName ?? 'Housing Society',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
                color: AppColors.ink,
              ),
            ),
            SizedBox(height: 2),
            Text(
              'SECURITY PORTAL',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.3,
                color: AppColors.muted,
              ),
            ),
          ],
        ),
      ),
      _headerIcon(
        Icons.notifications_none_rounded,
        badge: data.expectedCount > 0,
        onTap: () => _selectTab(1),
      ),
      const SizedBox(width: 9),
      PopupMenuButton<String>(
        tooltip: 'Account',
        onSelected: (value) {
          if (value == 'profile') {
            unawaited(_openProfile());
          } else if (value == 'logout') {
            _signOut();
          }
        },
        itemBuilder: (_) => const [
          PopupMenuItem(value: 'profile', child: Text('Profile')),
          PopupMenuItem(value: 'logout', child: Text('Sign out')),
        ],
        child: _securityAvatar(data),
      ),
    ],
  );

  Widget _headerIcon(
    IconData icon, {
    required bool badge,
    required VoidCallback onTap,
  }) => InkWell(
    onTap: onTap,
    customBorder: const CircleBorder(),
    child: Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFE8ECF3)),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(icon, color: const Color(0xFF68748A), size: 21),
          if (badge)
            const Positioned(
              right: 10,
              top: 9,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0xFFFF6F72),
                  shape: BoxShape.circle,
                ),
                child: SizedBox(width: 7, height: 7),
              ),
            ),
        ],
      ),
    ),
  );

  Widget _securityAvatar(_GuardSnapshot data) {
    final photoUrl = _imageUrl(
      data.accountPhotoUrl ?? widget.user.profilePictureUrl,
    );
    return CircleAvatar(
      radius: 22,
      backgroundColor: const Color(0xFFEAE8FF),
      child: photoUrl == null || photoUrl.trim().isEmpty
          ? Text(
              _initials(widget.user.name),
              style: const TextStyle(
                color: AppColors.indigo,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            )
          : ClipOval(
              child: Image.network(
                photoUrl,
                width: 44,
                height: 44,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Center(
                  child: Text(
                    _initials(widget.user.name),
                    style: const TextStyle(
                      color: AppColors.indigo,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _greeting() {
    final now = DateTime.now();
    final greeting = now.hour < 12
        ? 'Morning'
        : now.hour < 17
        ? 'Afternoon'
        : 'Evening';
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${weekdays[now.weekday - 1].toUpperCase()}, ${now.day} ${months[now.month - 1].toUpperCase()}',
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.15,
            color: AppColors.muted,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          'Good $greeting, ${_firstName(widget.user.name)}',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            letterSpacing: -.65,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 5),
        const Text(
          'Here is what is happening at your gate today.',
          style: TextStyle(fontSize: 13, color: Color(0xFF7C879B)),
        ),
      ],
    );
  }

  Widget _securitySummaryCard(_GuardSnapshot data) => Container(
    padding: const EdgeInsets.all(18),
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
          blurRadius: 20,
          offset: Offset(0, 10),
        ),
      ],
    ),
    child: Stack(
      children: [
        Positioned(
          right: -22,
          top: -30,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: .08),
            ),
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.shield_outlined,
                  color: Color(0xFFE2DFFF),
                  size: 17,
                ),
                const SizedBox(width: 7),
                const Expanded(
                  child: Text(
                    'SECURITY DESK',
                    style: TextStyle(
                      color: Color(0xFFE2DFFF),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.25,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .17),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'ON DUTY',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .7,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 15),
            const Text(
              'Security operations',
              style: TextStyle(
                color: Colors.white,
                fontSize: 21,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'Employee ${widget.user.employeeCode ?? 'Not assigned'}  ·  ${data.gates.length} ${data.gates.length == 1 ? 'gate' : 'gates'} assigned',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFFE7E4FF),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    ),
  );

  Widget _overview(_GuardSnapshot data) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
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
                child: this._passCard(pass, data),
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
              iconBackground: _residentActionGreenBg,
              iconColor: _residentActionGreen,
              title: 'Register visitor',
              subtitle: 'Create a walk-in pass',
              onTap: () => _registerWalkIn(data),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _quickAction(
              icon: Icons.receipt_long_rounded,
              iconBackground: _residentActionOrangeBg,
              iconColor: _residentActionOrange,
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

  Future<void> _registerDelivery(_GuardSnapshot data) async {
    if (data.units.isEmpty) {
      _showError('No resident flats are available for delivery registration.');
      return;
    }
    final formKey = GlobalKey<FormState>();
    final courier = TextEditingController();
    String? unitId;
    String visitorId = '';
    String deliveryType = 'COURIER';
    bool saving = false;
    final created = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
          child: _surface(
            context,
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
            child: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(child: Container(width: 42, height: 4, decoration: BoxDecoration(color: const Color(0xFFDCE2EE), borderRadius: BorderRadius.circular(5)))),
                    const SizedBox(height: 20),
                    Text('Register delivery', style: _titleStyle(20)),
                    const SizedBox(height: 16),
                    _styledDropdownField<String>(
                      value: unitId,
                      decoration: _fieldDecoration('Unit', Icons.apartment_rounded),
                      hint: 'Select destination flat',
                      validator: (value) => value == null ? 'Select a flat.' : null,
                      items: data.units.map((unit) => DropdownMenuItem(value: unit.id, child: Text(unit.label, overflow: TextOverflow.ellipsis))).toList(),
                      onChanged: (value) => setSheetState(() => unitId = value),
                    ),
                    const SizedBox(height: 12),
                    _styledDropdownField<String>(
                      value: visitorId,
                      decoration: _fieldDecoration('Visitor profile (optional)', Icons.person_outline_rounded),
                      items: [
                        const DropdownMenuItem(value: '', child: Text('No linked visitor')),
                        ...data.profiles.values.map((visitor) => DropdownMenuItem(value: visitor.id, child: Text(visitor.name, overflow: TextOverflow.ellipsis))),
                      ],
                      onChanged: (value) => setSheetState(() => visitorId = value ?? ''),
                    ),
                    const SizedBox(height: 12),
                    _styledDropdownField<String>(
                      value: deliveryType,
                      decoration: _fieldDecoration('Delivery type', Icons.category_outlined),
                      items: const [
                        DropdownMenuItem(value: 'COURIER', child: Text('Courier')),
                        DropdownMenuItem(value: 'FOOD', child: Text('Food')),
                        DropdownMenuItem(value: 'E_COMMERCE', child: Text('E-commerce')),
                        DropdownMenuItem(value: 'GROCERY', child: Text('Grocery')),
                        DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                      ],
                      onChanged: (value) => setSheetState(() => deliveryType = value ?? 'COURIER'),
                    ),
                    const SizedBox(height: 12),
                    TextField(controller: courier, decoration: _fieldDecoration('Courier / source (optional)', Icons.local_shipping_outlined)),
                    const SizedBox(height: 18),
                    SizedBox(height: 50, child: FilledButton.icon(
                      onPressed: saving ? null : () async {
                        if (!formKey.currentState!.validate()) return;
                        setSheetState(() => saving = true);
                        try {
                          final result = await _GuardApi.post('/deliveries', {
                            'societyId': widget.user.societyId,
                            'unitId': unitId,
                            'visitorProfileId': visitorId.isEmpty ? null : visitorId,
                            'deliveryType': deliveryType,
                            'courierName': courier.text.trim(),
                          }, widget.user.accessToken);
                          if (sheetContext.mounted) Navigator.pop(sheetContext, result);
                        } on _GuardApiException catch (error) {
                          if (sheetContext.mounted) setSheetState(() => saving = false);
                          if (mounted) _showError(error.message);
                        }
                      },
                      icon: saving ? const SizedBox.square(dimension: 17, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.add_rounded),
                      label: Text(saving ? 'Registering...' : 'Register delivery'),
                    )),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
    courier.dispose();
    if (created != null && mounted) {
      final delivery = _Delivery.fromJson(created);
      setState(() => data.deliveries.insert(0, delivery));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delivery registered.')));
    }
  }

  Future<void> _registerParcel(_GuardSnapshot data) async {
    if (data.deliveries.isEmpty) {
      _showError('Register a delivery before logging its parcel.');
      return;
    }
    final location = TextEditingController();
    String? deliveryId;
    bool saving = false;
    final created = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
          child: _surface(
            context,
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
            child: SingleChildScrollView(child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(child: Container(width: 42, height: 4, decoration: BoxDecoration(color: const Color(0xFFDCE2EE), borderRadius: BorderRadius.circular(5)))),
                const SizedBox(height: 20),
                Text('Log parcel', style: _titleStyle(20)),
                const SizedBox(height: 16),
                _styledDropdownField<String>(
                  value: deliveryId,
                  decoration: _fieldDecoration('Related delivery', Icons.local_shipping_outlined),
                  hint: 'Select delivery',
                  items: data.deliveries.map((item) => DropdownMenuItem(value: item.id, child: Text('${_humanize(item.type)} · ${item.courierName ?? 'Delivery'}', overflow: TextOverflow.ellipsis))).toList(),
                  onChanged: (value) => setSheetState(() => deliveryId = value),
                ),
                const SizedBox(height: 12),
                TextField(controller: location, decoration: _fieldDecoration('Storage location (optional)', Icons.inventory_2_outlined)),
                const SizedBox(height: 18),
                SizedBox(height: 50, child: FilledButton.icon(
                  onPressed: saving ? null : () async {
                    if (deliveryId == null) {
                      _showError('Select the delivery for this parcel.');
                      return;
                    }
                    setSheetState(() => saving = true);
                    try {
                      final result = await _GuardApi.post('/deliveries/parcels', {
                        'deliveryId': deliveryId,
                        'storageLocation': location.text.trim(),
                        'receivedBy': widget.user.userId,
                      }, widget.user.accessToken);
                      if (sheetContext.mounted) Navigator.pop(sheetContext, result);
                    } on _GuardApiException catch (error) {
                      if (sheetContext.mounted) setSheetState(() => saving = false);
                      if (mounted) _showError(error.message);
                    }
                  },
                  icon: saving ? const SizedBox.square(dimension: 17, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.add_rounded),
                  label: Text(saving ? 'Saving parcel...' : 'Log parcel'),
                )),
              ],
            )),
          ),
        ),
      ),
    );
    location.dispose();
    if (created != null && mounted) {
      final parcel = _Parcel.fromJson(created);
      setState(() => data.parcels.insert(0, parcel));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Parcel logged.')));
    }
  }

  Future<void> _changeDeliveryStatus(_Delivery delivery, _GuardSnapshot data) async {
    final choices = _deliveryTransitions[delivery.status] ?? const <String>[];
    final status = await _chooseStatus('Change delivery status', choices);
    if (status == null) return;
    final now = DateTime.now().toIso8601String();
    try {
      final updatedJson = await _GuardApi.patch('/deliveries/${delivery.id}/status', {
        'status': status,
        'receivedAt': status == 'ARRIVED' ? now : null,
        'handedOverAt': status == 'PICKED_UP' || status == 'EXITED' ? now : null,
      }, widget.user.accessToken);
      if (!mounted) return;
      final updated = _Delivery.fromJson(updatedJson);
      setState(() {
        final index = data.deliveries.indexWhere((item) => item.id == delivery.id);
        if (index >= 0) data.deliveries[index] = updated;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delivery marked ${_humanize(status).toLowerCase()}.')));
    } on _GuardApiException catch (error) {
      if (mounted) _showError(error.message);
    }
  }

  Future<void> _changeParcelStatus(_Parcel parcel, _GuardSnapshot data) async {
    final status = await _chooseStatus('Update parcel status', const ['COLLECTED', 'DAMAGED', 'LOST']);
    if (status == null) return;
    try {
      final updatedJson = await _GuardApi.patch('/deliveries/parcels/${parcel.id}/status', {
        'status': status,
        'collectedBy': status == 'COLLECTED' ? widget.user.userId : null,
      }, widget.user.accessToken);
      if (!mounted) return;
      final updated = _Parcel.fromJson(updatedJson);
      setState(() {
        final index = data.parcels.indexWhere((item) => item.id == parcel.id);
        if (index >= 0) data.parcels[index] = updated;
        if (status == 'COLLECTED') {
          final deliveryIndex = data.deliveries.indexWhere((item) => item.id == parcel.deliveryId && (item.status == 'LEFT_AT_GATE' || item.status == 'OVERSTAY'));
          if (deliveryIndex >= 0) {
            final old = data.deliveries[deliveryIndex];
            data.deliveries[deliveryIndex] = _Delivery(
              id: old.id, unitId: old.unitId, type: old.type, status: 'PICKED_UP',
              visitorProfileId: old.visitorProfileId, courierName: old.courierName,
              createdAt: old.createdAt,
            );
          }
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Parcel marked ${_humanize(status).toLowerCase()}.')));
    } on _GuardApiException catch (error) {
      if (mounted) _showError(error.message);
    }
  }

  Future<String?> _chooseStatus(String title, List<String> choices) =>
      showModalBottomSheet<String>(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (sheetContext) => _surface(
          sheetContext,
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: _titleStyle(18)),
              const SizedBox(height: 10),
              ...choices.map((choice) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(_humanize(choice)),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => Navigator.pop(sheetContext, choice),
              )),
            ],
          ),
        ),
      );

  Widget _quickAction({
    required IconData icon,
    required Color iconBackground,
    required Color iconColor,
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
                color: iconBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
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
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 7, 8, 5),
        child: Row(
          children: [
            _navItem(Icons.shield_outlined, 'Overview', 0),
            _navItem(Icons.groups_2_outlined, 'Visitors', 1),
            _navItem(Icons.receipt_long_outlined, 'Gate log', 2),
            _navItem(Icons.local_shipping_outlined, 'Deliveries', 3),
            _navItem(Icons.person_outline_rounded, 'Profile', 4),
          ],
        ),
      ),
    ),
  );

  Widget _navItem(IconData icon, String label, int index) => Expanded(
    child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _selectTab(index),
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
    this.societyName,
    this.societyLogoUrl,
    this.accountPhotoUrl,
    required this.gates,
    required this.profiles,
    required this.destinations,
    required this.passes,
    required this.events,
    required this.deliveries,
    required this.parcels,
  });

  final String? societyName;
  final String? societyLogoUrl;
  final String? accountPhotoUrl;
  final List<_Gate> gates;
  final Map<String, _Visitor> profiles;
  final List<_GuardDestination> destinations;
  final List<_GuardPass> passes;
  final List<_GateEvent> events;
  final List<_Delivery> deliveries;
  final List<_Parcel> parcels;

  List<_GuardUnit> get units {
    final byId = <String, _GuardUnit>{};
    for (final destination in destinations) {
      byId.putIfAbsent(
        destination.unitId,
        () => _GuardUnit(destination.unitId, destination.homeLabel),
      );
    }
    return byId.values.toList();
  }

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

  String? destinationLabel(_GuardPass pass) {
    if (pass.unitId == null || pass.residentId == null) return null;
    for (final destination in destinations) {
      if (destination.unitId == pass.unitId &&
          destination.residentId == pass.residentId) {
        return destination.label;
      }
    }
    return null;
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

class _GuardDestination {
  const _GuardDestination({
    required this.unitId,
    required this.residentId,
    required this.label,
    required this.homeLabel,
  });

  final String unitId;
  final String residentId;
  final String label;
  final String homeLabel;

  factory _GuardDestination.fromJson(Map<String, dynamic> json) {
    final tower = '${json['tower_name'] ?? ''}'.trim();
    final flat = '${json['unit_number'] ?? ''}'.trim();
    final floor = '${json['floor_name'] ?? ''}'.trim();
    final home = [if (tower.isNotEmpty) tower, if (flat.isNotEmpty) flat]
        .join(' · ');
    final details = [if (floor.isNotEmpty) floor, if (home.isNotEmpty) home]
        .join(' · ');
    return _GuardDestination(
      unitId: '${json['unit_id'] ?? ''}',
      residentId: '${json['resident_id'] ?? ''}',
      label: '${details.isEmpty ? 'Flat' : details} — ${json['resident_name'] ?? 'Resident'}',
      homeLabel: details.isEmpty ? 'Flat' : details,
    );
  }
}

class _GuardUnit {
  const _GuardUnit(this.id, this.label);
  final String id;
  final String label;
}

class _Delivery {
  const _Delivery({
    required this.id,
    required this.unitId,
    required this.type,
    required this.status,
    this.visitorProfileId,
    this.courierName,
    this.createdAt,
  });
  final String id;
  final String unitId;
  final String type;
  final String status;
  final String? visitorProfileId;
  final String? courierName;
  final DateTime? createdAt;
  factory _Delivery.fromJson(Map<String, dynamic> json) => _Delivery(
    id: '${json['id'] ?? ''}',
    unitId: '${json['unit_id'] ?? ''}',
    type: '${json['delivery_type'] ?? 'OTHER'}'.toUpperCase(),
    status: '${json['status'] ?? 'EXPECTED'}'.toUpperCase(),
    visitorProfileId: json['visitor_profile_id']?.toString(),
    courierName: json['courier_name']?.toString(),
    createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
  );
}

class _Parcel {
  const _Parcel({
    required this.id,
    required this.deliveryId,
    required this.status,
    this.parcelCode,
    this.storageLocation,
    this.createdAt,
  });
  final String id;
  final String deliveryId;
  final String status;
  final String? parcelCode;
  final String? storageLocation;
  final DateTime? createdAt;
  factory _Parcel.fromJson(Map<String, dynamic> json) => _Parcel(
    id: '${json['id'] ?? ''}',
    deliveryId: '${json['delivery_id'] ?? ''}',
    status: '${json['status'] ?? 'STORED'}'.toUpperCase(),
    parcelCode: json['parcel_code']?.toString(),
    storageLocation: json['storage_location']?.toString(),
    createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
  );
}

class _GuardDeliverySnapshot {
  const _GuardDeliverySnapshot({required this.deliveries, required this.parcels});

  final List<_Delivery> deliveries;
  final List<_Parcel> parcels;
}

class _GuardPass {
  const _GuardPass({
    required this.id,
    required this.gateId,
    required this.profileId,
    required this.passNo,
    required this.status,
    required this.createdAt,
    this.unitId,
    this.residentId,
    this.residentDecision = 'NOT_REQUIRED',
  });
  final String id;
  final String gateId;
  final String profileId;
  final String passNo;
  final String status;
  final DateTime? createdAt;
  final String? unitId;
  final String? residentId;
  final String residentDecision;
  factory _GuardPass.fromJson(Map<String, dynamic> json) => _GuardPass(
    id: '${json['id'] ?? ''}',
    gateId: '${json['gate_id'] ?? ''}',
    profileId: '${json['visitor_profile_id'] ?? ''}',
    passNo: '${json['pass_no'] ?? '—'}',
    status: '${json['status'] ?? 'EXPECTED'}'.toUpperCase(),
    createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
    unitId: json['unit_id']?.toString(),
    residentId: json['resident_id']?.toString(),
    residentDecision:
        '${json['resident_decision'] ?? 'NOT_REQUIRED'}'.toUpperCase(),
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
  static Future<_GuardDeliverySnapshot> loadDeliveries(
    AuthenticatedUser user,
  ) async {
    final societyId = user.societyId;
    if (societyId == null || societyId.isEmpty) {
      throw const _GuardApiException(
        'This guard account is not linked to a society. Ask an administrator to check the staff assignment.',
      );
    }
    final results = await Future.wait([
      _get('/deliveries', user.accessToken, {'societyId': societyId}),
      _get('/deliveries/parcels', user.accessToken, {'societyId': societyId}),
    ]);
    return _GuardDeliverySnapshot(
      deliveries: results[0].map(_Delivery.fromJson).toList(),
      parcels: results[1].map(_Parcel.fromJson).toList(),
    );
  }

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
    final destinationsFuture = _get('/visitors/destinations', user.accessToken);
    final eventsFuture = _get('/visitors/gate-events', user.accessToken, {
      'societyId': societyId,
    });
    final deliveriesFuture = _get('/deliveries', user.accessToken, {
      'societyId': societyId,
    });
    final parcelsFuture = _get('/deliveries/parcels', user.accessToken, {
      'societyId': societyId,
    });
    final passFutures = gates.map(
      (gate) => _get('/visitors/passes', user.accessToken, {'gateId': gate.id}),
    );
    final results = await Future.wait([
      profilesFuture,
      destinationsFuture,
      eventsFuture,
      deliveriesFuture,
      parcelsFuture,
      ...passFutures,
    ]);
    final profiles = <String, _Visitor>{
      for (final row in results[0])
        if ('${row['id'] ?? ''}'.isNotEmpty)
          '${row['id']}': _Visitor.fromJson(row),
    };
    final destinations = results[1]
        .map(_GuardDestination.fromJson)
        .where((item) => item.unitId.isNotEmpty && item.residentId.isNotEmpty)
        .toList();
    final events = results[2].map(_GateEvent.fromJson).toList();
    final deliveries = results[3].map(_Delivery.fromJson).toList();
    final parcels = results[4].map(_Parcel.fromJson).toList();
    final passes = results
        .skip(5)
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
    String? societyName;
    String? societyLogoUrl;
    String? accountPhotoUrl;
    try {
      final dashboard = await _getObject(
        '/resident-dashboard',
        user.accessToken,
      );
      final society = dashboard['society'];
      final account = dashboard['account'];
      if (account is Map<String, dynamic>) {
        accountPhotoUrl = _imageUrl(account['photoUrl']);
      }
      if (society is Map<String, dynamic>) {
        societyName = _optionalString(society['name']);
        societyLogoUrl = _imageUrl(society['logoUrl']);
      }
    } catch (_) {
      // Society branding is optional; keep the dashboard usable if it is unavailable.
    }
    return _GuardSnapshot(
      societyName: societyName,
      societyLogoUrl: societyLogoUrl,
      accountPhotoUrl: accountPhotoUrl,
      gates: gates,
      profiles: profiles,
      destinations: destinations,
      passes: passes,
      events: events,
      deliveries: deliveries,
      parcels: parcels,
    );
  }

  static Future<List<_GuardPass>> loadPasses(
    AuthenticatedUser user,
    List<_Gate> gates,
  ) async {
    final responses = await Future.wait(
      gates.map(
        (gate) => _get('/visitors/passes', user.accessToken, {
          'gateId': gate.id,
        }),
      ),
    );
    return responses
        .expand((rows) => rows)
        .map(_GuardPass.fromJson)
        .toList();
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

  static Future<Map<String, dynamic>> _getObject(
    String path,
    String token,
  ) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_apiBaseUrl$path'),
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
          body['message']?.toString() ?? 'Could not load society details.',
        );
      }
      final data = body['data'];
      return data is Map<String, dynamic> ? data : const {};
    } on _GuardApiException {
      rethrow;
    } on http.ClientException {
      throw const _GuardApiException('Cannot reach the society details service.');
    } on TimeoutException {
      throw const _GuardApiException('Society details request timed out.');
    } on FormatException {
      throw const _GuardApiException('Society details response was invalid.');
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

Widget _styledDropdownField<T>({
  required T? value,
  required InputDecoration decoration,
  required List<DropdownMenuItem<T>> items,
  required ValueChanged<T?> onChanged,
  String? hint,
  String? Function(T?)? validator,
}) => _StyledDropdownField<T>(
  value: value,
  decoration: decoration,
  items: items,
  onChanged: onChanged,
  hint: hint,
  validator: validator,
);

class _StyledDropdownField<T> extends StatefulWidget {
  const _StyledDropdownField({
    required this.value,
    required this.decoration,
    required this.items,
    required this.onChanged,
    this.hint,
    this.validator,
  });

  final T? value;
  final InputDecoration decoration;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? hint;
  final String? Function(T?)? validator;

  @override
  State<_StyledDropdownField<T>> createState() =>
      _StyledDropdownFieldState<T>();
}

class _StyledDropdownFieldState<T> extends State<_StyledDropdownField<T>> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) => FormField<T>(
    initialValue: widget.value,
    validator: widget.validator,
    builder: (field) {
      DropdownMenuItem<T>? selectedItem;
      for (final item in widget.items) {
        if (item.value == field.value) {
          selectedItem = item;
          break;
        }
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: widget.items.isEmpty
                  ? null
                  : () => setState(() => _expanded = !_expanded),
              child: InputDecorator(
                decoration: widget.decoration.copyWith(
                  errorText: field.errorText,
                  suffixIcon: Icon(
                    _expanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: const Color(0xFF76519A),
                  ),
                ),
                child: DefaultTextStyle.merge(
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: selectedItem == null
                        ? AppColors.muted
                        : AppColors.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  child: selectedItem?.child ?? Text(widget.hint ?? ''),
                ),
              ),
            ),
          ),
          if (_expanded) ...[
            const SizedBox(height: 6),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE8E8EE)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1A000000),
                    blurRadius: 12,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var index = 0; index < widget.items.length; index++) ...[
                    if (index > 0)
                      const Divider(height: 1, indent: 12, endIndent: 12),
                    SizedBox(
                      height: 48,
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            final selected = widget.items[index].value;
                            field.didChange(selected);
                            setState(() => _expanded = false);
                            widget.onChanged(selected);
                          },
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                              ),
                              child: DefaultTextStyle.merge(
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: widget.items[index].value == field.value
                                      ? const Color(0xFF76519A)
                                      : AppColors.ink,
                                  fontSize: 14,
                                  fontWeight:
                                      widget.items[index].value == field.value
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                ),
                                child: widget.items[index].child,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      );
    },
  );
}

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
  _ => _humanize(status),
};
Color _statusColor(String status) => switch (status) {
  'ARRIVED' => _residentActionOrange,
  'EXPECTED' => _residentActionBlue,
  'INSIDE' => _residentActionGreen,
  'OVERSTAY' => const Color(0xFFD65A54),
  'EXITED' => const Color(0xFF67758E),
  _ => AppColors.muted,
};

String _humanize(String value) => value
    .toLowerCase()
    .split('_')
    .map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
    .join(' ');

Color _deliveryStatusColor(String status) => switch (status) {
  'EXPECTED' => _residentActionBlue,
  'ARRIVED' => _residentActionOrange,
  'INSIDE' => _residentActionGreen,
  'LEFT_AT_GATE' => _residentActionBlue,
  'PICKED_UP' => _residentActionGreen,
  'EXITED' => const Color(0xFF67758E),
  'OVERSTAY' => const Color(0xFFD65A54),
  'CANCELLED' => const Color(0xFFD65A54),
  _ => AppColors.muted,
};

Color _parcelStatusColor(String status) => switch (status) {
  'STORED' => _residentActionBlue,
  'COLLECTED' => _residentActionGreen,
  'DAMAGED' => _residentActionOrange,
  'LOST' => const Color(0xFFD65A54),
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
