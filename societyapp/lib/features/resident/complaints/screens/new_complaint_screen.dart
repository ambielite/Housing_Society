import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/data/auth_api.dart';
import '../data/resident_complaints_api.dart';

class NewComplaintScreen extends StatefulWidget {
  const NewComplaintScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  State<NewComplaintScreen> createState() => _NewComplaintScreenState();
}

class _NewComplaintScreenState extends State<NewComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _descriptionController = TextEditingController();
  late Future<List<ComplaintCategory>> _categoriesFuture;
  String? _categoryId;
  String? _categoryName;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _categoriesFuture = ResidentComplaintsApi.listCategories(
      widget.user.accessToken,
    );
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final categoryId = _categoryId;
    if (categoryId == null) {
      setState(() => _error = 'Select a complaint category.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final complaint = await ResidentComplaintsApi.create(
        token: widget.user.accessToken,
        categoryId: categoryId,
        categoryName: _categoryName ?? 'Other',
        subject: _subjectController.text.trim(),
        description: _descriptionController.text.trim(),
      );
      if (mounted) Navigator.of(context).pop(complaint);
    } on ResidentComplaintException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFF5F7FB),
        appBar: AppBar(
          backgroundColor: const Color(0xFFF5F7FB),
          title: const Text('New complaint'),
        ),
        body: SafeArea(
          child: FutureBuilder<List<ComplaintCategory>>(
            future: _categoriesFuture,
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return _messageState(
                  snapshot.error.toString(),
                  retry: () => setState(() {
                    _categoriesFuture = ResidentComplaintsApi.listCategories(
                      widget.user.accessToken,
                    );
                  }),
                );
              }
              if (!snapshot.hasData) {
                return const Center(
                  child: CircularProgressIndicator(color: AppColors.indigo),
                );
              }
              final categories = snapshot.data!;
              if (categories.isEmpty) {
                return _messageState(
                  'The society has not set up any complaint categories yet.',
                );
              }
              final selectedId = categories.any((item) => item.id == _categoryId)
                  ? _categoryId
                  : categories.first.id;
              final selectedCategory = categories.firstWhere(
                (item) => item.id == selectedId,
              );
              _categoryId = selectedId;
              _categoryName = selectedCategory.name;
              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 560),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _introCard(),
                          const SizedBox(height: 18),
                          _fieldLabel('Category'),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            value: selectedId,
                            decoration: _decoration(
                              hint: 'Choose a category',
                              icon: Icons.category_outlined,
                            ),
                            items: categories
                                .map((category) => DropdownMenuItem(
                                      value: category.id,
                                      child: Text(category.name),
                                    ))
                                .toList(),
                            onChanged: _saving
                                ? null
                                : (value) => setState(() {
                                    _categoryId = value;
                                    _categoryName = categories
                                        .firstWhere((item) => item.id == value)
                                        .name;
                                  }),
                          ),
                          const SizedBox(height: 18),
                          _fieldLabel('Subject'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _subjectController,
                            maxLength: 255,
                            textCapitalization: TextCapitalization.sentences,
                            decoration: _decoration(
                              hint: 'Briefly describe the issue',
                              icon: Icons.short_text_rounded,
                            ),
                            validator: (value) => (value?.trim().isEmpty ?? true)
                                ? 'Enter a subject.'
                                : null,
                          ),
                          const SizedBox(height: 10),
                          _fieldLabel('Details'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _descriptionController,
                            maxLength: 5000,
                            minLines: 5,
                            maxLines: 9,
                            textCapitalization: TextCapitalization.sentences,
                            decoration: _decoration(
                              hint:
                                  'Tell the society team what happened and where.',
                              icon: Icons.notes_rounded,
                            ),
                            validator: (value) => (value?.trim().isEmpty ?? true)
                                ? 'Add some details about the complaint.'
                                : null,
                          ),
                          if (_error != null) ...[
                            const SizedBox(height: 8),
                            _errorBanner(_error!),
                          ],
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 52,
                            child: FilledButton.icon(
                              onPressed: _saving ? null : _submit,
                              icon: _saving
                                  ? const SizedBox.square(
                                      dimension: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.send_rounded, size: 18),
                              label: Text(
                                _saving ? 'Submitting…' : 'Submit complaint',
                              ),
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.indigo,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(15),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );

  Widget _introCard() => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            colors: [Color(0xFF6557E9), Color(0xFF8878F6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: const Row(
          children: [
            Icon(Icons.support_agent_rounded, color: Colors.white, size: 32),
            SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'We’re here to help',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Send your concern to the society team.',
                    style: TextStyle(color: Color(0xFFE7E4FF), fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _fieldLabel(String text) => Text(
        text,
        style: const TextStyle(
          color: AppColors.ink,
          fontSize: 13,
          fontWeight: FontWeight.w800,
        ),
      );

  InputDecoration _decoration({required String hint, required IconData icon}) =>
      InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: AppColors.muted),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE1E7F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE1E7F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.indigo, width: 1.5),
        ),
      );

  Widget _messageState(String message, {VoidCallback? retry}) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              if (retry != null) ...[
                const SizedBox(height: 14),
                FilledButton(onPressed: retry, child: const Text('Try again')),
              ],
            ],
          ),
        ),
      );

  Widget _errorBanner(String message) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFECEE),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          message,
          style: const TextStyle(color: Color(0xFF9D2635), fontSize: 12),
        ),
      );
}
