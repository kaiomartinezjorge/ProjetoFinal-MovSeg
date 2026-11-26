import 'package:flutter/material.dart';

import '../models/movseg_models.dart';
import '../services/api_client.dart';
import '../widgets/movseg_logo.dart';
import 'auditoria_hash_screen.dart';
import 'marcos_timeline_screen.dart';
import 'novo_registro_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.api, required this.onLogout});

  final MovSegApiClient api;
  final VoidCallback onLogout;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  final _busca = TextEditingController();
  List<UnidadeResumo>? _resultados;
  TimelineUnidade? _timeline;
  String? _erro;
  bool _ocupado = false;
  int _aba = 0;

  @override
  void dispose() {
    _busca.dispose();
    super.dispose();
  }

  Future<void> _buscar({bool listarTodos = false}) async {
    final termo = _busca.text.trim();
    if ((!listarTodos && termo.isEmpty) || _ocupado) return;
    FocusScope.of(context).unfocus();
    setState(() {
      if (listarTodos) _busca.clear();
      _resultados = null;
      _erro = null;
      _ocupado = true;
    });
    try {
      final unidades =
          await widget.api.listarUnidades(busca: listarTodos ? null : termo);
      if (mounted) setState(() => _resultados = unidades);
    } catch (erro) {
      if (mounted) setState(() => _erro = _mensagem(erro));
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _abrir(String id, {int aba = 0}) async {
    if (_ocupado) return;
    setState(() {
      _ocupado = true;
      if (_timeline?.unidade.id != id) _timeline = null;
      _erro = null;
    });
    try {
      final timeline = await widget.api.buscarTimeline(id);
      if (mounted) {
        setState(() {
          _timeline = timeline;
          _aba = aba;
        });
      }
    } catch (erro) {
      if (mounted) {
        if (_timeline == null) {
          setState(() => _erro = _mensagem(erro));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(_mensagem(erro))),
          );
        }
      }
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  String _mensagem(Object erro) =>
      erro.toString().replaceFirst('Exception: ', '');

  @override
  Widget build(BuildContext context) {
    final timeline = _timeline;
    return Scaffold(
      appBar: AppBar(
        title: const MovSegLogo(width: 78, height: 50),
        actions: [
          if (timeline != null)
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              tooltip: 'Atualizar histórico',
              onPressed: _ocupado
                  ? null
                  : () => _abrir(timeline.unidade.id, aba: _aba),
            ),
          PopupMenuButton<String>(
            tooltip: 'Conta de trabalho',
            icon: const Icon(Icons.account_circle_outlined),
            onSelected: (_) async {
              await widget.api.sair();
              if (mounted) widget.onLogout();
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Text(widget.api.usuario?.nome ?? 'Conta de trabalho'),
              ),
              const PopupMenuItem(value: 'sair', child: Text('Sair da conta')),
            ],
          ),
        ],
      ),
      body: SafeArea(
        bottom: timeline == null,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: timeline == null ? _selecao() : _unidade(timeline),
          ),
        ),
      ),
      bottomNavigationBar: timeline == null
          ? null
          : NavigationBar(
              selectedIndex: _aba,
              onDestinationSelected: (indice) => setState(() => _aba = indice),
              destinations: const [
                NavigationDestination(
                    icon: Icon(Icons.add_a_photo_outlined), label: 'Registrar'),
                NavigationDestination(
                    icon: Icon(Icons.timeline_rounded), label: 'Histórico'),
                NavigationDestination(
                    icon: Icon(Icons.verified_user_outlined),
                    label: 'Auditoria'),
              ],
            ),
    );
  }

  Widget _selecao() {
    final tema = Theme.of(context);
    final resultados = _resultados;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Qual móvel você vai registrar?',
            style: tema.textTheme.headlineMedium
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        const Text('Use o código impresso na etiqueta ou o número do pedido.'),
        const SizedBox(height: 20),
        TextField(
          controller: _busca,
          enabled: !_ocupado,
          textCapitalization: TextCapitalization.characters,
          textInputAction: TextInputAction.search,
          onChanged: (_) => setState(() {}),
          onSubmitted: (_) => _buscar(),
          decoration: const InputDecoration(
            labelText: 'Etiqueta, série ou pedido',
            prefixIcon: Icon(Icons.qr_code_2_rounded),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed:
              _ocupado || _busca.text.trim().isEmpty ? null : () => _buscar(),
          icon: const Icon(Icons.search_rounded),
          label: const Text('Buscar móvel'),
        ),
        if (!_ocupado && (resultados == null || resultados.isEmpty))
          TextButton(
            onPressed: () => _buscar(listarTodos: true),
            child: const Text('Ver móveis cadastrados'),
          ),
        if (_ocupado) ...[
          const SizedBox(height: 18),
          const LinearProgressIndicator(semanticsLabel: 'Buscando unidade'),
        ],
        if (_erro != null) ...[
          const SizedBox(height: 15),
          Semantics(
              liveRegion: true,
              child: Text(_erro!,
                  style: TextStyle(color: tema.colorScheme.error))),
        ],
        if (resultados != null && resultados.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 18),
            child: Text(
                'Nenhuma unidade encontrada. Confira o código e tente novamente.'),
          ),
        if (resultados != null && resultados.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text('Toque no móvel para continuar',
                style: tema.textTheme.titleSmall),
          ),
        for (final unidade in resultados ?? const <UnidadeResumo>[])
          Card(
            margin: const EdgeInsets.only(top: 10),
            child: ListTile(
              title: Text(unidade.produto.nome,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle:
                  Text('${unidade.codigoQr}\nPedido ${unidade.ordemProducao}'),
              isThreeLine: true,
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: _ocupado ? null : () => _abrir(unidade.id),
            ),
          ),
      ],
    );
  }

  Widget _unidade(TimelineUnidade timeline) {
    final unidade = timeline.unidade;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Card(
            child: ListTile(
              leading: const Icon(Icons.inventory_2_outlined),
              title: Text(unidade.produto.nome,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle:
                  Text('${unidade.codigoQr} · Pedido ${unidade.ordemProducao}'),
              trailing: IconButton(
                tooltip: 'Trocar unidade',
                icon: const Icon(Icons.swap_horiz_rounded),
                onPressed: _ocupado
                    ? null
                    : () => setState(() {
                          _timeline = null;
                          _resultados = null;
                          _erro = null;
                          _busca.clear();
                        }),
              ),
            ),
          ),
        ),
        if (_ocupado)
          const LinearProgressIndicator(
              semanticsLabel: 'Atualizando histórico'),
        Expanded(
          child: AbsorbPointer(
            absorbing: _ocupado,
            child: IndexedStack(
              index: _aba,
              children: [
                NovoRegistroScreen(
                  key: ValueKey('${unidade.id}-${timeline.marcos.length}'),
                  api: widget.api,
                  timeline: timeline,
                  onRegistrado: () => _abrir(unidade.id),
                ),
                MarcosTimelineScreen(
                  timeline: timeline,
                  api: widget.api,
                  onRegistrarEntrega: () => setState(() => _aba = 0),
                  onAuditarHash: () => setState(() => _aba = 2),
                ),
                AuditoriaHashScreen(api: widget.api, timeline: timeline),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
