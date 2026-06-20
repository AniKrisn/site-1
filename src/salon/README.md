# Salon

A private, single-user map of one person's understanding of art.

Two panels:

- **Left — the wall.** An infinite [tldraw](https://tldraw.dev) canvas. Drop or
  paste an image (a painting, a chair, an amplifier) or paste an image URL to
  add a work. Arrange everything by hand; the arrangement is yours and it means
  something. The AI never rearranges it.
- **Right — the understanding layer.** Select a work and Salon identifies it,
  searches for primary sources, and writes a grounded, _polyphonic_ note —
  documented fact, the maker's own words, what scholars argue (including where
  they disagree), and Salon's own cross-medium read — every factual claim traced
  to a real, retrieved source.

## How the intelligence works (important)

Salon does **not** call a model API with a key. Each request from the right
panel spawns a **headless Claude Code instance** (`claude -p`) on your machine,
which:

- uses your existing Claude **login / subscription** (no `ANTHROPIC_API_KEY`,
  no per-token billing), and
- has the **WebSearch / WebFetch** tools, so grounding is live and citable.

This lives in a Vite **dev-server** plugin (`vite-plugin-salon.ts`), mirroring
the existing `vite-plugin-gemini-proxy.ts`. **It only runs under `yarn dev`.**
The static GitHub Pages build has no backend, so the understanding layer is
local-only (the canvas itself still works anywhere).

## Setup & run

Prerequisites:

1. Node 20+ and `yarn` (this repo already uses it).
2. The **Claude Code CLI** installed and logged in:
   ```sh
   claude --version     # should print a version
   claude               # if not logged in, run /login once inside it
   ```
   Make sure `ANTHROPIC_API_KEY` is **not** set in your shell, or it will force
   per-token API billing instead of your subscription.

Then:

```sh
yarn            # if you haven't installed deps
yarn dev        # http://localhost:5173/salon
```

Open `/salon`, drop in ten or fifteen works, arrange them, and select one to
research it.

### Optional config

- `SALON_MODEL` (in `.env.local`) — which Claude model the researcher uses.
  Defaults to `sonnet`. Set to `opus` for the strongest voice (slower / more
  quota), `haiku` for speed.

## Where things live

```
src/salon/
  Salon.tsx                 entry: two-panel layout, owns editor + selection
  salon.css                 gallery-quiet styling (reuses the site theme vars)
  shapes/ArtworkShapeUtil.tsx   custom tldraw "artwork" shape (image + identity)
  canvas/SalonCanvas.tsx    tldraw wrapper, persistence, drop/paste -> artwork
  canvas/addArtwork.ts      build artwork shapes from files / URLs
  panel/UnderstandingPanel.tsx  right panel: states + note generation
  panel/NoteView.tsx        renders a polyphonic note with citations
  ai/client.ts              fetch wrappers for /api/salon/*
  ai/types.ts               note types (mirror the server JSON schema)
  store/db.ts               IndexedDB: notes / connections / messages / profile
vite-plugin-salon.ts        dev backend: spawns headless claude -p, the prompts
```

Persistence: the canvas layout **and the images** persist via tldraw
(`persistenceKey="salon-canvas-v1"`). The heavier AI artifacts (notes, etc.)
persist in IndexedDB (`salon` database). Everything is local; nothing is
uploaded.

## Status — v1 complete

- [x] **A** — canvas + artwork shape + drop/paste/arrange + persist
- [x] **B** — select one → grounded, polyphonic, cited note (identity from vision)
- [x] **C** — conversation thread (resumes the note's session, so it stays grounded)
- [x] **D** — select two → argued / honestly-declined connection + keep/reject/unsure
- [x] **E** — taste profile (inspectable & editable) + on-demand "what to look at next"

### Notes on behaviour

- The taste profile quietly informs notes, connections, and suggestions (passed
  as a short `taste` string). It's never imposed: you can edit the free-text
  read and the lists, and Salon only updates it when you ask it to ("Refine from
  my collection").
- Nothing on the canvas is ever auto-arranged, auto-tagged, or auto-clustered.
- Grounded requests take ~40s–4min (live web search). The panel shows a thinking
  state; results are cached locally so re-selecting a work is instant.
- A work's session lives in a stable temp dir keyed by its id
  (`$TMPDIR/salon-sessions/`), because Claude Code scopes conversation history to
  the working directory — that's what lets a note's thread be resumed for chat.
