import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://orlov-workshop.vercel.app",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://orlov-workshop.vercel.app/#about",
      lastModified: new Date(),
      changeFrequency: "quarterly",
      priority: 0.8,
    },
    {
      url: "https://orlov-workshop.vercel.app/#catalog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://orlov-workshop.vercel.app/#process",
      lastModified: new Date(),
      changeFrequency: "quarterly",
      priority: 0.7,
    },
    {
      url: "https://orlov-workshop.vercel.app/#contact",
      lastModified: new Date(),
      changeFrequency: "quarterly",
      priority: 0.8,
    },
  ];
}
