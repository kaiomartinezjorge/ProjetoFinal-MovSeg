import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/deepsea_theme.dart';
import '../widgets/movseg_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.api,
    required this.onAuthenticated,
  });

  final MovSegApiClient api;
  final VoidCallback onAuthenticated;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _loginCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  bool _loading = false;
  bool _mostrarSenha = false;
  String? _erro;

  @override
  void dispose() {
    _loginCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading || !(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      await widget.api.login(_loginCtrl.text.trim(), _senhaCtrl.text);
      if (mounted) widget.onAuthenticated();
    } catch (erro) {
      if (!mounted) return;
      setState(() => _erro = erro.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      backgroundColor: DeepSeaColors.primary,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: (constraints.maxHeight - 56)
                    .clamp(0.0, double.infinity)
                    .toDouble(),
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: MovSegLogo(width: 118, height: 78),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: AutofillGroup(
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Semantics(
                                  header: true,
                                  child: Text(
                                    'Acesso da equipe',
                                    style:
                                        tema.textTheme.headlineSmall?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.6,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Entre para registrar fotos e acompanhar os móveis em cada etapa.',
                                  style: tema.textTheme.bodyLarge?.copyWith(
                                    color: DeepSeaColors.onSurfaceVariant,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                if (_erro != null) ...[
                                  Semantics(
                                    liveRegion: true,
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFBE9E6),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        _erro!,
                                        style: const TextStyle(
                                            color: DeepSeaColors.error),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                TextFormField(
                                  controller: _loginCtrl,
                                  enabled: !_loading,
                                  autofillHints: const [AutofillHints.username],
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  autocorrect: false,
                                  validator: (valor) =>
                                      valor == null || valor.trim().isEmpty
                                          ? 'Informe seu e-mail ou matrícula.'
                                          : null,
                                  decoration: const InputDecoration(
                                    labelText: 'E-mail ou matrícula',
                                    prefixIcon:
                                        Icon(Icons.person_outline_rounded),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _senhaCtrl,
                                  enabled: !_loading,
                                  autofillHints: const [AutofillHints.password],
                                  obscureText: !_mostrarSenha,
                                  enableSuggestions: false,
                                  autocorrect: false,
                                  textInputAction: TextInputAction.done,
                                  onFieldSubmitted: (_) => _submit(),
                                  validator: (valor) =>
                                      valor == null || valor.isEmpty
                                          ? 'Informe sua senha.'
                                          : null,
                                  decoration: InputDecoration(
                                    labelText: 'Senha',
                                    prefixIcon:
                                        const Icon(Icons.lock_outline_rounded),
                                    suffixIcon: IconButton(
                                      tooltip: _mostrarSenha
                                          ? 'Ocultar senha'
                                          : 'Mostrar senha',
                                      onPressed: () => setState(
                                          () => _mostrarSenha = !_mostrarSenha),
                                      icon: Icon(_mostrarSenha
                                          ? Icons.visibility_off_outlined
                                          : Icons.visibility_outlined),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 22),
                                ElevatedButton(
                                  onPressed: _loading ? null : _submit,
                                  child:
                                      Text(_loading ? 'Entrando…' : 'Entrar'),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        'Móveis Matos & Lopes',
                        style: tema.textTheme.bodyMedium
                            ?.copyWith(color: DeepSeaColors.secondaryContainer),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
