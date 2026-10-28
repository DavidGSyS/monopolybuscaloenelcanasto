import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Canasto Bank | Banco Digital para Juegos de Mesa",
  description:
    "Reemplaza el dinero físico y al banquero tradicional en tus partidas de juegos de mesa. Tu mesa, tus reglas.",
  applicationName: "Canasto Bank",
  authors: [{ name: "Canasto Bank Team" }],
  keywords: [
    "banco digital",
    "juegos de mesa",
    "monopoly",
    "banquero digital",
    "finanzas",
    "pwa",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
      { url: "/icons/app-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/app-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-192.svg", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Canasto Bank",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://canastobank.app",
    title: "Canasto Bank | Tu mesa, tus reglas",
    description:
      "El banco digital que agiliza tus juegos de mesa sin discusiones ni billetes rotos.",
    siteName: "Canasto Bank",
  },
};

export const viewport: Viewport = {
  themeColor: "#6D28D9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface-bg text-slate-900 selection:bg-brand-purple-light selection:text-brand-purple">
        <main className="flex-1 w-full flex flex-col">{children}</main>
      </body>
    </html>
  );
}
