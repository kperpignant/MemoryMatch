/**
 * Canonical dating prompts shown during onboarding (category `dating` in the DB).
 * Order here is the display order in the wizard.
 */
export const DATING_PROMPTS = [
  'My ideal first date is...',
  "I'm looking for someone who...",
  'The way to my heart is...',
  'A dealbreaker for me is...',
  "We'll get along if...",
  'My love language is...',
  'The best way to win me over is...',
  'A green flag I look for is...',
  'My ideal Sunday together is...',
  'I geek out about...',
  'Dating me is like...',
  "I'll know it's right when...",
] as const

export type DatingPromptText = (typeof DATING_PROMPTS)[number]
