// MemoryMatch sample data — ported from lib/memorymatch.ts
window.MM_DATA = {
  themes: [
    { id: 'soft-pixel-romance', name: 'Soft Pixel Romance', blurb: 'Warm pastels, glossy chrome, blush hearts.', swatch: ['#8E6FB0', '#E8B6CE', '#FBE9C9'] },
    { id: 'late-night-aim', name: 'Late Night AIM', blurb: 'Dim indigo, glowing buddy windows.', swatch: ['#5fb6e6', '#9b6fd4', '#2b2350'] },
    { id: 'cyber-cafe', name: 'Cyber Café', blurb: 'Cool teal glass and mint accents.', swatch: ['#2f9ec9', '#54c9a6', '#eaf6f8'] },
    { id: 'arcade-crush', name: 'Arcade Crush', blurb: 'Hot coral, candy buttons, high score.', swatch: ['#e2563a', '#f0a93f', '#f7d9c4'] },
    { id: 'dreamcast-summer', name: 'Dreamcast Summer', blurb: 'Breezy blues with a sunny yellow swirl.', swatch: ['#5b78d6', '#e7c64a', '#82c8e0'] },
  ],

  intents: [
    { id: 'open-to-dating', label: 'Open to dating', hint: 'Down to see where things go.' },
    { id: 'slow-burn', label: 'Slow burn', hint: 'No rush. Let it simmer.' },
    { id: 'friend-first', label: 'Friend first', hint: 'Start as pals, see what grows.' },
    { id: 'just-browsing', label: 'Just browsing', hint: 'Window shopping for now.' },
    { id: 'co-op-mode', label: 'Co-op mode', hint: 'Looking for a player two.' },
    { id: 'social-discovery', label: 'Social discovery', hint: 'Here to meet interesting people.' },
  ],

  interests: [
    'lo-fi beats', 'pixel art', 'retro gaming', 'vinyl records', 'film photography',
    'indie games', 'anime', 'thrifting', 'journaling', 'synthwave', 'cozy games',
    'sci-fi novels', 'baking', 'rollerblading', 'mixtapes', 'collage', 'plants',
    'tarot', 'road trips', 'arcades', 'webcore', 'midi keyboards', 'sticker swaps',
  ],

  beats: [
    { id: 'lofi-tape', title: 'lo-fi tape loop', vibe: 'warm & nostalgic' },
    { id: 'dialup-dream', title: 'dial-up dream', vibe: 'glitchy & soft' },
    { id: 'arcade-sunset', title: 'arcade sunset', vibe: 'bright & playful' },
    { id: 'midnight-modem', title: 'midnight modem', vibe: 'late & mellow' },
  ],

  robin: {
    username: 'mixtape_kid',
    displayName: 'Robin',
    pronouns: 'they/them',
    age: 24,
    location: 'Portland, OR',
    mood: 'rewinding a good tape',
    online: true,
    intents: ['Slow burn', 'Friend first'],
    blurb: "I make playlists for feelings that don't have names yet. Looking for someone to trade mixtapes and quiet Sundays with.",
    nowPlaying: 'Boards of Canada — Roygbiv',
    beatLabel: 'lo-fi tape loop',
    frames: [
      { src: 'mm/reels/sunset-drive.png', caption: 'golden hour drives', duration: 4 },
      { src: 'mm/reels/polaroid-pile.png', caption: 'my polaroid pile', duration: 4 },
      { src: 'mm/reels/bedroom-setup.png', caption: 'where the magic happens', duration: 4 },
    ],
    interests: ['mixtapes', 'film photography', 'lo-fi beats', 'vinyl records', 'thrifting', 'journaling', 'road trips', 'plants'],
    top8: [
      { username: 'pixelpetal', displayName: 'Mira', thumb: 'mm/reels/bedroom-setup.png' },
      { username: 'arcadeghost', displayName: 'Dev', thumb: 'mm/reels/arcade-night.png' },
      { username: 'softmodem', displayName: 'Lou', thumb: 'mm/reels/polaroid-pile.png' },
      { username: 'cassettesun', displayName: 'Ari', thumb: 'mm/reels/sunset-drive.png' },
      { username: 'noodlebowl', displayName: 'Kai', thumb: 'mm/reels/cafe-window.png' },
      { username: 'zinequeen', displayName: 'Sam', thumb: 'mm/reels/skate-park.png' },
      { username: 'glittercd', displayName: 'Bex', thumb: 'mm/reels/cafe-window.png' },
      { username: 'dialup99', displayName: 'Theo', thumb: 'mm/reels/arcade-night.png' },
    ],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'Thrift crawl, then home to develop a roll of film with the windows open.' },
      { q: "I'll instantly vibe with you if...", a: 'You have strong opinions about track order on an album.' },
    ],
  },

  buddies: [
    { username: 'pixelpetal', displayName: 'Mira', mood: 'drawing tiny worlds', intent: 'slow burn', thumb: 'mm/reels/bedroom-setup.png', online: true },
    { username: 'arcadeghost', displayName: 'Dev', mood: 'chasing a high score', intent: 'friend first', thumb: 'mm/reels/arcade-night.png', online: true },
    { username: 'noodlebowl', displayName: 'Kai', mood: 'rainy day ramen', intent: 'just browsing', thumb: 'mm/reels/cafe-window.png', online: true },
    { username: 'zinequeen', displayName: 'Sam', mood: 'cutting and pasting', intent: 'slow burn', thumb: 'mm/reels/skate-park.png', online: true },
    { username: 'glittercd', displayName: 'Bex', mood: 'shiny and new', intent: 'open to dating', thumb: 'mm/reels/cafe-window.png', online: true },
    { username: 'cassettesun', displayName: 'Ari', mood: 'sunny and unbothered', intent: 'co-op mode', thumb: 'mm/reels/sunset-drive.png', online: false },
    { username: 'softmodem', displayName: 'Lou', mood: 'late night online', intent: 'friend first', thumb: 'mm/reels/polaroid-pile.png', online: false },
    { username: 'dialup99', displayName: 'Theo', mood: 'buffering...', intent: 'just browsing', thumb: 'mm/reels/arcade-night.png', online: false },
  ],

  mira: {
    username: 'pixelpetal',
    displayName: 'Mira',
    mood: 'drawing tiny worlds',
    thumb: 'mm/reels/bedroom-setup.png',
    shared: ['pixel art', 'lo-fi beats', 'thrifting', 'cozy games'],
    starters: [
      'Okay, your reel gave me actual nostalgia. Where was that bedroom shot taken?',
      "We're clearly both into pixel art — what are you making lately?",
      'Trading a thrift-find story for a thrift-find story. You first.',
    ],
  },

  clips: [
    { src: 'mm/reels/sunset-drive.png', label: 'sunset drive' },
    { src: 'mm/reels/arcade-night.png', label: 'arcade night' },
    { src: 'mm/reels/bedroom-setup.png', label: 'bedroom setup' },
    { src: 'mm/reels/polaroid-pile.png', label: 'polaroid pile' },
    { src: 'mm/reels/skate-park.png', label: 'skate park' },
    { src: 'mm/reels/cafe-window.png', label: 'cafe window' },
  ],
};
