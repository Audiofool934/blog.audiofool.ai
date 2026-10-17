---
project: "sketches"
repo: "Audiofool934/sketches"
sourceUrl: "https://github.com/Audiofool934/sketches"
syncedAt: "2026-10-17T02:09:32.157Z"
---

# sketches

A sketchbook of coded animations.
Each piece is its own orphan branch, with its own history.
`main` keeps this index and the command that starts a piece.

## Start a piece

Run this from the main checkout.

```bash
./new-piece lighthouse-sunset
```

That creates branch `piece/lighthouse-sunset` and checks it out at `.pieces/lighthouse-sunset`.
Open `.pieces/lighthouse-sunset/index.html` in a browser.
Commit further changes inside that folder.
They stay on the piece branch.

## Come back to a piece

```bash
git worktree add .pieces/lighthouse-sunset piece/lighthouse-sunset
```

## Put a checkout away

```bash
git worktree remove .pieces/lighthouse-sunset
```

The branch stays.
`.pieces/` is local only and is not committed.

## Where the tools live

`CLAUDE.md` is the map.
`stacks/` holds one note per way of making a picture: `canvas`, `mosaic`, `three`, `blender`, and `film`.
`kits.md` lists outside references.
Those notes stay on `main`.
A piece names its stack in `brief.md` and does not copy them onto its branch.
Do not clone a toolkit into this repo.

## House style

One `index.html` per piece, unless the stack note says otherwise.
Draw every frame from time `t`.
The picture at `t = 0` matches the picture at the end of the loop.
Add a library only when the piece needs it.
Keep the idea, the timing, and what you want to change in `brief.md`.
