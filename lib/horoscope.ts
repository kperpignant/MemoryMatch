/**
 * Horoscope helpers — the "big three" (sun / moon / rising) plus a playful,
 * element-based compatibility used on Vibe Pages. Sign ids are lowercase and
 * stored as TEXT on `profiles` (sun_sign / moon_sign / rising_sign).
 */

export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number]

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water'

export type SignMeta = {
  label: string
  symbol: string
  element: ZodiacElement
  dates: string
}

export const SIGN_META: Record<ZodiacSign, SignMeta> = {
  aries: { label: 'Aries', symbol: '♈', element: 'fire', dates: 'Mar 21 – Apr 19' },
  taurus: { label: 'Taurus', symbol: '♉', element: 'earth', dates: 'Apr 20 – May 20' },
  gemini: { label: 'Gemini', symbol: '♊', element: 'air', dates: 'May 21 – Jun 20' },
  cancer: { label: 'Cancer', symbol: '♋', element: 'water', dates: 'Jun 21 – Jul 22' },
  leo: { label: 'Leo', symbol: '♌', element: 'fire', dates: 'Jul 23 – Aug 22' },
  virgo: { label: 'Virgo', symbol: '♍', element: 'earth', dates: 'Aug 23 – Sep 22' },
  libra: { label: 'Libra', symbol: '♎', element: 'air', dates: 'Sep 23 – Oct 22' },
  scorpio: { label: 'Scorpio', symbol: '♏', element: 'water', dates: 'Oct 23 – Nov 21' },
  sagittarius: { label: 'Sagittarius', symbol: '♐', element: 'fire', dates: 'Nov 22 – Dec 21' },
  capricorn: { label: 'Capricorn', symbol: '♑', element: 'earth', dates: 'Dec 22 – Jan 19' },
  aquarius: { label: 'Aquarius', symbol: '♒', element: 'air', dates: 'Jan 20 – Feb 18' },
  pisces: { label: 'Pisces', symbol: '♓', element: 'water', dates: 'Feb 19 – Mar 20' },
}

export function isZodiacSign(value: string | null | undefined): value is ZodiacSign {
  return !!value && (ZODIAC_SIGNS as readonly string[]).includes(value)
}

/** "Leo ♌" — safe for any string; returns null when not a known sign. */
export function formatSign(sign: string | null | undefined): string | null {
  if (!isZodiacSign(sign)) return null
  const m = SIGN_META[sign]
  return `${m.label} ${m.symbol}`
}

export type Compatibility = {
  /** 0–100 — a fun score, not science. */
  percent: number
  label: string
  blurb: string
}

const ELEMENT_PAIR: Record<string, { percent: number; label: string; blurb: string }> = {
  // same element
  'fire+fire': { percent: 90, label: 'Element twins', blurb: 'Same spark — you burn at the same tempo.' },
  'earth+earth': { percent: 90, label: 'Element twins', blurb: 'Both steady. A calm, lived-in kind of easy.' },
  'air+air': { percent: 90, label: 'Element twins', blurb: 'Endless conversation, zero awkward silences.' },
  'water+water': { percent: 90, label: 'Element twins', blurb: 'You feel everything together — deep end, no floaties.' },
  // complementary
  'air+fire': { percent: 88, label: 'Oxygen & flame', blurb: 'Air feeds the fire — you make each other bigger.' },
  'earth+water': { percent: 88, label: 'Roots & rain', blurb: 'Water softens earth; earth gives water a shape.' },
  // mixed
  'earth+fire': { percent: 72, label: 'Spark meets steady', blurb: 'One races, one paces — surprisingly balanced.' },
  'air+water': { percent: 72, label: 'Head meets heart', blurb: 'Logic and feeling, learning each other’s language.' },
  'air+earth': { percent: 66, label: 'Kite & anchor', blurb: 'Dreamer meets do-er — grounding, if you let it.' },
  'fire+water': { percent: 64, label: 'Steam', blurb: 'Intense and a little volatile. Handle with care.' },
}

/**
 * Compatibility between two sun signs — element-based, intentionally for fun.
 * Same sign reads as a "mirror match"; otherwise we look at the element pair.
 */
export function sunCompatibility(a: string | null | undefined, b: string | null | undefined): Compatibility | null {
  if (!isZodiacSign(a) || !isZodiacSign(b)) return null
  if (a === b) {
    return {
      percent: 96,
      label: 'Mirror match',
      blurb: `Two ${SIGN_META[a].label}s — it’s a little uncanny how much you just get it.`,
    }
  }
  const ea = SIGN_META[a].element
  const eb = SIGN_META[b].element
  const key = [ea, eb].sort().join('+')
  const hit = ELEMENT_PAIR[key]
  if (!hit) return null
  return hit
}

// Each element vibes with itself + one complement (fire↔air, earth↔water).
const ELEMENT_FRIENDS: Record<ZodiacElement, [ZodiacElement, ZodiacElement]> = {
  fire: ['fire', 'air'],
  air: ['air', 'fire'],
  earth: ['earth', 'water'],
  water: ['water', 'earth'],
}

/** A one-liner about who a sun sign tends to click with (general, for fun). */
export function sunMatchHint(sun: string | null | undefined): string | null {
  if (!isZodiacSign(sun)) return null
  const [a, b] = ELEMENT_FRIENDS[SIGN_META[sun].element]
  return `Tends to click with ${a} & ${b} signs.`
}
