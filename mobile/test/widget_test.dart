import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:movseg_mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Acesso da equipe começa vazio e valida os campos',
      (tester) async {
    tester.view.physicalSize = const Size(360, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const MovSegApp());
    await tester.pumpAndSettle();

    expect(
      find.byWidgetPredicate(
        (widget) => widget is Image && widget.semanticLabel == 'MovSeg',
      ),
      findsOneWidget,
    );
    expect(find.text('Acesso da equipe'), findsOneWidget);
    final campos =
        tester.widgetList<EditableText>(find.byType(EditableText)).toList();
    expect(campos, hasLength(2));
    expect(campos.every((campo) => campo.controller.text.isEmpty), isTrue);
    expect(campos.last.obscureText, isTrue);

    final entrar = find.text('Entrar');
    await tester.ensureVisible(entrar);
    await tester.tap(entrar);
    await tester.pumpAndSettle();

    expect(find.text('Informe seu e-mail ou matrícula.'), findsOneWidget);
    expect(find.text('Informe sua senha.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
