import Image from "next/image";
import Link from "next/link";
import {
  Camera, ClipboardCheck, Factory, Fingerprint, Layers3, Monitor,
  PackageCheck, ScanLine, ShieldCheck, Smartphone, Truck,
} from "lucide-react";
import { MovSegBrand } from "@/components/MovSegBrand";
import styles from "./landing.module.css";

const checkpoints = [
  { icon: Factory, title: "Saída da fábrica", description: "Documente o móvel, a embalagem e o carregamento." },
  { icon: Truck, title: "Antes da entrega", description: "Registre as condições da carga durante o transporte." },
  { icon: ScanLine, title: "Chegada ao cliente", description: "Fotografe o estado do volume no recebimento." },
  { icon: ClipboardCheck, title: "Após a entrega", description: "Registre a condição final e sinalize eventuais avarias." },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <MovSegBrand />
          <nav aria-label="Navegação principal" className={styles.nav}>
            <a href="#fluxo">Como funciona</a>
            <a href="#plataformas">Plataformas</a>
          </nav>
          <Link href="/login" className={styles.headerAction}>Acessar portal</Link>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> Rastreabilidade moveleira</p>
            <h1 id="hero-title">Da fábrica<br className={styles.heroBreak} /> à entrega<span>.</span></h1>
            <p className={styles.lead}>Registre as condições de cada móvel em fotos e acompanhe o pedido em um único histórico.</p>
            <div className={styles.heroActions}>
              <Link href="/rastreio" className={styles.primaryAction}><ScanLine size={19} /> Consultar rastreio</Link>
              <a href="#fluxo" className={styles.secondaryAction}>Conhecer o fluxo</a>
            </div>
            <p className={styles.heroNote}>Uma solução para Móveis Matos &amp; Lopes.</p>
          </div>
          <figure className={styles.heroVisual}>
            <Image
              src="/movseg-expedicao.webp"
              alt="Funcionário fotografando a embalagem de um móvel na expedição"
              fill priority
              sizes="(max-width: 800px) 100vw, (max-width: 1220px) 52vw, 640px"
              className={styles.heroImage}
            />
            <figcaption className={styles.caption}>
              <span className={styles.captionIcon}><Camera size={20} /></span>
              <span><strong>Evidência fotográfica</strong><small>Registro na expedição</small></span>
            </figcaption>
          </figure>
        </section>

        <section id="fluxo" className={styles.flow} aria-labelledby="flow-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}><span /> Fluxo de coleta</p>
              <h2 id="flow-title">Cada etapa deixa um registro.</h2>
            </div>
            <p>Fabricação, inspeção e embalagem entram no histórico interno. As fotos nos pontos de passagem ajudam a localizar quando uma alteração foi detectada.</p>
          </div>
          <ol className={styles.checkpoints}>
            {checkpoints.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <span className={styles.checkpointIcon}><Icon size={23} strokeWidth={1.7} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="plataformas" className={styles.platforms} aria-labelledby="platform-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}><span /> Plataformas MovSeg</p>
              <h2 id="platform-title">Da coleta à análise.</h2>
            </div>
            <p>A equipe registra as condições do móvel no celular. A gestão consulta os registros e analisa as ocorrências por pedido.</p>
          </div>
          <div className={styles.platformGrid}>
            <article className={styles.platformCard}>
              <div className={styles.platformLabel}><Smartphone size={20} /> Aplicativo móvel</div>
              <h3>Registre no local.</h3>
              <p>Localize a unidade pela etiqueta, confirme a etapa e fotografe o móvel no momento da conferência.</p>
              <ul>
                <li><Camera size={17} /> Captura de fotos por etapa</li>
                <li><PackageCheck size={17} /> Conferência e relato de avarias</li>
              </ul>
            </article>
            <article className={`${styles.platformCard} ${styles.portalCard}`}>
              <div className={styles.platformLabel}><Monitor size={20} /> Portal web</div>
              <h3>Acompanhe por pedido.</h3>
              <p>Veja as unidades, compare as evidências ao longo do trajeto e consulte os pareceres de assistência.</p>
              <ul>
                <li><Layers3 size={17} /> Histórico de etapas por unidade</li>
                <li><Fingerprint size={17} /> Verificação de integridade</li>
              </ul>
              <Link href="/login" className={styles.portalAction}>Acessar portal</Link>
            </article>
          </div>
        </section>

        <section className={styles.lookup} aria-labelledby="lookup-title">
          <span className={styles.lookupIcon}><ShieldCheck size={28} strokeWidth={1.65} /></span>
          <div>
            <h2 id="lookup-title">Tem o código da etiqueta?</h2>
            <p>Consulte as etapas registradas do seu móvel.</p>
          </div>
          <Link href="/rastreio" className={styles.primaryAction}>Consultar rastreio</Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <MovSegBrand />
          <p>Móveis Matos &amp; Lopes · Projeto Integrador SENAI Ponte Nova</p>
        </div>
      </footer>
    </div>
  );
}
