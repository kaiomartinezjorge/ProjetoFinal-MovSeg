import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/movseg_models.dart';
import '../services/api_client.dart';
import '../theme/deepsea_theme.dart';

class AuditoriaHashScreen extends StatefulWidget {
  final MovSegApiClient api;
  final TimelineUnidade timeline;

  const AuditoriaHashScreen({
    super.key,
    required this.api,
    required this.timeline,
  });

  @override
  State<AuditoriaHashScreen> createState() => _AuditoriaHashScreenState();
}

class _AuditoriaHashScreenState extends State<AuditoriaHashScreen> {
  late AuditoriaLedger _auditoria;
  bool _revalidando = false;

  @override
  void initState() {
    super.initState();
    _auditoria = widget.timeline.auditoria;
  }

  @override
  void didUpdateWidget(covariant AuditoriaHashScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.timeline != oldWidget.timeline) {
      _auditoria = widget.timeline.auditoria;
    }
  }

  Future<void> _revalidar() async {
    setState(() => _revalidando = true);
    try {
      final nova = await widget.api.revalidarLedger(widget.timeline.unidade.id);
      if (mounted) setState(() => _auditoria = nova);
    } catch (erro) {
      if (mounted) {
        final mensagem = erro.toString().replaceFirst('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mensagem)),
        );
      }
    } finally {
      if (mounted) setState(() => _revalidando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  children: [
                    Icon(
                      _auditoria.cadeiaIntegra
                          ? Icons.verified_user_rounded
                          : Icons.gpp_bad_rounded,
                      color: _auditoria.cadeiaIntegra
                          ? DeepSeaColors.success
                          : DeepSeaColors.error,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _auditoria.cadeiaIntegra
                          ? 'Cadeia de Custódia 100% Íntegra'
                          : 'Alerta: Divergência Criptográfica',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: DeepSeaColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'MERKLE ROOT: ${_auditoria.merkleRoot}',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: DeepSeaColors.secondaryCobalt,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _MiniMetric(
                      label: 'MARCOS',
                      value: '${_auditoria.totalMarcos} / 6',
                    ),
                    const SizedBox(width: 8),
                    _MiniMetric(
                      label: 'EVIDÊNCIAS',
                      value: '${_auditoria.totalEvidencias}',
                    ),
                    const SizedBox(width: 8),
                    _MiniMetric(
                      label: 'VALIDAÇÃO',
                      value: _auditoria.cadeiaIntegra ? '100%' : 'FALHA',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _revalidando ? null : _revalidar,
                  icon: const Icon(Icons.refresh_rounded),
                  label: Text(
                    _revalidando ? 'REVALIDANDO...' : 'REVALIDAR ÁRVORE AGORA',
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        const Text(
          'Ledger Encadeado (SHA-256)',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: DeepSeaColors.primary,
          ),
        ),
        const SizedBox(height: 8),
        ..._auditoria.blocos.map(
          (b) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '0${b.sequencia}. ${b.etapa}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        b.encadeamentoValido ? 'CONFERE ✓' : 'QUEBRADO',
                        style: TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: b.encadeamentoValido
                              ? DeepSeaColors.success
                              : DeepSeaColors.error,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: DeepSeaColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'HASH: ${b.hashArmazenado}',
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'PREV: ${b.hashAnterior}',
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            color: DeepSeaColors.secondaryContainer,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    b.responsavel,
                    style: const TextStyle(
                      fontSize: 11,
                      color: DeepSeaColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const Text(
                  'Consulta Pública Independente (Cliente)',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Mostre este QR Code ao destinatário na entrega para validar o histórico sem necessidade de login.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: DeepSeaColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                QrImageView(
                  data: _auditoria.codigoQr,
                  version: QrVersions.auto,
                  size: 140,
                ),
                const SizedBox(height: 6),
                Text(
                  _auditoria.codigoQr,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MiniMetric extends StatelessWidget {
  final String label;
  final String value;

  const _MiniMetric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: DeepSeaColors.surfaceLow,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 15,
                color: DeepSeaColors.primary,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: DeepSeaColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
