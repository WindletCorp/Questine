import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { OfflineBanner } from "@/components/offline-banner";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Questine",
  description: "Your AI-powered personal operating system for productivity",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Questine",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
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
    <html lang="en">
      <body>
        <AuthProvider>
          <OfflineBanner />
          {children}
          <ServiceWorkerRegistrar />
        </AuthProvider>
      </body>
    </html>
  );
}
