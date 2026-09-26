import type { NextConfig } from "next";

/**
 * Deploy sxemasi:
 *  - Frontend — Vercel. `API_PROXY_URL` o‘rnatilsa, barcha /api/* so‘rovlari VPS’dagi serverga proksi qilinadi
 *    (ma’lumotlar bazasi, Telegram bot va bildirishnomalar o‘sha yerda — Vercel serverless’da fayl saqlanmaydi).
 *  - VPS — `npm run start:all` (API + JSON-baza + bot). U yerda API_PROXY_URL o‘rnatilmaydi.
 */
const apiProxy = process.env.API_PROXY_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Telegram Mini App’ni tunnel (cloudflared / ngrok) orqali dev rejimda sinash uchun
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.loca.lt"],
  devIndicators: false,
  async rewrites() {
    if (!apiProxy) return [];
    return {
      beforeFiles: [{ source: "/api/:path*", destination: `${apiProxy}/api/:path*` }],
      afterFiles: [],
      fallback: [],
    };
  },
  // Eski havolalar (bot tugmalari, xatcho‘plar) yangi AI sahifasiga o‘tadi
  async redirects() {
    return [{ source: "/ustoz", destination: "/ai", permanent: false }];
  },
};

export default nextConfig;
