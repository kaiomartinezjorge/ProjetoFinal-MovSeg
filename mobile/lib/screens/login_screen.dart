import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../theme/deepsea_theme.dart';

class LoginScreen extends StatefulWidget {
  final MovSegApiClient api;
  final VoidCallback onAuthenticated;

  const LoginScreen({
    super.key,
    required this.api,
    required this.onAuthenticated,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _loginCtrl = TextEditingController(text: 'entregador@movseg.com.br');
  final _senhaCtrl = TextEditingController(text: 'MovSeg@2026');
  bool _loading = false;
  String? _erro;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      await widget.api.login(_loginCtrl.text.trim(), _senhaCtrl.text);
      widget.onAuthenticated();
    } catch (e) {
      setState(() {
        _erro = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DeepSeaColors.primaryContainer,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: DeepSeaColors.primaryContainer,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.local_shipping_rounded,
                            color: DeepSeaColors.secondaryContainer,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'MovSeg Entregador',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: DeepSeaColors.primary,
                                ),
                              ),
                              Text(
                                'MÓVEIS MATOS & LOPES LTDA.',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: DeepSeaColors.secondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: DeepSeaColors.surfaceLow,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: DeepSeaColors.glacialBlue.withValues(alpha: 0.4),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.camera_alt_rounded,
                            size: 20,
                            color: DeepSeaColors.secondaryCobalt,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Canal oficial para fotografar e gravar vídeos dos móveis no transporte e entrega final.',
                              style: TextStyle(
                                fontSize: 12,
                                color: DeepSeaColors.onSurface,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_erro != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFDAD6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _erro!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF93000A),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextField(
                      controller: _loginCtrl,
                      decoration: const InputDecoration(
                        labelText: 'E-mail ou Matrícula (#MOT-0994)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _senhaCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Senha de Acesso',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: _loading ? null : _submit,
                      icon: const Icon(Icons.verified_user_rounded),
                      label: Text(
                        _loading ? 'AUTENTICANDO...' : 'ENTRAR COMO ENTREGADOR',
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Demo campo: entregador@movseg.com.br / MovSeg@2026',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        color: DeepSeaColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
