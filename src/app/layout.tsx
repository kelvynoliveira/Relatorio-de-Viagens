import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested/default
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TripStoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viagens Técnicas - Ânima",
  description: "Registro de deslocamentos e atendimentos técnicos",
  manifest: "/manifest.json", // PWA prep
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
          </TripStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
