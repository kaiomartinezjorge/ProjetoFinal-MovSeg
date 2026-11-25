import 'package:flutter/material.dart';
import '../models/movseg_models.dart';
import '../theme/deepsea_theme.dart';

class ChecklistEntregaScreen extends StatefulWidget {
  final TimelineUnidade timeline;
  final VoidCallback onIrParaRegistro;

  const ChecklistEntregaScreen({
    super.key,
    required this.timeline,
    required this.onIrParaRegistro,
  });

  @override
  State<ChecklistEntregaScreen> createState() => _ChecklistEntregaScreenState();
}

class _ChecklistEntregaScreenState extends State<ChecklistEntregaScreen> {
  final Map<String, bool> _respostas = {};

  @override
  void initState() {
    super.initState();
    for (final item in widget.timeline.unidade.produto.checklistPadrao) {
      _respostas[item.codigo] = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.timeline.unidade;
    final itens = u.produto.checklistPadrao;
    final aprovados = _respostas.values.where((v) => v).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: DeepSeaColors.surfaceHigh,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'LOTE ATIVO ${u.loteFabricacao}',
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Text(
                      '$aprovados / ${itens.length} CONFORMES',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: DeepSeaColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  u.produto.nome,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: DeepSeaColors.primary,
                  ),
                ),
                Text(
                  '${u.produto.linhaProducao} • Perfil Dinâmico ${u.produto.sku}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: DeepSeaColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (itens.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('Nenhum checklist específico cadastrado.'),
            ),
          )
        else
          ...itens.map((item) {
            final ok = _respostas[item.codigo] ?? true;
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: CheckboxListTile(
                value: ok,
                activeColor: DeepSeaColors.primaryContainer,
                onChanged: (v) =>
                    setState(() => _respostas[item.codigo] = v ?? false),
                title: Text(
                  item.item,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                subtitle: Text(
                  '${item.codigo} • ${item.categoria}\nCritério: ${item.criterio}',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            );
          }),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: widget.onIrParaRegistro,
          icon: const Icon(Icons.camera_alt_rounded),
          label: const Text('PROSSEGUIR PARA REGISTRO COM FOTO/VÍDEO'),
        ),
      ],
    );
  }
}
