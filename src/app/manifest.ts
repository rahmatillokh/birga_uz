import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YuniQo — Har bir bola uchun imkoniyat",
    short_name: "YuniQo",
    description: "Bolaning rivojlanishini baholash, individual reja, AI mashqlar, mutaxassislar va bepul tuman sessiyalari",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f8fd",
    theme_color: "#0ea5e9",
    lang: "uz",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
