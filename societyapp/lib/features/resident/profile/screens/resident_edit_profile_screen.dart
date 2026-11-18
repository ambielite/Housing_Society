import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/profile_photo_picker.dart';

class ResidentEditProfileScreen extends StatefulWidget {
  const ResidentEditProfileScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<ResidentEditProfileScreen> createState() =>
      _ResidentEditProfileScreenState();
}

class _ResidentEditProfileScreenState extends State<ResidentEditProfileScreen> {
  static const _teal = Color(0xFF152B46);
  static const _gold = Color(0xFFFFD000);
  static const _cream = Color(0xFFF7FAFD);
  static const _muted = Color(0xFF718096);

  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  bool _saving = false;
  String? _error;
  String? _message;
  Timer? _messageTimer;
  Uint8List? _selectedPhotoBytes;
  String? _selectedPhotoName;

  @override
  void initState() {
    super.initState();
    final nameParts = widget.user.name.trim().split(RegExp(r'\s+'));
    _firstNameController = TextEditingController(
      text: widget.user.firstName?.isNotEmpty == true
          ? widget.user.firstName
          : (nameParts.isNotEmpty ? nameParts.first : ''),
    );
    _lastNameController = TextEditingController(
      text:
          widget.user.lastName ??
          (nameParts.length > 1 ? nameParts.skip(1).join(' ') : ''),
    );
    _emailController = TextEditingController(text: widget.user.email);
    _phoneController = TextEditingController(text: widget.user.phone ?? '');
  }

  @override
  void dispose() {
    _messageTimer?.cancel();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final nameParts = widget.user.name.trim().split(RegExp(r'\s+'));
    final originalFirstName = widget.user.firstName?.trim().isNotEmpty == true
        ? widget.user.firstName!.trim()
        : (nameParts.isNotEmpty ? nameParts.first : '');
    final originalLastName = widget.user.lastName?.trim().isNotEmpty == true
        ? widget.user.lastName!.trim()
        : (nameParts.length > 1 ? nameParts.skip(1).join(' ') : '');
    final unchanged =
        firstName == originalFirstName &&
        lastName == originalLastName &&
        email == widget.user.email.trim() &&
        phone == (widget.user.phone ?? '').trim() &&
        _selectedPhotoBytes == null;
    if (unchanged) {
      _messageTimer?.cancel();
      setState(() {
        _error = null;
        _message = 'No changes made.';
      });
      _messageTimer = Timer(const Duration(seconds: 2), () {
        if (mounted && _message == 'No changes made.') {
          setState(() => _message = null);
        }
      });
      return;
    }
    _messageTimer?.cancel();
    setState(() {
      _saving = true;
      _error = null;
      _message = null;
    });

    try {
      final response = await AuthApi.updateResidentProfile(
        accessToken: widget.user.accessToken,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        profilePictureBytes: _selectedPhotoBytes,
        profilePictureFileName: _selectedPhotoName,
      );
      if (!mounted) return;
      final updatedUser = widget.user.copyWith(
        name: [firstName, lastName].where((part) => part.isNotEmpty).join(' '),
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        profilePictureUrl:
            response['profile_picture_url']?.toString() ??
            widget.user.profilePictureUrl,
      );
      _saving = false;
      Navigator.of(context).pop(updatedUser);
    } on AuthException catch (exception) {
      if (mounted) {
        setState(() {
          _error = exception.message;
          _saving = false;
        });
      }
    } finally {
      if (mounted && _saving) setState(() => _saving = false);
    }
  }

  Future<void> _choosePhoto({required bool useCamera}) async {
    try {
      final image = await pickProfilePhoto(useCamera: useCamera);
      if (image == null || !mounted) return;
      final bytes = Uint8List.fromList(image.bytes);
      if (bytes.length > 5 * 1024 * 1024) {
        setState(() => _error = 'Choose a photo smaller than 5 MB.');
        return;
      }
      setState(() {
        _selectedPhotoBytes = bytes;
        _selectedPhotoName = image.name;
        _error = null;
        _message = null;
      });
      _messageTimer?.cancel();
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = kIsWeb
              ? 'Could not open or capture your photo: $error'
              : 'Could not open your photos. Please try again.';
        });
      }
    }
  }

  Future<void> _showPhotoOptions() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFFFFFEFB),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFD6DCE4),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Update profile photo', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _teal)),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: _teal),
                title: const Text('Choose from photos'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  _choosePhoto(useCamera: false);
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined, color: _teal),
                title: const Text('Take a photo'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  _choosePhoto(useCamera: true);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  ImageProvider<Object>? get _profileImage {
    if (_selectedPhotoBytes != null) return MemoryImage(_selectedPhotoBytes!);
    final path = widget.user.profilePictureUrl;
    if (path == null || path.trim().isEmpty) return null;
    final parsed = Uri.tryParse(path);
    if (parsed == null) return null;
    if (parsed.hasScheme) return NetworkImage(parsed.toString());
    const apiBase = String.fromEnvironment('API_BASE_URL');
    final base = apiBase.isEmpty ? 'http://localhost:5000/api/v1' : apiBase;
    return NetworkImage(Uri.parse(base).resolve(path).toString());
  }

  InputDecoration _decoration(String label, IconData icon) => InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon, color: _teal.withValues(alpha: .68)),
    filled: true,
    fillColor: const Color(0xFFFFFEFB),
    counterText: '',
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: Color(0xFFDDE6EF)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: Color(0xFFDDE6EF)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: _teal, width: 1.6),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _cream,
      appBar: AppBar(
        title: const Text(
          'Edit profile',
          style: TextStyle(fontWeight: FontWeight.w700, color: _teal),
        ),
        backgroundColor: _cream,
        foregroundColor: _teal,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(22, 24, 22, 22),
              decoration: BoxDecoration(
                color: _teal,
                borderRadius: BorderRadius.circular(26),
                boxShadow: [
                  BoxShadow(
                    color: _teal.withValues(alpha: .16),
                    blurRadius: 22,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _showPhotoOptions,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        CircleAvatar(
                          radius: 38,
                          backgroundColor: _gold,
                          backgroundImage: _profileImage,
                          child: _profileImage == null
                              ? const Icon(Icons.person_rounded, size: 40, color: _teal)
                              : null,
                        ),
                        Positioned(
                          right: -1,
                          bottom: -1,
                          child: Container(
                            width: 27,
                            height: 27,
                            decoration: BoxDecoration(
                              color: AppColors.indigo,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                            child: const Icon(
                              Icons.camera_alt_rounded,
                              size: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Your profile, your details',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Keep your community account up to date.',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: .78),
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 25),
            const Text(
              'PERSONAL INFORMATION',
              style: TextStyle(
                color: _muted,
                fontSize: 12,
                letterSpacing: 1.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFEFB),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFDDE6EF)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x10152B46),
                    blurRadius: 18,
                    offset: Offset(0, 7),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_message != null) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F5EC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFC8E6CF)),
                        ),
                        child: Text(
                          _message!,
                          style: const TextStyle(
                            color: Color(0xFF1E5631),
                            height: 1.35,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF0EF),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFF2CECA)),
                        ),
                        child: Text(
                          _error!,
                          style: const TextStyle(
                            color: Color(0xFF9E3434),
                            height: 1.35,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _firstNameController,
                      textCapitalization: TextCapitalization.words,
                      maxLength: 100,
                      decoration: _decoration(
                        'First name',
                        Icons.person_outline_rounded,
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? 'Enter your first name'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _lastNameController,
                      textCapitalization: TextCapitalization.words,
                      maxLength: 100,
                      decoration: _decoration(
                        'Last name',
                        Icons.badge_outlined,
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      maxLength: 255,
                      decoration: _decoration(
                        'Email address',
                        Icons.alternate_email_rounded,
                      ),
                      validator: (value) {
                        final email = value?.trim() ?? '';
                        return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                                .hasMatch(email)
                            ? null
                            : 'Enter a valid email address';
                      },
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      maxLength: 20,
                      decoration: _decoration(
                        'Phone number',
                        Icons.call_outlined,
                      ),
                      validator: (value) => (value?.trim().length ?? 0) > 20
                          ? 'Phone number must be 20 characters or fewer'
                          : null,
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 56,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(17),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        onPressed: _saving ? null : _save,
                        child: _saving
                            ? Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const SizedBox.square(
                                    dimension: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  const Text('Saving...'),
                                ],
                              )
                            : const Text('Save changes'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.shield_outlined, size: 16, color: _teal),
                const SizedBox(width: 7),
                Text(
                  'Your details are protected',
                  style: TextStyle(
                    color: _teal.withValues(alpha: .8),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
