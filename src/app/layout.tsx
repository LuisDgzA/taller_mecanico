import type { Metadata, Viewport } from "next";

import { AppFeedbackToaster } from "@/components/app-feedback-toaster";

import "./globals.css";

export const metadata: Metadata = {
  title: "Taller Mecánico",
  description: "Sistema de gestión del taller mecánico.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Taller",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
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
        <AppFeedbackToaster />
      </body>
    </html>
  );
}
