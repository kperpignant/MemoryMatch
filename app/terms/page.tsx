import { LegalPageShell } from '@/components/legal/legal-page-shell'

export const metadata = {
  title: 'Terms of Service — MemoryMatch',
}

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" updated="June 28, 2026">
      <p>
        MemoryMatch is a dating and social-discovery app for adults (18+) who want to connect
        through memory reels and vibe pages instead of endless swiping. By using MemoryMatch,
        you agree to these terms.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account. We may suspend or remove
        accounts that violate these terms or our Community Guidelines.
      </p>

      <h2>Your content</h2>
      <p>
        You own the photos and text you upload. You grant MemoryMatch a limited license to
        host, display, and process that content so the app can work (for example, showing
        your memory reel to other members). Don&apos;t upload content you don&apos;t have
        rights to, or anything illegal, harmful, or hateful.
      </p>

      <h2>Conduct</h2>
      <ul>
        <li>Be respectful. Harassment, spam, impersonation, and underage use are not allowed.</li>
        <li>Use block and report tools when something feels off.</li>
        <li>Don&apos;t scrape, reverse-engineer, or abuse the service.</li>
      </ul>

      <h2>No guarantees</h2>
      <p>
        MemoryMatch is provided &quot;as is.&quot; We don&apos;t guarantee matches, outcomes,
        or uninterrupted service. We&apos;re not a medical or therapeutic product.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after changes means you accept the updated
        terms. Material changes will be reflected on this page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Reach the MemoryMatch team through the contact channel
        listed on your hackathon / project page.
      </p>
    </LegalPageShell>
  )
}
