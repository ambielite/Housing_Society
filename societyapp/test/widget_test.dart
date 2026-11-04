import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:housing_society_app/app/app.dart';

void main() {
  testWidgets('Housing Society app starts', (WidgetTester tester) async {
    await tester.pumpWidget(const SocietyApp());

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('Housing Society'), findsOneWidget);
  });
}
