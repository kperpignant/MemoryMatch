import { LegalPageShell } from '@/components/legal/legal-page-shell'

export const metadata = {
  title: 'Community Guidelines — MemoryMatch',
}

export default function GuidelinesPage() {
  return (
    <LegalPageShell title="Community Guidelines" updated="June 28, 2026">
      <p>
        MemoryMatch is a low-pressure space to connect through stories, not scores. These
        guidelines help keep it that way.
      </p>

      <h2>Be kind, be real</h2>
      <ul>
        <li>Lead with honesty — your reel should reflect you, not a fantasy persona.</li>
        <li>No harassment, hate speech, threats, or repeated unwanted contact.</li>
        <li>Charms and likes are private by design — don&apos;t use them to pressure anyone.</li>
      </ul>

      <h2>Keep it 18+</h2>
      <p>
        MemoryMatch is for adults only. Don&apos;t misrepresent your age. Report anyone you
        believe is under 18.
      </p>

      <h2>Safe content</h2>
      <ul>
        <li>No illegal content, spam, scams, or impersonation.</li>
        <li>Don&apos;t post someone else&apos;s photos without permission.</li>
        <li>Explicit or violent content doesn&apos;t belong here.</li>
      </ul>

      <h2>When something feels off</h2>
      <p>
        Every Vibe Page and ReelChemistry screen has a ··· safety menu. You can{' '}
        <strong>report</strong> (we review; they won&apos;t know it was you) or{' '}
        <strong>block</strong> (instant mutual invisibility, match closes). Manage blocks
        anytime in Settings.
      </p>

      <h2>Enforcement</h2>
      <p>
        Reports are reviewed by the team. We may warn, suspend, or remove accounts that break
        these guidelines. Serious violations may be referred to appropriate authorities.
      </p>

      <h2>Our vibe</h2>
      <p>
        Shy, creative, nostalgic, tech-minded — there&apos;s room for all of it. If you&apos;re
        not sure whether something fits, err on the side of warmth and respect.
      </p>
    </LegalPageShell>
  )
}
