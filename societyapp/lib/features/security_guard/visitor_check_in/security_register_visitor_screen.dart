import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:housing_society_app/app/theme/app_colors.dart';
import 'package:housing_society_app/core/widgets/styled_dropdown_field.dart';

class SecurityVisitorDestination {
  const SecurityVisitorDestination({
    required this.unitId,
    required this.residentId,
    required this.label,
  });

  final String unitId;
  final String residentId;
  final String label;
}

class SecurityVisitorGate {
  const SecurityVisitorGate({required this.id, required this.name});

  final String id;
  final String name;
}

class SecurityVisitorRegistration {
  const SecurityVisitorRegistration({
    required this.name,
    required this.phone,
    required this.visitorType,
    this.employeeCode,
    required this.gateId,
    required this.unitId,
    required this.residentId,
    this.idType,
    this.vehicleNo,
    this.deliveryCompany,
  });

  final String name;
  final String phone;
  final String visitorType;
  final String? employeeCode;
  final String gateId;
  final String unitId;
  final String residentId;
  final String? idType;
  final String? vehicleNo;
  final String? deliveryCompany;
}

class SecurityRegisterVisitorScreen extends StatefulWidget {
  const SecurityRegisterVisitorScreen({
    required this.destinations,
    required this.gates,
    required this.onRegister,
    super.key,
  });

  final List<SecurityVisitorDestination> destinations;
  final List<SecurityVisitorGate> gates;
  final Future<Map<String, dynamic>> Function(SecurityVisitorRegistration)
  onRegister;

  @override
  State<SecurityRegisterVisitorScreen> createState() =>
      _SecurityRegisterVisitorScreenState();
}

class _SecurityRegisterVisitorScreenState
    extends State<SecurityRegisterVisitorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _employeeCode = TextEditingController();
  final _company = TextEditingController();
  final _vehicleNo = TextEditingController();
  String? _visitorType;
  String? _gateId;
  String? _idType;
  SecurityVisitorDestination? _destination;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _employeeCode.dispose();
    _company.dispose();
    _vehicleNo.dispose();
    super.dispose();
  }

  InputDecoration _decoration(String label, IconData icon) => InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon, color: const Color(0xFF9AAACA), size: 20),
    filled: true,
    fillColor: const Color(0xFFFCFCFF),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: Color(0xFFDCE3F1)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: Color(0xFFDCE3F1)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: AppColors.indigo, width: 1.5),
    ),
  );

  Widget _dropdown<T>({
    required String label,
    required IconData icon,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
    FormFieldValidator<T>? validator,
    String? hint,
  }) =>
      StyledDropdownField<T>(
        value: value,
        decoration: _decoration(label, icon),
        hint: hint,
        validator: validator,
        items: items,
        onChanged: _saving ? null : onChanged,
      );

  Future<void> _submit() async {
    if (widget.destinations.isEmpty) {
      _message('No active resident and flat assignments are available.');
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final result = await widget.onRegister(
        SecurityVisitorRegistration(
          name: _name.text.trim(),
          phone: _phone.text.trim(),
          visitorType: _visitorType!,
          employeeCode: _visitorType == 'MAID'
              ? _employeeCode.text.trim()
              : null,
          gateId: _gateId!,
          unitId: _destination!.unitId,
          residentId: _destination!.residentId,
          idType: _idType,
          vehicleNo: _vehicleNo.text.trim().toUpperCase(),
          deliveryCompany: _visitorType == 'DELIVERY_PERSON'
              ? _company.text.trim()
              : null,
        ),
      );
      if (mounted) Navigator.of(context).pop(result);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      final dynamic exception = error;
      String message = 'Could not register this visitor. Please try again.';
      try {
        final detail = exception.message?.toString();
        if (detail != null && detail.isNotEmpty) message = detail;
      } catch (_) {
        // Use the user-friendly fallback for unexpected errors.
      }
      _message(message);
    }
  }

  void _message(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.canvas,
    appBar: AppBar(
      title: const Text('Register visitor'),
      backgroundColor: AppColors.canvas,
      foregroundColor: AppColors.ink,
      elevation: 0,
    ),
    body: SafeArea(
      top: false,
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            constraints.maxWidth < 420 ? 14 : 24,
            10,
            constraints.maxWidth < 420 ? 14 : 24,
            24,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 620),
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.all(constraints.maxWidth < 420 ? 16 : 22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFE5EAF4)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x080F1A35),
                      blurRadius: 20,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Create a visitor pass',
                        style: TextStyle(
                          color: AppColors.ink,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        'Enter visitor details and select who they are visiting.',
                        style: TextStyle(color: Colors.black, height: 1.4),
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _name,
                        textCapitalization: TextCapitalization.words,
                        validator: (value) => value == null || value.trim().isEmpty
                            ? 'Enter the visitor name.'
                            : null,
                        decoration: _decoration(
                          'Visitor name',
                          Icons.person_outline_rounded,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(10),
                        ],
                        validator: (value) {
                          final phone = value?.trim() ?? '';
                          if (_visitorType == 'MAID' && phone.isEmpty) {
                            return 'Enter the Maid phone number.';
                          }
                          if (phone.isNotEmpty && !RegExp(r'^\d{10}$').hasMatch(phone)) {
                            return 'Enter a valid 10-digit phone number.';
                          }
                          return null;
                        },
                        decoration: _decoration(
                          _visitorType == 'MAID' ? 'Phone number' : 'Phone (optional)',
                          Icons.phone_outlined,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _dropdown<String>(
                        label: 'Visitor type',
                        icon: Icons.category_outlined,
                        value: _visitorType,
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
                          DropdownMenuItem(value: 'MAID', child: Text('Maid')),
                          DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                        ],
                        onChanged: (value) => setState(() {
                          _visitorType = value;
                          if (value != 'DELIVERY_PERSON') _company.clear();
                          if (value != 'MAID') _employeeCode.clear();
                        }),
                      ),
                      if (_visitorType == 'MAID') ...[
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _employeeCode,
                          textCapitalization: TextCapitalization.characters,
                          validator: (value) => value == null || value.trim().isEmpty
                              ? 'Enter the Maid employee code.'
                              : null,
                          decoration: _decoration(
                            'Maid employee code',
                            Icons.badge_outlined,
                          ),
                        ),
                      ],
                      if (_visitorType == 'DELIVERY_PERSON') ...[
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _company,
                          validator: (value) => value == null || value.trim().isEmpty
                              ? 'Enter the delivery company.'
                              : null,
                          decoration: _decoration(
                            'Delivery company',
                            Icons.local_shipping_outlined,
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      _dropdown<String>(
                        label: 'ID proof type (optional)',
                        icon: Icons.badge_outlined,
                        value: _idType,
                        hint: 'Select ID proof type',
                        items: const [
                          DropdownMenuItem(value: 'AADHAAR', child: Text('Aadhaar')),
                          DropdownMenuItem(
                            value: 'DRIVING_LICENSE',
                            child: Text('Driving license'),
                          ),
                          DropdownMenuItem(value: 'PASSPORT', child: Text('Passport')),
                          DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                        ],
                        onChanged: (value) => setState(() => _idType = value),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _vehicleNo,
                        textCapitalization: TextCapitalization.characters,
                        decoration: _decoration(
                          'Vehicle number (optional)',
                          Icons.directions_car_outlined,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _dropdown<SecurityVisitorDestination>(
                        label: 'Visiting flat / resident',
                        icon: Icons.apartment_rounded,
                        value: _destination,
                        hint: 'Select flat or resident',
                        validator: (value) => value == null
                            ? 'Select the flat and resident being visited.'
                            : null,
                        items: widget.destinations
                            .map(
                              (destination) => DropdownMenuItem(
                                value: destination,
                                child: Text(
                                  destination.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) => setState(() => _destination = value),
                      ),
                      const SizedBox(height: 12),
                      _dropdown<String>(
                        label: 'Entry gate',
                        icon: Icons.door_front_door_outlined,
                        value: _gateId,
                        hint: 'Select entry gate',
                        validator: (value) => value == null
                            ? 'Select an entry gate.'
                            : null,
                        items: widget.gates
                            .map(
                              (gate) => DropdownMenuItem(
                                value: gate.id,
                                child: Text(
                                  gate.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) => setState(() => _gateId = value),
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        height: 50,
                        child: FilledButton.icon(
                          onPressed: _saving ? null : _submit,
                          icon: _saving
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.person_add_alt_1_rounded),
                          label: Text(
                            _saving ? 'Creating visitor pass...' : 'Create visitor pass',
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
      ),
    ),
  );
}
