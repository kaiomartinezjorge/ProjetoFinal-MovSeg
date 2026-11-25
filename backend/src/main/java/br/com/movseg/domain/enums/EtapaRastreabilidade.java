package br.com.movseg.domain.enums;

public enum EtapaRastreabilidade {
    FABRICACAO(1),
    INSPECAO(2),
    EMBALAGEM(3),
    EXPEDICAO(4),
    TRANSPORTE(5),
    RECEBIMENTO(6);

    private final int ordem;

    EtapaRastreabilidade(int ordem) {
        this.ordem = ordem;
    }

    public int getOrdem() {
        return ordem;
    }

    public boolean isEtapaEntregaCampo() {
        return this == TRANSPORTE || this == RECEBIMENTO;
    }
}
