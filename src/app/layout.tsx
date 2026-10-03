import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inka Athletics — Canal Chatbot",
  description:
    "Frontend hexagonal del canal Chatbot: catálogo, carrito, checkout, pedidos, reclamos y devoluciones.",
};

// Server Component por defecto. Solo el shell interactivo es 'use client'.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`h-full ${inter.variable} ${oswald.variable}`}>
      <body className="min-h-full flex flex-col items-center justify-start py-4 px-3 font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
