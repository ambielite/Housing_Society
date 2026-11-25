import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme/app_colors.dart';
import '../data/domestic_helpers_api.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');
String get _apiBaseUrl => _configuredApiBaseUrl.isNotEmpty
    ? _configuredApiBaseUrl
    : 'http://localhost:5000/api/v1';

class DomesticHelpersScreen extends StatefulWidget {
  const DomesticHelpersScreen({super.key, required this.accessToken});

  final String accessToken;

  @override
  State<DomesticHelpersScreen> createState() => _DomesticHelpersScreenState();
}

class _DomesticHelpersScreenState extends State<DomesticHelpersScreen> {
  late Future<List<DomesticHelper>> _helpersFuture;
  bool _refreshing = false;

  @override
  void initState() {
    super.initState();
    _helpersFuture = DomesticHelpersApi.list(widget.accessToken);
  }

  Future<void> _refresh() async {
    final next = DomesticHelpersApi.list(widget.accessToken);
    setState(() {
      _helpersFuture = next;
      _refreshing = true;
    });
    try {
      await next;
    } catch (_) {
      // FutureBuilder presents the request error in the page body.
    } finally {
      if (mounted) setState(() => _refreshing = false);
    }
  }

  String? _photoUrl(String? path) {
    if (path == null || path.trim().isEmpty) return null;
    final uri = Uri.tryParse(path);
    if (uri == null) return null;
    return uri.hasScheme ? uri.toString() : Uri.parse(_apiBaseUrl).resolve(path).toString();
  }

  Future<void> _call(String mobileNumber) async {
    final phone = mobileNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    if (phone.isEmpty) return;
    final launched = await launchUrl(
      Uri(scheme: 'tel', path: phone),
      mode: LaunchMode.externalApplication,
    );
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open the phone dialer.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFF5F7FB),
    appBar: AppBar(
      title: const Text('Staff directory'),
      backgroundColor: Colors.white,
      foregroundColor: AppColors.ink,
      elevation: 0,
      actions: [
        IconButton(
          tooltip: 'Refresh staff directory',
          onPressed: _refreshing ? null : _refresh,
          icon: _refreshing
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: 6),
      ],
    ),
    body: FutureBuilder<List<DomesticHelper>>(
      future: _helpersFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline_rounded, size: 40, color: Color(0xFF7B8496)),
                  const SizedBox(height: 12),
                  Text(
                    snapshot.error.toString().replaceFirst('Exception: ', ''),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  FilledButton.tonal(onPressed: _refresh, child: const Text('Try again')),
                ],
              ),
            ),
          );
        }
        final helpers = snapshot.data ?? const <DomesticHelper>[];
        if (helpers.isEmpty) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 170),
                Icon(Icons.people_outline_rounded, size: 44, color: Color(0xFF7B8496)),
                SizedBox(height: 12),
                Center(child: Text('No active staff records are currently available.')),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: helpers.length,
            separatorBuilder: (_, _) => const SizedBox(height: 11),
            itemBuilder: (context, index) => _helperCard(helpers[index]),
          ),
        );
      },
    ),
  );

  Widget _helperCard(DomesticHelper helper) {
    final photoUrl = _photoUrl(helper.profilePhotoUrl);
    final name = helper.name.trim().isEmpty ? 'Staff member' : helper.name;
    final staffType = helper.staffType
        .replaceAll('_', ' ')
        .toLowerCase()
        .split(' ')
        .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
        .join(' ');
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE6EAF1)),
        boxShadow: const [BoxShadow(color: Color(0x0A17233B), blurRadius: 14, offset: Offset(0, 5))],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 31,
            backgroundColor: const Color(0xFFECE9FF),
            child: photoUrl == null
                ? const Icon(Icons.person_rounded, size: 30, color: AppColors.indigo)
                : ClipOval(
                    child: Image.network(
                      photoUrl,
                      width: 62,
                      height: 62,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.person_rounded,
                        size: 30,
                        color: AppColors.indigo,
                      ),
                    ),
                  ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.ink, fontSize: 15, fontWeight: FontWeight.w800)),
                const SizedBox(height: 3),
                Text(staffType, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF8354B8), fontSize: 11, fontWeight: FontWeight.w700)),
                const SizedBox(height: 7),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, size: 15, color: AppColors.indigo),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        helper.mobileNumber.isEmpty ? 'Mobile number unavailable' : helper.mobileNumber,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xFF56627A), fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (helper.mobileNumber.isNotEmpty) ...[
            const SizedBox(width: 8),
            IconButton.filledTonal(
              tooltip: 'Call $name',
              onPressed: () => _call(helper.mobileNumber),
              icon: const Icon(Icons.call_rounded),
              style: IconButton.styleFrom(foregroundColor: const Color(0xFF16855D), backgroundColor: const Color(0xFFE4F7F1)),
            ),
          ],
        ],
      ),
    );
  }
}
