import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested/default
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TripStoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import OfflineIndicator from "@/components/ui/offline-indicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viagens Técnicas Elite",
  description: "Plataforma Premium para Gestão de Viagens e Relatórios Técnicos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Viagens Elite",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <TripStoreProvider>
            <main className="min-h-screen bg-background text-foreground antialiased relative">
              {children}
            </main>
            <Toaster richColors position="top-center" />
            <OfflineIndicator />
          </TripStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
