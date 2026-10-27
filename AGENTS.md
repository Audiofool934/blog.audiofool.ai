# Agent Guide

blog.audiofool.ai is a personal archive for projects, notes, music, photography, and public updates.
It uses Astro 6, TypeScript, Tailwind CSS 3 via PostCSS, and Markdown content collections; there is no UI framework runtime.
Keep this guide current when project conventions change.

## Workflow

- Inspect the working tree first and preserve unrelated edits.
- `npm run build` deletes `.astro` and `node_modules/.astro`, which empties the content store of any dev server in the same checkout; when other agents may work here, use your own worktree with its own `npm ci`.
- Do not hand-edit synced project READMEs without an explicit override request.
- Keep generated images, `.astro`, `node_modules/.astro`, and local QA artifacts out of commits.
- GitHub Actions deploys pushes to `main`; publishing requires clear user authorization.
- Match validation to the change and reproduce user-facing bugs before fixing them.
- When the Codex plugin is available, prefer cross-model validation for non-trivial work; skip it for trivial or urgent work.
- Plugin commands: `/codex:review --background --base main` for changes, `/codex:adversarial-review --background` for design risks, and `/codex:rescue --background` for bounded investigations.
- Review Codex review/rescue results in Codex before finalizing; use `/codex:status`, `/codex:result`, and `/codex:setup` as needed.

## Commands

Use npm with Node `>=22.12.0`.

```bash
npm run dev                       # Generate image variants and start Astro
npm run build                     # Generate images, clear Astro caches, build
npm run preview                   # Serve the production build locally
npm run check                     # Strict types, parser checks, and unit regressions
npm run astro -- check             # Astro and TypeScript diagnostics
npm run check:unit                # Player, artwork, and route policy regressions
npm run check:routes              # Production redirects and canonical pages; build first
npm run check:browser             # Production UI checks; install Playwright Chromium first
npm run check:audioshow-parser     # AudioShow parser fixtures
npm run check:performance          # Production output budgets; build first
npm run generate:site-images
npm run generate:audioshow-images
npm run gallery:intake             # Local photo curation desk; requires prepared .local/gallery-intake data
npm run refresh:github-projects    # Explicit metadata and README sync
npm run timeline:collect           # Public GitHub facts for local discussion
npm run timeline:approve -- <file>  # Approve one reviewed draft into log; no deploy
npm run build:with-sync            # Explicit GitHub sync and build
```

`predev` and `prebuild` generate site and AudioShow image variants.
Ordinary builds use committed GitHub snapshots and do not sync network data.
Run either GitHub sync command only when fresh project data is explicitly requested.

## Architecture

| Area | Source of truth |
| --- | --- |
| Global shell | `src/layouts/MinimalLayout.astro` |
| SEO, canonical URLs, social cards, JSON-LD, RSS link, ClientRouter | `src/components/site/SiteHead.astro` |
| Navigation, theme controls, mobile menu, player | `src/components/site/SiteSidebar.astro` |
| Initial theme | `src/components/site/SiteThemeScripts.astro` |
| Theme tokens and utilities | `src/style/global.css` |
| Markdown typography and highlighting | `src/style/post.css`, `src/style/prism-theme.css` |
| Collection schemas and loaders | `src/content.config.ts` |
| Homepage selection, timeline, RSS items, timeline lanes | `src/utils/timelineItems.ts`, `src/utils/postType.ts`, `src/data/homepageSelected.ts` |
| Gallery controls and viewer | `src/components/gallery/` |
| AudioShow image paths and widths | `src/utils/audioImages.mjs` |
| Legacy aliases | `src/data/legacyRedirects.mjs` |

Update `getTimelineItems()` when changing what counts as an update; keep sorting and filtering out of individual consumers.
Timeline lanes follow the source collection; a log post is `site` when tagged Meta or Update, then `photo` (Gallery), `music` (AudioShow), `project` (Project/Projects), and otherwise `post`.
The homepage shows a curated "Selected" list: edit `src/data/homepageSelected.ts` (kind and entry id); `getSelectedItems()` resolves it newest first and fails the build on a missing entry.
Project metadata lives in `src/content/projects/`, synced READMEs in `src/content/project-readmes/`, and the GitHub catalog in `src/data/github-projects.json`.
Pinned projects use `pinOrder` for display order and `url` for their primary destination in the project index.
A project's `category` is one of the one-word classes in `categoryOrder` in `src/pages/projects/index.astro`; the Project Index filters show each class (plural where countable, such as `[ Agents ]`), and `?view=<class>` links to one.
`src/utils/projectState.ts` shares project update dates, primary links, and GitHub archive status across Project Index and Timeline.
Use current public GitHub `pushedAt` for Project Index ordering, with authored `pubDate` as the fallback.
Timeline project entries keep their authored publication dates; later milestones are approved log posts, never raw pushes.
Preserve project RSS GUIDs when links change.
The GitHub sync keeps unavailable public snapshots with a status notice and never imports private README content.
GitHub timeline collection writes factual reports only under ignored `.local/timeline/`; it does not select updates or generate drafts.
The manual-only GitHub workflow uploads factual review artifacts; it cannot commit or deploy.
The local Hermes job owns weekly collection and discussion delivery, as described in `docs/timeline-curation.md`.
Review sources and write reader-facing milestones together before running `timeline:approve`.
Keep `githubActivity` source URLs on approved logs so collection can deduplicate them.
See `docs/timeline-curation.md` for the editorial rules and approval path.

## Content and Routes

Collections use `glob` loaders and Zod schemas.
Use `entry.id`, `render(entry)` from `astro:content`, and `getStaticPaths()` for generated detail routes.

| Collection | Public detail route | Content |
| --- | --- | --- |
| `projects` | `/projects/${entry.id}/` | Curated metadata and optional synced README |
| `wiki` | `/notes/${entry.id}/` | Concepts, methods, models, essays, references |
| `log` | `/timeline/${entry.id}/` | Public updates and articles |
| `audioshow` | `/audioshow/${entry.id}/` | Episode batches |
| `gallery` | `/gallery/${entry.id}/` | Photography with local image metadata |

- Match frontmatter to the schema, use parseable dates, and choose stable lowercase filenames.
- Keep trailing slashes on internal routes; `trailingSlash: "always"` is configured.
- Preserve published legacy URLs with redirect stubs using `noindex, follow` and canonical targets.
- Keep legacy redirects excluded from the sitemap in `astro.config.mjs`.
- Case-only aliases must be omitted on case-insensitive build filesystems to protect canonical output; use `redirectsForFilesystem()` and verify with `check:routes`.

## UI, Theme, and Accessibility

- Keep the minimal style: content sits directly on the page, and whitespace, size, weight, and the three text tokens do the separating; do not add borders, rules, boxes, chips, shadows, framed cards, or decorative hover effects.
  Keep a line only where it gives structure the reader uses, such as the `.spine` line and entry dots on dated lists (Timeline, Projects; `src/style/global.css`); remove lines that are only visual effect.
- Titles use `--text-main`, sentences `--text-muted`, and metadata `--text-faint`; visible text is at least 12px.
- Metadata is one line: fields joined by ` · `, items within a field by `, `; uppercase and tracking only for dates and short enums (lane, kind, status); authored text keeps its case. Lists use `formatDateCompact`, detail headers `formatDateLong`.
- Do not show counts of items already visible, provenance labels (GitHub push, README sync), or labels that restate a value or the page title; section labels use the homepage "Selected" style.
- Mark the current filter, tab, or view with `--text-main` and a 1px underline, never a fill, box, or weight change; buttons expose `aria-pressed`, and tab links `aria-current="page"`.
- Filter, view, and tab controls use the sidebar's `[ Label ]` form, with the brackets `aria-hidden`; standalone links use plain words, and off-site links end with ↗ plus sr-only "(external)".
- On phones, avoid stacking controls in several rows: filter and tab bars use `.scroll-row` (`src/style/global.css`), one line that scrolls sideways below md and wraps above it; call `revealInRow()` from `src/scripts/scrollRow.ts` when the current control changes so it stays in view.
- Use existing CSS variables for colors: `--bg-body`, `--text-main`, `--text-muted`, `--text-faint`, `--border-main`, `--border-subtle`, and `--accent`.
- Resolve theme before first paint: dark by default, regardless of system preference; only an explicit `localStorage.theme` of `light` from the toggle overrides it.
- Keep both themes working and initialization consistent with transition handling in `MinimalLayout.astro`.
- Use `<ClientRouter />`, attach page handlers on `astro:page-load`, and prevent duplicate listeners across navigation.
- Use buttons for actions and links for navigation; preserve keyboard controls, the skip link, and `main#main-content` focus behavior.

## Markdown and Media

- Use `.post-content` for rendered Markdown and `.wiki-content` for denser notes; extend shared styles before adding one-off rules.
- Text blocks in `.post-content` are capped at about 38rem for a 70-80 character measure; tables, code, images, and display math keep the full column.
- Keep tables, code, and display math horizontally scrollable within their containers, without page overflow.
- Markdown tables use one header rule and faint row lines, with no vertical lines, fills, or uppercase headers; headings, images, inline code, and code blocks have no borders, and the Prism fill is a code block's only edge.
- Notes and Gallery also apply Tailwind Typography `prose`; `post.css` sets explicit values for the borders and pseudo-content `prose` adds (table rows, blockquote border, inline-code backticks).
- Preserve custom scrollbar colors, size, and thumb (the track has no border), and `.post-content .katex { position: relative; }`, which contains hidden MathML inside scrolling equations and tables.
- Pass `math={hasMath}` for math notes so `SiteHead` loads local, package-matched KaTeX CSS and font preloads only when needed; keep fonts out of inline CSS.
- `src/utils/rehypeImages.mjs`, registered in `astro.config.mjs`, adds lazy loading and async decoding to Markdown and raw HTML images, plus responsive local AudioShow variants and remote referrer policies.
  Local Markdown images get srcset widths and `sizes`; the first image in a document loads eagerly with high fetch priority.
- `src/utils/rehypeKatexErrors.mjs` prints any KaTeX parse error during the build without throwing (a throw would make the content loader ship an empty article); `check:routes` rejects built pages that contain `katex-error`, which blocks the deploy.
- `src/utils/rehypeUnitSpaces.mjs` joins numbers and units with a no-break space outside code, math, and headings.
- Fonts are vendored in `public/fonts/` with `font-display: swap`; do not load Google Fonts.
- Give new images appropriate dimensions, `sizes`, decoding, loading, and fetch priority; use `referrerpolicy="no-referrer"` and a fallback for remote images where supported.
- Gallery sources belong in `src/assets/gallery/` with schema-valid local paths using Astro's `image()` helper.
- Give each Gallery entry one primary subject from `src/data/galleryCategories.ts`: Landscapes (wide environments), Nature & Wildlife (plants and animals in detail), People & Street, City & Culture (built places and cultural objects), or Night Sky.
  Keep `featured` independent of the subject; the two filters combine, and sort order remains independent.
- Write Gallery locations in English as `Site, City or Region`, using one consistent name per place; use ` · ` only between separate destinations.
  Preserve the known level of precision for city-only records, routes, and sites that span boundaries; do not invent a more specific shooting location.
- Prioritize the first gallery thumbnail and let native lazy loading discover the remaining visible images; defer lightbox `src` assignment until interaction using `data-src`.
- Generated site images live under `/images/_generated/site/`; AudioShow WebP variants under `/images/audioshow/_generated/` use 96/192px for rows and 320px for cards/player artwork.
- The homepage uses responsive AVIF with WebP fallback; keep gallery photograph quality intact and verify image formats by measurement.

## AudioShow and Player

- Author batches in `src/content/audioshow/` using the existing episode format, rather than one file per episode.
- `src/utils/parseAudioshow.ts` parses episodes; `src/utils/loadEpisodes.ts` loads batches; `sortEpisodesDesc()` orders newest first.
- Optional batch fields include `Audio Preview` / `Preview Audio`, `Project Links`, and a fourth metadata bullet for composer.
- The player UI is `src/components/AudioPlayer.astro`; `src/scripts/audioPlayer.ts` coordinates the typed queue, provider, artwork, and view modules in `src/scripts/audio/`.
- Player title and artist text live in one inner span; write it with `setMarqueeText()` from `src/scripts/audio/marquee.ts`, which scrolls overflowing text once per track and never moves under reduced motion.
- `src/utils/rehypeAudioPreview.mjs` moves an episode's `Audio Preview` URL onto its cover as `data-audio-url` and removes the raw link paragraph; it also renders episode headings as "EP 51" and drops the "Project Links" label above a link list, leaving the Markdown unchanged for the parser.
- Author artwork with `data-audio-url`; `src/scripts/audio/batch.ts` binds accessible playback after page load.
- Keep each crate in `src/data/audioshow-crates/`, using its shared types; register it in `src/data/audioshowCrates.ts`.
- Preserve `transition:persist` on `#audio-player-bar` and state on `window.__audioPlayerState` across navigation.
- Load artwork for the visible player only; preload neighboring covers only during playback, respecting visibility and data-saving connections.
- `src/utils/defaultAudioTrack.ts` supplies `window.__defaultAudioShowTrack` at build time.
- Start playback with `window.playTrack({ type, url, title, artist, artwork })`; `type` is `apple` for Apple Music lookup or `local` for direct audio URLs.
- Keep legacy `window.toggleMusic(playerType, url)` compatibility, but do not embed scripts or inline handlers in episode batches.
- For new UI, use `data-*` attributes and listeners instead of inline event handlers.

## Verification

- Run the relevant parser fixtures, Astro/TypeScript diagnostics, or production build from the command list above.
- For rendered changes, inspect desktop and mobile in a dev or production preview, including the real interaction path.
- The dev server can keep serving a component's previous `<style>` block after an edit; restart it before judging a style change.
- For typography, check `/notes/policy-gradient/` with its math and table, and `/projects/muse/` for README tables, code, and rules; verify document overflow and container scrolling separately.
- For route or data changes, check both the relevant index and detail page.
- Fix related failures and report unrelated failures without expanding scope.
- Pull-request CI runs types, parser and unit checks, a production build, route validation, browser interactions, and performance budgets before deployment is eligible.
- Browser checks own their preview and Chromium lifecycle, use deterministic provider/audio fixtures, and write screenshots under `.local/browser-check/`.
- CI enforces the gzip budgets in `scripts/check-performance.mjs`; measure before raising a limit, and compare Lighthouse medians of at least three runs as described in `README.md`.

## Personal Knowledge Base

- For the user's papers, books, notes, or prior discussions, query `~/power/` with `obsidian vault="power" <command>`.
- Maintain the vault when the user shares materials or asks to compile/add them; answer general knowledge directly and do not save routine Q&A.
