import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/movseg_models.dart';

class MovSegApiClient {
  static String get baseUrl {
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return envUrl;
    if (kIsWeb) return 'http://localhost:8080';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:8080'
        : 'http://localhost:8080';
  }

  static const _tokenKey = 'movseg_mobile_token';
  static const _userKey = 'movseg_mobile_user';

  String? _token;
  Usuario? _usuario;

  Usuario? get usuario => _usuario;
  bool get isAuthenticated => _token != null && _usuario != null;

  Future<void> carregarSessao() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    final raw = prefs.getString(_userKey);
    if (raw != null) {
      _usuario = Usuario.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    }
  }

  Future<void> sair() async {
    _token = null;
    _usuario = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  Future<Usuario> login(String login, String senha) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'login': login, 'senha': senha}),
    );
    if (res.statusCode >= 400) {
      throw Exception(_extrairErro(res.body, res.statusCode));
    }
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    final user = Usuario.fromJson(data['usuario'] as Map<String, dynamic>);
    if (user.perfil != 'ENTREGADOR' && user.perfil != 'INTEGRACAO_API') {
      throw Exception(
        'Este app é exclusivo para Entregadores. Perfil ${user.perfil} deve usar o Portal Web Administrativo.',
      );
    }
    _token = data['token'] as String;
    _usuario = user;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, _token!);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    return user;
  }

  Map<String, String> get _authHeaders => {
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<List<UnidadeResumo>> listarUnidades({String? busca}) async {
    final uri = Uri.parse('$baseUrl/api/v1/unidades').replace(
      queryParameters: (busca != null && busca.isNotEmpty) ? {'busca': busca} : null,
    );
    final res = await http.get(uri, headers: _authHeaders);
    if (res.statusCode >= 400) {
      throw Exception(_extrairErro(res.body, res.statusCode));
    }
    final list = jsonDecode(utf8.decode(res.bodyBytes)) as List;
    return list
        .map((e) => UnidadeResumo.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<TimelineUnidade> buscarTimelinePorCodigo(String codigo) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/unidades/codigo/${Uri.encodeComponent(codigo)}'),
      headers: _authHeaders,
    );
    if (res.statusCode >= 400) {
      throw Exception(_extrairErro(res.body, res.statusCode));
    }
    return TimelineUnidade.fromJson(
      jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>,
    );
  }

  Future<TimelineUnidade> buscarTimeline(String unidadeId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/unidades/$unidadeId/timeline'),
      headers: _authHeaders,
    );
    if (res.statusCode >= 400) {
      throw Exception(_extrairErro(res.body, res.statusCode));
    }
    return TimelineUnidade.fromJson(
      jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>,
    );
  }

  Future<AuditoriaLedger> revalidarLedger(String unidadeId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/v1/unidades/$unidadeId/revalidar-ledger'),
      headers: _authHeaders,
    );
    if (res.statusCode >= 400) {
      throw Exception(_extrairErro(res.body, res.statusCode));
    }
    return AuditoriaLedger.fromJson(
      jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>,
    );
  }

  Future<MarcoRastreabilidade> registrarMarcoComEvidencias({
    required String unidadeId,
    required String etapa,
    required String resultado,
    required String localDescricao,
    required String observacoes,
    required Map<String, dynamic> checklistMetadados,
    required double? latitude,
    required double? longitude,
    required bool houveAvaria,
    String? tipoAvaria,
    String? descricaoAvaria,
    required List<EvidenciaLocalPayload> evidencias,
  }) async {
    final uri = Uri.parse(
      '$baseUrl/api/v1/unidades/$unidadeId/marcos-com-evidencias',
    );
    final req = http.MultipartRequest('POST', uri);
    req.headers.addAll(_authHeaders);

    final dados = jsonEncode({
      'etapa': etapa,
      'resultado': resultado,
      'localDescricao': localDescricao,
      'observacoes': observacoes,
      'checklistMetadados': checklistMetadados,
      'latitude': latitude,
      'longitude': longitude,
      'houveAvaria': houveAvaria,
      'tipoAvaria': tipoAvaria,
      'descricaoAvaria': descricaoAvaria,
    });

    req.files.add(http.MultipartFile.fromString(
      'dados',
      dados,
      contentType: MediaType('application', 'json'),
    ));

    for (final ev in evidencias) {
      final parts = ev.mimeType.split('/');
      req.files.add(http.MultipartFile.fromBytes(
        'arquivos',
        ev.bytes,
        filename: ev.filename,
        contentType: MediaType(parts[0], parts.length > 1 ? parts[1] : 'octet-stream'),
      ));
      req.fields['tipos'] = ev.tipoEvidencia;
      req.fields['legendas'] = ev.legenda;
    }

    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode >= 400) {
      throw Exception(_extrairErro(res.body, res.statusCode));
    }
    return MarcoRastreabilidade.fromJson(
      jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>,
    );
  }

  String _extrairErro(String body, int status) {
    try {
      final decoded = jsonDecode(body) as Map<String, dynamic>;
      if (decoded['erro'] != null) return decoded['erro'].toString();
    } catch (_) {}
    return 'Erro HTTP $status';
  }
}

class EvidenciaLocalPayload {
  final Uint8List bytes;
  final String filename;
  final String mimeType;
  final String tipoEvidencia;
  final String legenda;
  final String sha256;

  EvidenciaLocalPayload({
    required this.bytes,
    required this.filename,
    required this.mimeType,
    required this.tipoEvidencia,
    required this.legenda,
    required this.sha256,
  });

  bool get isVideo => mimeType.startsWith('video/');
}
