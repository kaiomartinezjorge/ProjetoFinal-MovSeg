import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:movseg_mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Renderiza tela de login do Entregador MovSeg', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const MovSegApp());
    await tester.pump();
    await tester.pumpAndSettle();

    expect(find.text('MovSeg Entregador'), findsOneWidget);
    expect(find.text('ENTRAR COMO ENTREGADOR'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
