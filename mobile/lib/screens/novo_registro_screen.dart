import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../models/movseg_models.dart';
import '../services/api_client.dart';
import '../theme/deepsea_theme.dart';

class NovoRegistroScreen extends StatefulWidget {
  final MovSegApiClient api;
  final TimelineUnidade timeline;
  final VoidCallback onRegistrado;

  const NovoRegistroScreen({
    super.key,
    required this.api,
    required this.timeline,
    required this.onRegistrado,
  });

  @override
  State<NovoRegistroScreen> createState() => _NovoRegistroScreenState();
}

class _NovoRegistroScreenState extends State<NovoRegistroScreen> {
  final _picker = ImagePicker();
  final _localCtrl = TextEditingController(
    text: 'Rodovia Presidente Dutra, KM 142 - Entrega em Rota',
  );
  final _obsCtrl = TextEditingController();
  final _tipoAvariaCtrl = TextEditingController();

  String _etapaSelecionada = 'TRANSPORTE';
  bool _houveAvaria = false;
  bool _posicaoVerticalOk = true;
  bool _lonasSemAtritoOk = true;
  bool _lacreIntegroOk = true;
  double? _latitude = -23.189240;
  double? _longitude = -45.884120;
  String _gpsStatus = '± 3m (GPS ativo)';
  bool _enviando = false;

  final List<EvidenciaLocalPayload> _evidencias = [];

  @override
  void initState() {
    super.initState();
    _capturarGps();
  }

  Future<void> _capturarGps() async {
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 4),
        ),
      );
      if (mounted) {
        setState(() {
          _latitude = pos.latitude;
          _longitude = pos.longitude;
          _gpsStatus = '± ${pos.accuracy.round()}m (GPS/GLONASS)';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _gpsStatus = 'Coordenadas de rota (fallback)');
      }
    }
  }

  Future<void> _capturarFoto(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    _adicionarMidia(
      bytes: bytes,
      filename: file.name,
      mimeType: 'image/jpeg',
      tipoEvidencia: _houveAvaria
          ? 'FOTO_AVARIA'
          : (_etapaSelecionada == 'RECEBIMENTO' ? 'FOTO_ENTREGA' : 'FOTO_CARGA'),
      legenda: _houveAvaria
          ? 'Foto de avaria em $_etapaSelecionada'
          : 'Foto oficial ($_etapaSelecionada)',
    );
  }

  Future<void> _gravarVideo(ImageSource source) async {
    final file = await _picker.pickVideo(
      source: source,
      maxDuration: const Duration(seconds: 45),
    );
    if (file == null) return;
    final bytes = await file.readAsBytes();
    _adicionarMidia(
      bytes: bytes,
      filename: file.name.endsWith('.mp4') ? file.name : '${file.name}.mp4',
      mimeType: 'video/mp4',
      tipoEvidencia: _houveAvaria
          ? 'VIDEO_AVARIA'
          : (_etapaSelecionada == 'RECEBIMENTO'
              ? 'VIDEO_ENTREGA'
              : 'VIDEO_TRANSPORTE'),
      legenda: 'Vídeo de vistoria ($_etapaSelecionada)',
    );
  }

  void _adicionarMidia({
    required Uint8List bytes,
    required String filename,
    required String mimeType,
    required String tipoEvidencia,
    required String legenda,
  }) {
    final hash = sha256.convert(bytes).toString();
    setState(() {
      _evidencias.add(EvidenciaLocalPayload(
        bytes: bytes,
        filename: filename,
        mimeType: mimeType,
        tipoEvidencia: tipoEvidencia,
        legenda: legenda,
        sha256: hash,
      ));
    });
  }

  Future<void> _enviarMarco() async {
    if (_evidencias.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Capture ao menos 1 foto ou vídeo do móvel antes de gerar o hash imutável.',
          ),
        ),
      );
      return;
    }

    setState(() => _enviando = true);
    try {
      await widget.api.registrarMarcoComEvidencias(
        unidadeId: widget.timeline.unidade.id,
        etapa: _etapaSelecionada,
        resultado: _houveAvaria ? 'REPROVADO' : 'APROVADO',
        localDescricao: _localCtrl.text.trim(),
        observacoes: _obsCtrl.text.trim(),
        checklistMetadados: {
          'posicao_vertical': _posicaoVerticalOk,
          'lonas_sem_atrito': _lonasSemAtritoOk,
          'lacre_integro': _lacreIntegroOk,
          'houve_impacto': _houveAvaria,
        },
        latitude: _latitude,
        longitude: _longitude,
        houveAvaria: _houveAvaria,
        tipoAvaria: _houveAvaria
            ? (_tipoAvariaCtrl.text.trim().isEmpty
                ? 'Avaria reportada pelo entregador'
                : _tipoAvariaCtrl.text.trim())
            : null,
        descricaoAvaria: _houveAvaria ? _obsCtrl.text.trim() : null,
        evidencias: _evidencias,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: DeepSeaColors.success,
            content: Text(
              'Marco $_etapaSelecionada selado no ledger SHA-256!',
            ),
          ),
        );
        widget.onRegistrado();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: DeepSeaColors.error,
            content: Text(e.toString().replaceFirst('Exception: ', '')),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.timeline.unidade;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'REGISTRAR NOVO MARCO OPERACIONAL',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: DeepSeaColors.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${u.produto.nome} • QR: ${u.codigoQr}',
          style: const TextStyle(
            fontSize: 12,
            color: DeepSeaColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 14),

        // Seletor de Etapa do Entregador (5 ou 6)
        Row(
          children: [
            Expanded(
              child: _EtapaButton(
                label: '5. Transporte',
                icon: Icons.local_shipping_rounded,
                selected: _etapaSelecionada == 'TRANSPORTE',
                onTap: () => setState(() => _etapaSelecionada = 'TRANSPORTE'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _EtapaButton(
                label: '6. Recebimento',
                icon: Icons.home_work_rounded,
                selected: _etapaSelecionada == 'RECEBIMENTO',
                onTap: () => setState(() => _etapaSelecionada = 'RECEBIMENTO'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Telemetria GPS
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'TELEMETRIA IMUTÁVEL DE CAMPO',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: DeepSeaColors.secondary,
                      ),
                    ),
                    Text(
                      _gpsStatus,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'GPS: ${_latitude?.toStringAsFixed(6)}, ${_longitude?.toStringAsFixed(6)}',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _localCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Local / Endereço da Ocorrência',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Captura Oficial de Fotos & Vídeos
        const Text(
          'EVIDÊNCIAS FOTOGRÁFICAS E VÍDEOS (OBRIGATÓRIO)',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: DeepSeaColors.primary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: DeepSeaColors.primaryContainer,
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: () => _capturarFoto(ImageSource.camera),
                icon: const Icon(Icons.photo_camera_rounded),
                label: const Text('Foto Câmera'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: DeepSeaColors.secondaryCobalt,
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: () => _gravarVideo(ImageSource.camera),
                icon: const Icon(Icons.videocam_rounded),
                label: const Text('Gravar Vídeo'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _capturarFoto(ImageSource.gallery),
                icon: const Icon(Icons.photo_library_outlined, size: 18),
                label: const Text('Foto Galeria'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _gravarVideo(ImageSource.gallery),
                icon: const Icon(Icons.video_library_outlined, size: 18),
                label: const Text('Vídeo Galeria'),
              ),
            ),
          ],
        ),

        if (_evidencias.isNotEmpty) ...[
          const SizedBox(height: 12),
          ..._evidencias.asMap().entries.map((entry) {
            final idx = entry.key;
            final ev = entry.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: ev.isVideo
                    ? const CircleAvatar(
                        backgroundColor: DeepSeaColors.primaryContainer,
                        child: Icon(Icons.videocam, color: Colors.white),
                      )
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.memory(
                          ev.bytes,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                        ),
                      ),
                title: Text(
                  '${ev.tipoEvidencia} (${(ev.bytes.length / 1024).toStringAsFixed(1)} KB)',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                subtitle: Text(
                  'SHA-256: ${ev.sha256.substring(0, 18)}...',
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 10),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline, color: DeepSeaColors.error),
                  onPressed: () => setState(() => _evidencias.removeAt(idx)),
                ),
              ),
            );
          }),
        ],
        const SizedBox(height: 14),

        // Checklist Rápido de Transporte/Entrega
        Card(
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('Posição vertical com cantoneiras'),
                value: _posicaoVerticalOk,
                onChanged: (v) => setState(() => _posicaoVerticalOk = v),
              ),
              SwitchListTile(
                title: const Text('Lonas e mantas sem atrito direto'),
                value: _lonasSemAtritoOk,
                onChanged: (v) => setState(() => _lonasSemAtritoOk = v),
              ),
              SwitchListTile(
                title: const Text('Lacre térmico / embalagem íntegros'),
                value: _lacreIntegroOk,
                onChanged: (v) => setState(() => _lacreIntegroOk = v),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Toggle Avaria
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Houve impacto ou dano aparente à carga?',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('NÃO (Sem Avarias)'),
                        selected: !_houveAvaria,
                        selectedColor: DeepSeaColors.success.withValues(alpha: 0.2),
                        onSelected: (_) => setState(() => _houveAvaria = false),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('SIM (Divergência)'),
                        selected: _houveAvaria,
                        selectedColor: DeepSeaColors.alert.withValues(alpha: 0.25),
                        onSelected: (_) => setState(() => _houveAvaria = true),
                      ),
                    ),
                  ],
                ),
                if (_houveAvaria) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _tipoAvariaCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Tipo da Avaria (ex: Quina amassada)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                TextField(
                  controller: _obsCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Observações da entrega / vistoria',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor:
                _houveAvaria ? DeepSeaColors.error : DeepSeaColors.primary,
          ),
          onPressed: _enviando ? null : _enviarMarco,
          icon: const Icon(Icons.verified_user_rounded),
          label: Text(
            _enviando
                ? 'SELANDO HASH SHA-256...'
                : (_houveAvaria
                    ? 'RELATAR DIVERGÊNCIA E SELAR HASH'
                    : 'CONFIRMAR E GERAR HASH IMUTÁVEL'),
          ),
        ),
      ],
    );
  }
}

class _EtapaButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _EtapaButton({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 52,
        decoration: BoxDecoration(
          color: selected
              ? DeepSeaColors.primaryContainer
              : DeepSeaColors.surfaceHigh,
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: selected
                  ? DeepSeaColors.secondaryContainer
                  : DeepSeaColors.onSurfaceVariant,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: selected
                      ? DeepSeaColors.secondaryContainer
                      : DeepSeaColors.onSurface,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
