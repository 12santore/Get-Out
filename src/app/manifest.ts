import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Get Out",
    short_name: "Get Out",
    description: "Fast, context-aware suggestions to help you get out and do something great.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7FB",
    theme_color: "#17C39B",
    icons: [
      {
        src: "/icons/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any"
      }
    ]
  };
}
