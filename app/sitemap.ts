import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rmsps.in'

  return [
    {
      url:             baseUrl,
      lastModified:    new Date(),
      changeFrequency: 'weekly',
      priority:        1,
    },
    {
      url:             `${baseUrl}/login`,
      lastModified:    new Date(),
      changeFrequency: 'yearly',
      priority:        0.5,
    },
  ]
}
