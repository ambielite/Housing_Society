import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Compact inline dropdown shared by resident and security forms.
class StyledDropdownField<T> extends StatefulWidget {
  const StyledDropdownField({
    super.key,
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
  final ValueChanged<T?>? onChanged;
  final String? hint;
  final String? Function(T?)? validator;

  @override
  State<StyledDropdownField<T>> createState() => _StyledDropdownFieldState<T>();
}

class _StyledDropdownFieldState<T> extends State<StyledDropdownField<T>> {
  bool _expanded = false;

  @override
  void didUpdateWidget(covariant StyledDropdownField<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) _expanded = false;
  }

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
                  onTap: widget.items.isEmpty || widget.onChanged == null
                      ? null
                      : () => setState(() => _expanded = !_expanded),
                  child: InputDecorator(
                    decoration: widget.decoration.copyWith(
                      errorText: field.errorText,
                      suffixIcon: Icon(
                        _expanded
                            ? Icons.keyboard_arrow_up_rounded
                            : Icons.keyboard_arrow_down_rounded,
                        color: AppColors.indigo,
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
                const SizedBox(height: 7),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  constraints: const BoxConstraints(maxHeight: 240),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE3E7F0)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x160F172A),
                        blurRadius: 16,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          for (var index = 0;
                              index < widget.items.length;
                              index++) ...[
                            if (index > 0)
                              const Divider(
                                height: 1,
                                thickness: 1,
                                indent: 12,
                                endIndent: 12,
                                color: Color(0xFFF0F2F6),
                              ),
                            _DropdownOption<T>(
                              item: widget.items[index],
                              selected: widget.items[index].value == field.value,
                              onTap: () {
                                final selected = widget.items[index].value;
                                field.didChange(selected);
                                setState(() => _expanded = false);
                                widget.onChanged?.call(selected);
                              },
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ],
          );
        },
      );
}

class _DropdownOption<T> extends StatelessWidget {
  const _DropdownOption({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final DropdownMenuItem<T> item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: selected ? const Color(0xFFF2F0FF) : Colors.white,
        child: InkWell(
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 50),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 11),
              child: Row(
                children: [
                  Expanded(
                    child: DefaultTextStyle.merge(
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: selected ? AppColors.indigo : AppColors.ink,
                        fontSize: 14,
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      ),
                      child: item.child,
                    ),
                  ),
                  if (selected) ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.check_rounded,
                        size: 18, color: AppColors.indigo),
                  ],
                ],
              ),
            ),
          ),
        ),
      );
}
