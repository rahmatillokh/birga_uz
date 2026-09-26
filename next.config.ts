import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Telegram Mini App’ni tunnel (cloudflared / ngrok) orqali dev rejimda sinash uchun
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.loca.lt"],
  devIndicators: false,
};

export default nextConfig;
