import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt, served at /robots.txt.
 *
 * We WANT to be crawled by both classic search engines and AI answer engines —
 * being citable by ChatGPT / Perplexity / Google AI Overviews is the whole point
 * of the AEO work. So we allow everyone to crawl the marketing content and only
 * disallow the auth-broker API routes (server-only, nothing to index).
 *
 * The AI bots are listed explicitly (even though "*" already allows them) so the
 * intent is obvious and so we have one obvious place to revoke access later.
 * Notable agents: GPTBot/OAI-SearchBot/ChatGPT-User (OpenAI), PerplexityBot,
 * ClaudeBot/Claude-Web/anthropic-ai (Anthropic), Google-Extended (Gemini/AI
 * Overviews training), Applebot-Extended, Amazonbot, Bytespider, CCBot.
 */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: "/api/",
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
