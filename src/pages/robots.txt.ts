import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString() || 'https://biyuboxing.com';
  
  const robotsTxt = `User-agent: *
Allow: /

# AI and LLM Crawlers
User-agent: GPTBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: CCBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: ChatGPT-User
Allow: /

# Sitemap
Sitemap: ${siteUrl}sitemap.xml

# LLMs.txt
# See https://biyuboxing.com/llms.txt for AI-friendly site information`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    },
  });
};