import 'package:flutter/material.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'services/api_client.dart';
import 'theme/deepsea_theme.dart';

void main() {
  runApp(const MovSegApp());
}

class MovSegApp extends StatefulWidget {
  const MovSegApp({super.key});

  @override
  State<MovSegApp> createState() => _MovSegAppState();
}

class _MovSegAppState extends State<MovSegApp> {
  final MovSegApiClient _api = MovSegApiClient();
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _api.carregarSessao();
    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MovSeg',
      debugShowCheckedModeBanner: false,
      theme: buildDeepSeaTheme(),
      home: !_ready
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : (_api.isAuthenticated
              ? HomeShell(
                  api: _api,
                  onLogout: () => setState(() {}),
                )
              : LoginScreen(
                  api: _api,
                  onAuthenticated: () => setState(() {}),
                )),
    );
  }
}
