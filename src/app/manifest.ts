import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Delivery Rider",
    short_name: "Rider",
    description: "Panel del repartidor para gestionar pedidos y estados de entrega.",
    start_url: "/rider",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  }
}
