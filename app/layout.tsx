import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "FPCLA Church Admin",
  description: "FPCLA church administration system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "FPCLA Admin",
  },
};

export const viewport: Viewport = {
  themeColor: "#0369a1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
