export interface Note {
  id: string
  title: string
  content: string
  preview: string
  updatedAt: string
  favorite: boolean
  category: string
  wordCount?: number
}

export type NavItem = 'all' | 'favorites' | 'ai' | 'recent' | 'trash'

export const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Product Roadmap Q2 2025',
    content: `# Product Roadmap Q2 2025

Key initiatives for this quarter, focused on shipping AI-native features that delight our users.

## AI Integration

Build out the AI assistant capabilities users have been requesting since launch.

- Natural language search across all notes
- Auto-summarization of long documents
- Smart tagging and categorization
- Context-aware suggestions

## Performance

Improve load times and responsiveness across all platforms. Target: < 100ms first paint.

## Collaboration

Real-time multiplayer editing with presence indicators and inline comments.`,
    preview: 'Key initiatives including AI integration, performance improvements, and new collaboration features for teams.',
    updatedAt: '2 min ago',
    favorite: true,
    category: 'work',
    wordCount: 312,
  },
  {
    id: '2',
    title: 'Meeting Notes — Design Review',
    content: `# Meeting Notes — Design Review

**Date:** May 8, 2025
**Attendees:** Rishi, Sarah, Jake, Mia

## Discussion Points

Reviewed the new dashboard component library and design tokens. The team agreed on a violet-first color palette.

### Action Items

- [ ] Update button variants to use new radius system
- [ ] Ship dark mode tokens to Figma
- [ ] Review typography scale with marketing

### Next Steps

Follow-up in 2 weeks after design tokens are finalized.`,
    preview: 'Design review session for the new dashboard. Discussed component library and design tokens.',
    updatedAt: '1 hour ago',
    favorite: false,
    category: 'work',
    wordCount: 89,
  },
  {
    id: '3',
    title: 'Ideas for Weekend Project',
    content: `# Weekend Project Ideas

Brainstorming session for things to build this weekend. No pressure, just fun.

1. **Weather app** — Beautiful animations, glassmorphic cards, real-time data
2. **CLI note tool** — Lightweight terminal app for quick capture
3. **WebGL shaders** — Experiment with GLSL fragment shaders in the browser
4. **Music visualizer** — Canvas + Web Audio API
5. **URL shortener** — Edge functions, custom domain, analytics

Leaning towards the WebGL shaders project. Need to dig into Three.js first.`,
    preview: 'Build a weather app, create a CLI tool for note taking, experiment with WebGL shaders...',
    updatedAt: 'Yesterday',
    favorite: true,
    category: 'personal',
    wordCount: 98,
  },
  {
    id: '4',
    title: 'Book Notes: Atomic Habits',
    content: `# Atomic Habits — James Clear

## Core Concept

Tiny changes, remarkable results. Systems beat goals every time.

## The 1% Rule

1% improvement daily = 37x better over a year.
1% worse daily = near zero in a year.

## Identity-Based Habits

Don't say "I want to run a marathon." Say "I am a runner."
Every action is a vote for the person you want to become.

## The Four Laws

1. Make it obvious
2. Make it attractive
3. Make it easy
4. Make it satisfying`,
    preview: 'Key insights about habit formation, the 1% rule, and identity-based habits.',
    updatedAt: '2 days ago',
    favorite: false,
    category: 'reading',
    wordCount: 104,
  },
  {
    id: '5',
    title: 'API Design Guidelines',
    content: `# API Design Guidelines

## RESTful Conventions

Follow standard REST conventions. Resources are nouns, methods are verbs.

\`\`\`
GET    /notes         → list
POST   /notes         → create
GET    /notes/:id     → get one
PATCH  /notes/:id     → update
DELETE /notes/:id     → delete
\`\`\`

## Versioning

Always version APIs. Use path-based versioning: \`/v1/\`, \`/v2/\`.

## Error Handling

Return structured errors with \`code\`, \`message\`, and \`details\`.

## Authentication

Use Bearer tokens. Rotate secrets quarterly.`,
    preview: 'RESTful conventions, versioning strategy, error handling, and authentication patterns.',
    updatedAt: '3 days ago',
    favorite: false,
    category: 'work',
    wordCount: 94,
  },
  {
    id: '6',
    title: 'Travel Plans: Japan 2025',
    content: `# Japan Trip Planning

## Itinerary

| City | Days | Notes |
|------|------|-------|
| Tokyo | 5 | Shibuya, Shinjuku, Akihabara |
| Kyoto | 3 | Temples, Arashiyama |
| Osaka | 2 | Food, Dotonbori |

## Must-Visit

- Shibuya Crossing at night
- Fushimi Inari at sunrise
- Arashiyama Bamboo Grove
- teamLab Borderless

## Food

- Ichiran Ramen (solo dining concept)
- Tsukiji Market breakfast
- Okonomiyaki in Osaka
- Matcha everything`,
    preview: 'Tokyo 5 days, Kyoto 3 days, Osaka 2 days. Must-see temples, food spots, and hidden gems.',
    updatedAt: '1 week ago',
    favorite: true,
    category: 'personal',
    wordCount: 108,
  },
]
