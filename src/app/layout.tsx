import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "YuniQo — Har bir bola uchun imkoniyat",
    template: "%s · YuniQo",
  },
  description:
    "YuniQo — bolaning rivojlanishini baholash, individual reja, AI mashqlar, logoped va defektolog mashg‘ulotlari, mutaxassislar va har bir tumandagi bepul sessiyalar platformasi.",
  applicationName: "YuniQo",
  metadataBase: new URL(process.env.WEBAPP_URL || "http://localhost:3000"),
  openGraph: {
    title: "YuniQo — Har bir bola uchun imkoniyat",
    description: "Baholash, individual reja, AI mashqlar, mutaxassislar va har bir tumanda bepul sessiyalar",
    images: [{ url: "/og.jpg", width: 640, height: 360, alt: "YuniQo" }],
    locale: "uz_UZ",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f8fd",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
