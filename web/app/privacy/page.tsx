import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How onelane handles your data: what we collect, how it's used and stored, your rights, and how to delete your account. onelane is self-report, not surveillance — we never sell your data.",
  alternates: { canonical: "/privacy" },
};

// ⚠️ This is a thorough, honest draft reflecting how the app actually works
// (Firebase Auth + Firestore, self-report data, Vercel analytics on the web).
// Before publishing, have it reviewed by counsel and fill in your legal entity
// name/address and a real support inbox (lib/site.ts → SUPPORT_EMAIL).
export default function PrivacyPage() {
  const mail = `mailto:${SUPPORT_EMAIL}`;
  return (
    <ContentPage
      title="Privacy Policy"
      updated="June 21, 2026"
      intro="onelane is built on a simple promise: it's a mirror and a guardrail, not surveillance. This policy explains exactly what data we collect, why, how it's stored, and the control you have over it."
    >
      <p>
        This Privacy Policy describes how onelane (&ldquo;onelane,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects, uses, and protects your
        information when you use the onelane mobile app (iOS and Android) and the
        website at onelane.app (together, the &ldquo;Service&rdquo;). By using the
        Service, you agree to this policy.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>
          We collect the <strong>account details</strong> you sign in with and the{" "}
          <strong>content you create</strong> in the app (your lanes, plans, focus
          sessions, notes, and parked thoughts).
        </li>
        <li>
          onelane is <strong>self-report</strong>. We do{" "}
          <strong>not</strong> monitor your device activity, track which other apps
          you use, read your screen, or run background surveillance.
        </li>
        <li>
          We <strong>never sell your data</strong> and we don&rsquo;t use it for
          third-party advertising.
        </li>
        <li>
          You can <strong>delete your account and all associated data</strong> at
          any time, from inside the app.
        </li>
      </ul>

      <h2>Information we collect</h2>

      <h3>Account information</h3>
      <p>
        When you create an account, we collect your <strong>email address</strong>.
        If you sign in with Google, we also receive the{" "}
        <strong>name and profile photo</strong> associated with that Google account.
        Authentication is handled by Google Firebase Authentication; we never see or
        store your Google password, and for email/password accounts your password is
        managed (hashed) by Firebase, not stored by us in readable form.
      </p>

      <h3>Content you create</h3>
      <p>
        The Service stores the productivity data you enter so it can sync across
        your devices, including:
      </p>
      <ul>
        <li>Your <strong>lanes</strong> (life domains) — names, colors, and weekly hour budgets.</li>
        <li>Your <strong>weekly plans</strong>, targets, and reflection answers.</li>
        <li>
          Your <strong>focus sessions</strong> — the intended outcome you set, start/stop
          timestamps, closure notes (what you got done), and any check-in responses.
        </li>
        <li>
          Your <strong>parking lot</strong> items — the text of distractions you capture.
        </li>
        <li>Your <strong>settings</strong> — e.g. week start, time zone, and quiet hours.</li>
      </ul>

      <h3>Information collected automatically</h3>
      <p>
        Our website (onelane.app) uses <strong>Vercel Web Analytics</strong>, which
        collects aggregate, privacy-friendly usage metrics (such as page views and
        referrers) <strong>without cookies</strong> and without building a profile of
        you. Our infrastructure providers also process basic technical data (such as
        IP address and device/app version) as a normal part of delivering and securing
        the Service. We do not use this to track you across other apps or websites.
      </p>

      <h3>What we do NOT collect</h3>
      <ul>
        <li>We do not monitor your device, your location, or your activity in other apps.</li>
        <li>We do not access your contacts, photos, microphone, or camera.</li>
        <li>We do not run third-party advertising or sell your data to data brokers.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To <strong>provide the Service</strong> — sign you in, store your plan and progress, and sync them across your devices.</li>
        <li>To <strong>send local reminders/check-ins</strong> that you enable (these are scheduled on your device — see &ldquo;Notifications&rdquo; below).</li>
        <li>To <strong>maintain, secure, and improve</strong> the Service and fix problems.</li>
        <li>To <strong>respond to you</strong> when you contact support.</li>
        <li>To <strong>comply with the law</strong> and enforce our terms.</li>
      </ul>

      <h2>Legal bases (EEA/UK users)</h2>
      <p>
        Where the GDPR or UK GDPR applies, we process your data to{" "}
        <strong>perform our contract</strong> with you (providing the app), based on
        our <strong>legitimate interests</strong> (keeping the Service secure and
        improving it), to <strong>comply with legal obligations</strong>, and with your{" "}
        <strong>consent</strong> where required (for example, optional notifications).
      </p>

      <h2>How your data is stored and who processes it</h2>
      <p>
        Your account and app data are stored in <strong>Google Firebase</strong>{" "}
        (Firebase Authentication and Cloud Firestore), running on Google Cloud
        infrastructure. Our website is hosted by <strong>Vercel</strong>. These
        providers act as our processors/sub-processors and are bound to protect your
        data. Access to your app data is restricted by security rules so that only
        your authenticated account can read or write it.
      </p>

      <h2>Sharing and disclosure</h2>
      <p>
        We do not sell your personal information. We share data only with the service
        providers above who help us run the Service, and only as needed to do so. We
        may disclose information if required by law, to protect our rights or users&rsquo;
        safety, or in connection with a business transfer (e.g. a merger), in which case
        we&rsquo;ll notify you.
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        We keep your data for as long as your account is active. You can{" "}
        <strong>delete your account at any time</strong> in the app under{" "}
        <strong>Profile → Danger zone → Delete account</strong>. This permanently
        removes your profile and all of your lanes, weeks, sessions, and parking-lot
        items, and cannot be undone. If you can&rsquo;t access the app, email us at{" "}
        <a href={mail}>{SUPPORT_EMAIL}</a> and we will delete your data on request.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct,
        export, or delete your personal data, and to object to or restrict certain
        processing. You can exercise most of these directly in the app, or contact us
        at <a href={mail}>{SUPPORT_EMAIL}</a> and we&rsquo;ll respond within a
        reasonable time. We will not discriminate against you for exercising these
        rights.
      </p>

      <h2>Security</h2>
      <p>
        We rely on industry-standard infrastructure (Google Firebase / Google Cloud),
        encryption in transit, and per-account access rules to protect your data. No
        method of transmission or storage is 100% secure, but we work to protect your
        information and limit access to it.
      </p>

      <h2>Notifications</h2>
      <p>
        onelane&rsquo;s reminders and check-ins are <strong>local notifications</strong>{" "}
        scheduled on your own device. We do not operate a server that pushes
        notifications to you, and you can turn them off in the app or your device
        settings at any time.
      </p>

      <h2>Children&rsquo;s privacy</h2>
      <p>
        onelane is not directed to children under 13 (or the minimum age in your
        country), and we do not knowingly collect data from them. If you believe a
        child has provided us data, contact us and we&rsquo;ll delete it.
      </p>

      <h2>International transfers</h2>
      <p>
        Your data may be processed in countries other than your own, including the
        United States, where our providers operate. Where required, we rely on
        appropriate safeguards for these transfers.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. We&rsquo;ll change the &ldquo;Last
        updated&rdquo; date above and, for material changes, provide a more prominent
        notice.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy or your data? Email{" "}
        <a href={mail}>{SUPPORT_EMAIL}</a>.
      </p>
    </ContentPage>
  );
}
