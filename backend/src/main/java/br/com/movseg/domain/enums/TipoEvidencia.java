package br.com.movseg.domain.enums;

public enum TipoEvidencia {
    FOTO_PRODUTO,
    FOTO_EMBALAGEM,
    FOTO_LACRE,
    FOTO_CARGA,
    FOTO_ENTREGA,
    FOTO_AVARIA,
    VIDEO_TRANSPORTE,
    VIDEO_ENTREGA,
    VIDEO_AVARIA,
    TERMO_ASSINADO;

    public boolean isVideo() {
        return this == VIDEO_TRANSPORTE || this == VIDEO_ENTREGA || this == VIDEO_AVARIA;
    }
}
