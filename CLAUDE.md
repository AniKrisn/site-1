# site_simple

Ani's site. Vite + React, deployed to Cloudflare Pages from the GitHub
repo (`AniKrisn/site-1`) — a push to `main` builds and deploys. There is
no wrangler config and no CI workflow; the Pages project is connected to
git through the dashboard.

## Adding a project

Projects are static builds dropped whole into `public/<name>/`. Vite
copies `public/` into `dist/` untouched, so whatever you put there is
served as-is at `/<name>/`. Then add an entry to `projects` in
`src/App.tsx`:

```ts
{
  title: "Ligne claire",
  slug: "/ligne-claire/",
  mobileHref: "/ligne-claire/",
}
```

Two things that will bite:

- **Give it a `mobileHref` or it is invisible on phones.** `App.css`
  hides `.post-link-desktop` below 1024px and shows `.post-link-mobile`
  instead, so an entry with only a `slug` disappears there. Point it at
  the same path if the project works on a phone; point it somewhere else
  (Code editor points at GitHub) if it doesn't.
- **Keep the trailing slash.** These builds resolve their assets relative
  to the document, so `/ligne-claire/` finds `/ligne-claire/scene.glb`
  while `/ligne-claire` would look for `/scene.glb` and 404.

Titles are sentence case here — Code editor, Beetle, Ligne claire — even
where the project styles itself lowercase inside.

## Updating ligne-claire

It lives at `~/Documents/code/ligne-claire` (branch
`claude/minimal-showcase-version-7fb9f3`, in a worktree under
`.claude/worktrees/`). To ship a change:

```bash
cd ~/Documents/code/ligne-claire/.claude/worktrees/minimal-showcase-version-7fb9f3
make ship                                        # blender export + vite build
rsync -a --delete viewer/dist/ ~/Documents/code/site_simple/public/ligne-claire/
```

`make ship` re-exports the scene from Blender and rebuilds; skip the
export with `cd viewer && npm run build` if only the viewer changed.
Check it before it goes out with `npx vite preview --port 4173` from
`viewer/`, which serves the built `dist/` rather than the dev server.

## Weight, and when a project should get its own deployment

Everything in `public/` is committed, and git keeps every version of a
binary forever — a `.glb` and an `.m4a` are already compressed, so a
re-export stores another whole copy rather than a diff. ligne-claire is
~5.9 MB (the scene is Draco-compressed on export, 8.5 MB → 2.9 MB). That
is fine for a handful of projects. It is not fine for twenty, or for one
re-exported weekly.

When a project outgrows this, or needs to be sandboxed, give it its own
Cloudflare Pages project instead — `wrangler pages deploy dist/` from the
project's own repo, linked from here as an outbound entry.

Two reasons to reach for that:

- **Weight.** Nothing enters this repo, so the site's build stays fast
  however heavy the project is.
- **Origin.** A separate Pages project is a separate origin, which is the
  browser's real security boundary: its own localStorage, cookies,
  service workers, CSP, Functions and env vars. Anything with an agent in
  it, an API key to hide, or user input worth containing wants that
  isolation — on this origin, a demo's JS can read everything the site
  stores.

Note that a Pages project connected to git **cannot** also take direct
uploads; the type is fixed when the project is created. So this is a
per-project decision, not something to bolt onto this one.

Git LFS is not an option either — Pages does not fetch LFS objects during
a build, so the file would deploy as a pointer.
