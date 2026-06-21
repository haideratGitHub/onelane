import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with onelane — contact support, report a bug, request a feature, or learn how to delete your account and data.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  const mail = `mailto:${SUPPORT_EMAIL}`;
  return (
    <ContentPage
      title="Support"
      intro="Need a hand with onelane? Here's how to reach us and find answers fast."
    >
      <h2>Contact us</h2>
      <p>
        The fastest way to get help is email. Write to{" "}
        <a href={mail}>{SUPPORT_EMAIL}</a> and we&rsquo;ll get back to you, usually
        within 2&ndash;3 business days. To help us help you quickly, please include:
      </p>
      <ul>
        <li>Your device and OS (e.g. &ldquo;iPhone 15, iOS 18&rdquo; or &ldquo;Pixel 8, Android 15&rdquo;).</li>
        <li>The onelane app version (Profile screen).</li>
        <li>What you expected to happen and what actually happened.</li>
        <li>A screenshot if you can — it speeds things up.</li>
      </ul>

      <h2>Report a bug or request a feature</h2>
      <p>
        Found something broken, or have an idea that would make onelane better? We
        genuinely want to hear it. Email <a href={mail}>{SUPPORT_EMAIL}</a> with
        &ldquo;Bug&rdquo; or &ldquo;Feature&rdquo; in the subject line.
      </p>

      <h2>Common questions</h2>
      <p>
        Many questions are answered on our homepage&rsquo;s{" "}
        <Link href="/#faq">FAQ</Link> — what onelane is, the problem it solves, the
        core features (single-tasking, distraction capture, and closure), and how it
        differs from a time tracker.
      </p>

      <h3>How do I delete my account and data?</h3>
      <p>
        In the app, go to <strong>Profile → Danger zone → Delete account</strong>.
        This permanently deletes your profile and all of your lanes, weekly plans,
        focus sessions, and parked thoughts. It cannot be undone. If you can&rsquo;t
        access the app, email <a href={mail}>{SUPPORT_EMAIL}</a> and we&rsquo;ll remove
        your data for you.
      </p>

      <h3>How do I reset my password?</h3>
      <p>
        If you signed up with email and password, contact{" "}
        <a href={mail}>{SUPPORT_EMAIL}</a> for help recovering your account. If you
        signed in with Google, manage your password through your Google account.
      </p>

      <h3>Is my data private?</h3>
      <p>
        Yes. onelane is self-report, not surveillance — we don&rsquo;t monitor your
        device or other apps, and we never sell your data. See our{" "}
        <Link href="/privacy">Privacy Policy</Link> for the full details.
      </p>

      <h2>Privacy</h2>
      <p>
        For anything about your data or privacy rights, see the{" "}
        <Link href="/privacy">Privacy Policy</Link> or email{" "}
        <a href={mail}>{SUPPORT_EMAIL}</a>.
      </p>
    </ContentPage>
  );
}
