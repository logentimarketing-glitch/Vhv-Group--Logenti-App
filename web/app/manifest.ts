import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VHV Interno",
    short_name: "VHV",
    description: "Plataforma interna para administracion, reclutamiento, capacitacion y comunidad.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0a08",
    theme_color: "#d7a12e",
    orientation: "portrait",
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
    ],
  };
}
