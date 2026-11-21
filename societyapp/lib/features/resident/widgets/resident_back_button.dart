import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';

class ResidentBackButton extends StatelessWidget {
  const ResidentBackButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: 'Back',
    onPressed: onPressed,
    icon: const Icon(Icons.arrow_back_rounded),
    iconSize: 20,
    color: AppColors.ink,
    visualDensity: VisualDensity.compact,
    constraints: const BoxConstraints.tightFor(width: 40, height: 40),
    padding: EdgeInsets.zero,
  );
}
