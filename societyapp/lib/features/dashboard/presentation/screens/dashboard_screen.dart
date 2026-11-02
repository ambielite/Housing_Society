import 'package:flutter/material.dart';

import '../../../auth/data/auth_api.dart';
import '../../../resident/dashboard/screens/resident_home_screen.dart';

/// Keeps the existing post-login route while showing the resident experience.
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key, required this.user});

  final AuthenticatedUser user;

  @override
  Widget build(BuildContext context) => ResidentHomeScreen(user: user);
}
