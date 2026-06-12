export type ThemeId =
  | 'soft-pixel-romance'
  | 'late-night-aim'
  | 'cyber-cafe'
  | 'arcade-crush'
  | 'dreamcast-summer'

export type ThemeOption = {
  id: ThemeId
  name: string
  blurb: string
  /** swatch colors for preview chips (CSS color strings) */
  swatch: [string, string, string]
}

/** Default is soft-pixel-romance. The id maps to a [data-theme] attribute (root = default). */
export const THEMES: ThemeOption[] = [
  {
    id: 'soft-pixel-romance',
    name: 'Soft Pixel Romance',
    blurb: 'Warm pastels, glossy chrome, blush hearts.',
    swatch: ['#8E6FB0', '#E8B6CE', '#FBE9C9'],
  },
  {
    id: 'late-night-aim',
    name: 'Late Night AIM',
    blurb: 'Dim indigo, glowing buddy windows.',
    swatch: ['#5fb6e6', '#9b6fd4', '#2b2350'],
  },
  {
    id: 'cyber-cafe',
    name: 'Cyber Café',
    blurb: 'Cool teal glass and mint accents.',
    swatch: ['#2f9ec9', '#54c9a6', '#eaf6f8'],
  },
  {
    id: 'arcade-crush',
    name: 'Arcade Crush',
    blurb: 'Hot coral, candy buttons, high score.',
    swatch: ['#e2563a', '#f0a93f', '#f7d9c4'],
  },
  {
    id: 'dreamcast-summer',
    name: 'Dreamcast Summer',
    blurb: 'Breezy blues with a sunny yellow swirl.',
    swatch: ['#5b78d6', '#e7c64a', '#82c8e0'],
  },
]

export type IntentId =
  | 'open-to-dating'
  | 'slow-burn'
  | 'friend-first'
  | 'just-browsing'
  | 'co-op-mode'
  | 'social-discovery'

export const INTENTS: { id: IntentId; label: string; hint: string }[] = [
  { id: 'open-to-dating', label: 'Open to dating', hint: 'Down to see where things go.' },
  { id: 'slow-burn', label: 'Slow burn', hint: 'No rush. Let it simmer.' },
  { id: 'friend-first', label: 'Friend first', hint: 'Start as pals, see what grows.' },
  { id: 'just-browsing', label: 'Just browsing', hint: 'Window shopping for now.' },
  { id: 'co-op-mode', label: 'Co-op mode', hint: 'Looking for a player two.' },
  { id: 'social-discovery', label: 'Social discovery', hint: 'Here to meet interesting people.' },
]

export const SUGGESTED_INTERESTS = [
  'lo-fi beats', 'pixel art', 'retro gaming', 'vinyl records', 'film photography',
  'indie games', 'anime', 'thrifting', 'journaling', 'synthwave', 'cozy games',
  'sci-fi novels', 'baking', 'rollerblading', 'mixtapes', 'collage', 'plants',
  'tarot', 'road trips', 'arcades', 'webcore', 'midi keyboards', 'sticker swaps',
  'late-night drives', 'noodle shops', 'old forums', 'zines', 'speedrunning',
]

/** A reusable Vibe Page summary used by Browse + ReelChemistry mini cards. */
export type VibeSummary = {
  username: string
  displayName: string
  mood: string
  themeAccent: string // CSS color
  reelThumb: string // image url
  online?: boolean
}

/** Shared sample profiles so Vibe Page, Browse, and Chemistry stay consistent. */
export const SAMPLE_PROFILES = {
  robin: {
    username: 'mixtape_kid',
    displayName: 'Robin',
    pronouns: 'they/them',
    age: 24,
    location: 'Portland, OR',
    mood: 'rewinding a good tape',
    online: true,
    intents: ['slow-burn', 'friend-first'] as IntentId[],
    blurb:
      "I make playlists for feelings that don't have names yet. Looking for someone to trade mixtapes and quiet Sundays with.",
    nowPlaying: 'Boards of Canada — Roygbiv',
    reel: {
      beatLabel: 'lo-fi tape loop',
      frames: [
        { src: '/reels/sunset-drive.png', caption: 'golden hour drives', duration: 4 },
        { src: '/reels/polaroid-pile.png', caption: 'my polaroid pile', duration: 4 },
        { src: '/reels/bedroom-setup.png', caption: 'where the magic happens', duration: 4 },
      ],
    },
    interests: ['mixtapes', 'film photography', 'lo-fi beats', 'vinyl records', 'thrifting', 'journaling', 'road trips', 'plants'],
    top8: [
      { username: 'pixelpetal', displayName: 'Mira' },
      { username: 'arcadeghost', displayName: 'Dev' },
      { username: 'softmodem', displayName: 'Lou' },
      { username: 'cassettesun', displayName: 'Ari' },
      { username: 'noodlebowl', displayName: 'Kai' },
      { username: 'zinequeen', displayName: 'Sam' },
      { username: 'glittercd', displayName: 'Bex' },
      { username: 'dialup99', displayName: 'Theo' },
    ],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'Thrift crawl, then home to develop a roll of film with the windows open.' },
      { q: "I'll instantly vibe with you if...", a: 'You have strong opinions about track order on an album.' },
    ],
  },
} as const

export const SAMPLE_BUDDIES: VibeSummary[] = [
  { username: 'pixelpetal', displayName: 'Mira', mood: 'drawing tiny worlds', themeAccent: '#E8B6CE', reelThumb: '/reels/bedroom-setup.png', online: true },
  { username: 'arcadeghost', displayName: 'Dev', mood: 'chasing a high score', themeAccent: '#e2563a', reelThumb: '/reels/arcade-night.png', online: true },
  { username: 'cassettesun', displayName: 'Ari', mood: 'sunny and unbothered', themeAccent: '#e7c64a', reelThumb: '/reels/sunset-drive.png', online: false },
  { username: 'noodlebowl', displayName: 'Kai', mood: 'rainy day ramen', themeAccent: '#2f9ec9', reelThumb: '/reels/cafe-window.png', online: true },
  { username: 'softmodem', displayName: 'Lou', mood: 'late night online', themeAccent: '#5fb6e6', reelThumb: '/reels/polaroid-pile.png', online: false },
  { username: 'zinequeen', displayName: 'Sam', mood: 'cutting and pasting', themeAccent: '#C9A9E0', reelThumb: '/reels/skate-park.png', online: true },
  { username: 'dialup99', displayName: 'Theo', mood: 'buffering...', themeAccent: '#9b6fd4', reelThumb: '/reels/arcade-night.png', online: false },
  { username: 'glittercd', displayName: 'Bex', mood: 'shiny and new', themeAccent: '#54c9a6', reelThumb: '/reels/cafe-window.png', online: true },
]
