# NoteAI

A premium AI-powered notes workspace built with Next.js 16, designed around speed, intelligence, and a clean writing experience.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Auth | Clerk v7 |
| Database | Firebase Firestore (Admin SDK) |
| Language | TypeScript |

---

## Current Features

### Architecture

**Debounced Autosave Pipeline**
Three-stage save architecture that eliminates unnecessary writes while keeping data safe:
- Instant local state update on every keystroke — zero input lag
- 2-second debounce → persists draft to `localStorage` (survives tab crashes)
- 4.5-second debounce → diffs against last synced state, sends only changed fields via `PATCH /api/notes/:id`
- `beforeunload` warning when unsynced changes exist
- Offline draft indicator if API call fails — data never silently lost

**Save Status Indicator**
Live badge in the editor header shows the current sync state:
- `Saved` — all changes synced to Firestore
- `Draft` — changes pending, stored locally
- `Saving...` — API call in flight
- `Offline Draft` — network error, draft preserved in localStorage

**Server-Side API Architecture**
All Firestore writes go through Next.js Route Handlers, never directly from the client:
```
Browser → Next.js API Route (Clerk auth gate) → Firebase Admin SDK → Firestore
```
- `GET /api/notes` — list user's notes ordered by `updatedAt`
- `POST /api/notes` — create note
- `PATCH /api/notes/:id` — partial update (diff-based, field whitelist enforced)
- `DELETE /api/notes/:id` — delete note
- Firestore security rules deny all client-side access — Admin SDK only

### Auth & Per-User Data

- Clerk v7 authentication — sign up / sign in via modal
- Every note scoped to `users/{userId}/notes/{noteId}` in Firestore
- Server-side `auth()` gates every API route — no userId spoofing possible
- Unauthenticated users see a landing screen; no data leaks

### Command Palette (`Ctrl+K` / `⌘K`)

- Instant full-text search across all notes (title + preview)
- Quick actions: New Note, Ask AI, View Favorites, Recent Notes, Browse Tags, Trash, Settings
- Keyboard navigation — `↑↓` to move, `↵` to select, `Esc` to close
- Platform-aware shortcuts — shows `⌘` on macOS, `Ctrl+` on Windows/Linux
- Animated entry/exit with spring physics

### Notes Management

- Create, edit, delete notes
- Per-note favorite (star) toggle with optimistic UI
- Category tagging (`all`, `favorites`, etc.)
- Notes list with live preview, word count, and relative timestamps
- Trash icon on hover for quick deletion from the list
- Auto-selects first note on load; selects newly created note immediately

### Editor

- Full-width distraction-free writing area
- Auto-resizing title textarea
- Markdown-friendly plain text (headings, bold, italic, code)
- Live word count in the status bar
- Floating format toolbar
- Star / Share / More actions in the header

### UI & Design

- Dark mode by default with full light mode support (CSS custom properties + `data-theme`)
- Theme toggle persisted to `localStorage`
- Glassmorphism panels, violet accent system
- Smooth page transitions and list animations via Framer Motion
- `layoutId` shared element transitions on note selection
- Three-panel layout: Sidebar → Notes List → Editor

---

## Upcoming Features

### AI Writing Assistant

**Note Generation**
Generate a full note from a prompt or topic — useful for meeting agendas, research outlines, brainstorming, and structured writing.

**Smart Formatting**
AI rewrites selected text to improve clarity, adjust tone (casual / professional / concise), or convert prose to bullet points and vice versa.

**Inline Autocomplete**
Ghost-text completions as you type, similar to GitHub Copilot but for long-form writing. Accepts with `Tab`, dismisses with `Esc`.

**Ask AI Panel**
Contextual Q&A over the current note — summarize, explain, expand, or ask questions about the content without leaving the editor.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore enabled
- Clerk application
- Firebase service account (for Admin SDK)

### Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Get `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from Firebase Console → Project Settings → Service Accounts → Generate new private key.

### Firestore Security Rules

Deny all client access — the Admin SDK bypasses these rules server-side:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Run

```bash
npm install
npm run dev
```
