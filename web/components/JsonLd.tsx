/**
 * Structured data (schema.org JSON-LD) for the homepage.
 *
 * Rendered as a single <script type="application/ld+json"> with a @graph, the
 * pattern Google and Next.js recommend. This is what makes the page eligible for
 * rich results and gives AI answer engines machine-readable facts about the
 * product (what it is, who it's for, its features, the FAQ).
 *
 * Server component — no "use client". Keep the facts here in sync with the
 * marketing copy and lib/faq.ts. Validate changes with Google's Rich Results
 * Test and the Schema Markup Validator.
 */
import { FAQS } from "@/lib/faq";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  CORE_FEATURES,
  url,
} from "@/lib/site";

export function JsonLd() {
  const graph = [
    {
      "@type": "Organization",
      "@id": url("/#organization"),
      name: SITE_NAME,
      url: SITE_URL,
      logo: url("/icon.svg"),
      description: SITE_DESCRIPTION,
      // sameAs: add brand social/profile URLs here once they exist (X, LinkedIn,
      // Crunchbase, etc.) — strengthens AI entity recognition of the brand.
    },
    {
      "@type": "WebSite",
      "@id": url("/#website"),
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": url("/#organization") },
      inLanguage: "en",
    },
    {
      // The product itself — what AI engines cite when asked for a focus /
      // single-tasking / distraction-capture app.
      "@type": "SoftwareApplication",
      "@id": url("/#app"),
      name: SITE_NAME,
      applicationCategory: "ProductivityApplication",
      operatingSystem: "iOS, Android",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": url("/#organization") },
      featureList: [
        "Single-tasking — stay in one lane per focus block with one outcome pinned",
        "Distraction capture — a 5-second parking lot for off-task thoughts, including from the lock screen",
        "Closure — end every block with a record of what got done",
        "Weekly plan with flexible per-lane hour budgets",
        "Weekly review: planned vs. actual per lane, with progress over perfection (70% is a win)",
      ],
      keywords: CORE_FEATURES.join(", "),
      offers: {
        // Free at launch. Update price/priceCurrency if monetization changes.
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      "@id": url("/#faq"),
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const json = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inject; there is no user input here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
