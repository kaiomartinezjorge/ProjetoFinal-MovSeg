import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Work_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MovSeg • Portal Administrativo & Rastreabilidade",
  description:
    "Sistema de rastreabilidade industrial, auditoria criptográfica e apuração de avarias da Móveis Matos & Lopes Ltda.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${workSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased bg-[#f4fafe] text-[#161c1f]">
        {children}
      </body>
    </html>
  );
}
