import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Canasto Bank - Banco Digital",
    short_name: "Canasto Bank",
    description: "Banco digital para juegos de mesa. Tu mesa, tus reglas.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#6D28D9",
    orientation: "portrait",
    categories: ["games", "utilities", "entertainment"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
