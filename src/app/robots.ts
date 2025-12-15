import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/.vercel/"],
    },
    sitemap: "https://orlov-workshop.vercel.app/sitemap.xml",
  };
}
