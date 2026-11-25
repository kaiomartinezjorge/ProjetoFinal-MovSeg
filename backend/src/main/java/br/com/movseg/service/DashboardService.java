package br.com.movseg.service;

import br.com.movseg.domain.entity.OcorrenciaAvaria;
import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.domain.enums.StatusOcorrencia;
import br.com.movseg.domain.enums.StatusUnidade;
import br.com.movseg.domain.repository.EvidenciaMidiaRepository;
import br.com.movseg.domain.repository.MarcoRastreabilidadeRepository;
import br.com.movseg.domain.repository.OcorrenciaAvariaRepository;
import br.com.movseg.domain.repository.UnidadeMovelRepository;
import br.com.movseg.dto.DashboardDtos;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UnidadeMovelRepository unidadeRepository;
    private final MarcoRastreabilidadeRepository marcoRepository;
    private final EvidenciaMidiaRepository evidenciaRepository;
    private final OcorrenciaAvariaRepository ocorrenciaRepository;

    public DashboardService(
            UnidadeMovelRepository unidadeRepository,
            MarcoRastreabilidadeRepository marcoRepository,
            EvidenciaMidiaRepository evidenciaRepository,
            OcorrenciaAvariaRepository ocorrenciaRepository
    ) {
        this.unidadeRepository = unidadeRepository;
        this.marcoRepository = marcoRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
    }

    @Transactional(readOnly = true)
    public DashboardDtos.IndicadoresResponse gerarIndicadores() {
        List<UnidadeMovel> unidades = unidadeRepository.findAll();
        List<OcorrenciaAvaria> ocorrencias = ocorrenciaRepository.findAllByOrderByAbertoEmDesc();

        long totalUnidades = unidades.size();
        long avariadas = unidades.stream().filter(u -> u.getStatusAtual() == StatusUnidade.AVARIADO).count();
        long emTransporte = unidades.stream().filter(u -> u.getStatusAtual() == StatusUnidade.EM_TRANSPORTE).count();
        long entregues = unidades.stream().filter(u -> u.getStatusAtual() == StatusUnidade.ENTREGUE).count();
        long intactas = totalUnidades - avariadas;

        long ocAbertas = ocorrencias.stream().filter(o -> o.getStatusChamado() == StatusOcorrencia.ABERTO).count();
        long ocAnalise = ocorrencias.stream().filter(o -> o.getStatusChamado() == StatusOcorrencia.EM_ANALISE).count();

        double taxaIntegridade = totalUnidades == 0 ? 100.0
                : Math.round(((double) intactas / totalUnidades) * 10000.0) / 100.0;

        List<DashboardDtos.ContagemItem> porOrigem = agrupar(
                ocorrencias.stream().map(o -> o.getEtapaResponsavelApurada().name()).toList()
        );
        List<DashboardDtos.ContagemItem> porLinha = agrupar(
                ocorrencias.stream().map(o -> o.getUnidadeMovel().getProduto().getLinhaProducao()).toList()
        );
        List<DashboardDtos.ContagemItem> porTransportadora = agrupar(
                unidades.stream()
                        .map(u -> u.getTransportadora() != null ? u.getTransportadora() : "Frota Própria")
                        .toList()
        );
        List<DashboardDtos.ContagemItem> porTipoAvaria = agrupar(
                ocorrencias.stream().map(OcorrenciaAvaria::getTipoAvaria).toList()
        );

        List<Map<String, Object>> ultimosEventos = marcoRepository.findTop15ByOrderByRegistradoEmDesc()
                .stream()
                .map(m -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("marcoId", m.getId());
                    item.put("codigoQr", m.getUnidadeMovel().getCodigoQr());
                    item.put("etapa", m.getEtapa().name());
                    item.put("resultado", m.getResultado().name());
                    item.put("responsavel", m.getResponsavel().getNome());
                    item.put("hashBloco", m.getHashBloco());
                    item.put("registradoEm", m.getRegistradoEm());
                    return item;
                })
                .toList();

        return new DashboardDtos.IndicadoresResponse(
                totalUnidades,
                intactas,
                emTransporte,
                entregues,
                avariadas,
                ocAbertas,
                ocAnalise,
                marcoRepository.count(),
                evidenciaRepository.count(),
                taxaIntegridade,
                porOrigem,
                porLinha,
                porTransportadora,
                porTipoAvaria,
                ultimosEventos
        );
    }

    private List<DashboardDtos.ContagemItem> agrupar(List<String> valores) {
        return valores.stream()
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new DashboardDtos.ContagemItem(e.getKey(), e.getValue()))
                .toList();
    }
}
