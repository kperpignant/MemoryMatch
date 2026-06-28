import { LegalPageShell } from '@/components/legal/legal-page-shell'

export const metadata = {
  title: 'Privacy Policy — MemoryMatch',
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="June 28, 2026">
      <p>
        MemoryMatch respects your privacy. This policy describes what we collect, why we
        collect it, and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account info</strong> — email, display name, and date of birth (for the 18+
          gate), via Clerk authentication.
        </li>
        <li>
          <strong>Profile &amp; reel</strong> — username, bio, mood, interests, photos, captions,
          and profile beat choices you save to your Vibe Page.
        </li>
        <li>
          <strong>Location (optional)</strong> — city-level location if you choose to set it
          during onboarding (coarse coordinates for distance browse).
        </li>
        <li>
          <strong>Activity</strong> — likes, charms, messages, blocks, and reports needed to
          operate matching and safety features.
        </li>
        <li>
          <strong>Technical data</strong> — basic logs, health checks, and (in production)
          error/analytics data to keep the app running.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your data to run the app: show profiles, enable matching, enforce blocks,
        investigate reports, and improve reliability. We do not sell your personal data.
      </p>

      <h2>Where it&apos;s stored</h2>
      <p>
        Profile data is stored in Amazon Aurora PostgreSQL. Media uploads are stored in Vercel
        Blob. Authentication is handled by Clerk. Rate limiting may use Upstash Redis.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit your profile and reel anytime from your Vibe Page.</li>
        <li>Block users who you don&apos;t want to interact with.</li>
        <li>
          Delete your account from Settings — this removes your profile from browse and purges
          associated data per our deletion flow.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        Database connections use SSL in production. Secrets are kept in environment variables
        (not in source code). Only authorized server code accesses your data.
      </p>

      <h2>Updates</h2>
      <p>
        We may update this policy as the product evolves. The &quot;Last updated&quot; date at
        the top reflects the current version.
      </p>
    </LegalPageShell>
  )
}
