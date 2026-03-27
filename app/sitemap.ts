import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://voiceover-tools.com'

  return [
    {
      url: baseUrl,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/script-analysis`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/telephony-converter`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/teleprompter`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/acx-check`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
