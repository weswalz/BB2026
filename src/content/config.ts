import { defineCollection, z } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    publishDate: z.date(),
    image: z.string(),
    imageAlt: z.string(),
    author: z.string().default('BiYu Promotions'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    // Press release specific fields
    location: z.string().default('Houston, TX'),
    forImmediateRelease: z.boolean().default(true),
    // SEO fields
    metaDescription: z.string().optional(),
    canonicalUrl: z.string().optional(),
  }),
});

export const collections = {
  news: newsCollection,
};