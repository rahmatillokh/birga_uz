import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Telegram Mini App’ni tunnel (cloudflared / ngrok) orqali dev rejimda sinash uchun
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.loca.lt"],
  devIndicators: false,
  // Eski havolalar (bot tugmalari, xatcho‘plar) yangi AI sahifasiga o‘tadi
  async redirects() {
    return [{ source: "/ustoz", destination: "/ai", permanent: false }];
  },
};

export default nextConfig;
