import 'package:flutter/material.dart';
import '../models/movseg_models.dart';
import '../services/api_client.dart';
import '../theme/deepsea_theme.dart';
import 'auditoria_hash_screen.dart';
import 'checklist_entrega_screen.dart';
import 'marcos_timeline_screen.dart';
import 'novo_registro_screen.dart';

class HomeShell extends StatefulWidget {
  final MovSegApiClient api;
  final VoidCallback onLogout;

  const HomeShell({super.key, required this.api, required this.onLogout});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tabIndex = 0;
  List<UnidadeResumo> _unidades = [];
  TimelineUnidade? _timeline;
  bool _loading = true;
  String? _erro;
  final _buscaCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _carregarUnidades();
  }

  Future<void> _carregarUnidades({String? codigo}) async {
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      final lista = await widget.api.listarUnidades();
      _unidades = lista;
      if (codigo != null && codigo.isNotEmpty) {
        _timeline = await widget.api.buscarTimelinePorCodigo(codigo);
      } else if (lista.isNotEmpty) {
        final alvoId = _timeline?.unidade.id ?? lista.first.id;
        _timeline = await widget.api.buscarTimeline(alvoId);
      }
    } catch (e) {
      _erro = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selecionarUnidade(String id) async {
    setState(() => _loading = true);
    try {
      _timeline = await widget.api.buscarTimeline(id);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.api.usuario;
    const titles = [
      'Marcos / Timeline',
      'Novo Registro',
      'Checklist Entrega',
      'Auditoria Hash',
    ];

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.circle, size: 8, color: DeepSeaColors.secondaryContainer),
                SizedBox(width: 6),
                Text(
                  'ONLINE - LEDGER SEGURO',
                  style: TextStyle(
                    fontSize: 10,
                    color: DeepSeaColors.secondaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            Text(
              titles[_tabIndex],
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Atualizar',
            icon: const Icon(Icons.sync_rounded),
            onPressed: () => _carregarUnidades(),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.person_pin_rounded),
            onSelected: (v) async {
              if (v == 'sair') {
                await widget.api.sair();
                widget.onLogout();
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Text('${user?.nome ?? ""} (${user?.matriculaOuClientId ?? ""})'),
              ),
              const PopupMenuItem(value: 'sair', child: Text('Encerrar Sessão')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra rápida de busca QR / Seleção de Unidade em Rota
          Container(
            color: DeepSeaColors.surfaceLow,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 40,
                    child: TextField(
                      controller: _buscaCtrl,
                      decoration: const InputDecoration(
                        hintText: 'QR Code ou Lote (ex: MOV-SEC-8893-XP)',
                        prefixIcon: Icon(Icons.qr_code_scanner, size: 18),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10),
                        border: OutlineInputBorder(),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                      onSubmitted: (v) => _carregarUnidades(codigo: v.trim()),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (_unidades.isNotEmpty)
                  DropdownButton<String>(
                    value: _timeline?.unidade.id,
                    underline: const SizedBox(),
                    items: _unidades
                        .map((u) => DropdownMenuItem(
                              value: u.id,
                              child: Text(
                                u.codigoQr,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ))
                        .toList(),
                    onChanged: (id) {
                      if (id != null) _selecionarUnidade(id);
                    },
                  ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _erro != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_erro!, textAlign: TextAlign.center),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: () => _carregarUnidades(),
                                child: const Text('Tentar Novamente'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _timeline == null
                        ? const Center(child: Text('Nenhuma unidade disponível.'))
                        : IndexedStack(
                            index: _tabIndex,
                            children: [
                              MarcosTimelineScreen(
                                timeline: _timeline!,
                                onRegistrarEntrega: () =>
                                    setState(() => _tabIndex = 1),
                                onAuditarHash: () =>
                                    setState(() => _tabIndex = 3),
                              ),
                              NovoRegistroScreen(
                                api: widget.api,
                                timeline: _timeline!,
                                onRegistrado: () async {
                                  await _carregarUnidades();
                                  if (mounted) setState(() => _tabIndex = 0);
                                },
                              ),
                              ChecklistEntregaScreen(
                                timeline: _timeline!,
                                onIrParaRegistro: () =>
                                    setState(() => _tabIndex = 1),
                              ),
                              AuditoriaHashScreen(
                                api: widget.api,
                                timeline: _timeline!,
                              ),
                            ],
                          ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (i) => setState(() => _tabIndex = i),
        backgroundColor: DeepSeaColors.primaryContainer,
        indicatorColor: DeepSeaColors.secondary,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.timeline_rounded, color: Colors.white70),
            selectedIcon: Icon(Icons.timeline_rounded, color: Colors.white),
            label: 'Marcos',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_a_photo_rounded, color: Colors.white70),
            selectedIcon: Icon(Icons.add_a_photo_rounded, color: Colors.white),
            label: 'Registro',
          ),
          NavigationDestination(
            icon: Icon(Icons.checklist_rounded, color: Colors.white70),
            selectedIcon: Icon(Icons.checklist_rounded, color: Colors.white),
            label: 'Checklist',
          ),
          NavigationDestination(
            icon: Icon(Icons.verified_user_rounded, color: Colors.white70),
            selectedIcon: Icon(Icons.verified_user_rounded, color: Colors.white),
            label: 'Hash',
          ),
        ],
      ),
    );
  }
}
