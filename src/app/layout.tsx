import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Taller Mecánico",
  description: "Migración del sistema del taller a Next.js y Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
