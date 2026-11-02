import type { Metadata, Viewport } from "next";
import { Inter, Teko } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const teko = Teko({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-teko",
  weight: ["700"],
});

export const viewport: Viewport = {
  themeColor: "#101010",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "GYMNOTES | Diário de Treinos, Nutrição e Evolução",
    template: "%s | GYMNOTES",
  },
  description:
    "Acompanhe suas cargas, repetições, metas nutricionais e compartilhe sua jornada fitness em tempo real com o GymNotes.",
  applicationName: "GymNotes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymNotes",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} ${teko.variable}`}>
      <body className="min-h-screen bg-background font-sans text-white antialiased selection:bg-brand selection:text-rich">
        <QueryProvider>
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
