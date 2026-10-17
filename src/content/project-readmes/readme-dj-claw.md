---
project: "dj-claw"
repo: "Audiofool934/dj-claw"
sourceUrl: "https://github.com/Audiofool934/dj-claw"
syncedAt: "2026-10-17T02:09:20.090Z"
---

# DJ Claw

DJ Claw is an open-source framework for long-term music taste memory and
agentic music interaction.

It treats music taste as something that accumulates through repeated
interaction. A DJ Claw agent records listening behavior, conversation, playlist
and queue edits, contextual notes, search findings, and generation feedback.
It distills those signals into personal taste memory, then uses that memory to
drive recommendations, playlists, queue control, explanations, and
music-generation briefs.

```text
interaction -> taste event -> memory distillation -> DJ action -> new interaction
```

## Status

Early public migration. This repository now contains the first reusable slice:
schemas, a small Python runtime, synthetic examples, docs, and tests.

The private prototype has real provider adapters, generated media, browser
sessions, and personal listening memory. Those pieces will be migrated only
after they are separated from private state and account-specific operations.

## Core Ideas

* **Long-term music taste memory:** store durable preferences, disliked
  patterns, scene associations, taste drift, and memory anchors.
* **Interaction event model:** turn listening, skipping, saving, playlist edits,
  queue edits, ratings, search context, and conversation into structured taste
  signals.
* **Memory distillation loop:** compress raw events into session state,
  medium-term trends, and long-term taste memory.
* **Music knowledge layer:** combine local library metadata, world knowledge,
  music search, artist relationships, genre history, reviews, and release
  context.
* **Agentic DJ operations:** recommend tracks, build playlists, manage queues,
  explain choices, and respond to feedback.
* **Recommendation to generation bridge:** convert taste memory into prompts,
  references, constraints, and revision notes for music-generation systems.

## Quick Start

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
pytest

djclaw distill --events examples/synthetic-events.jsonl --profile-id example
djclaw brief --memory examples/synthetic-memory.json --goal "late-night walk"
```

The examples are synthetic and safe to commit. They are meant to exercise the
memory loop without encoding a real person's listening history.

## Repository Layout

```text
docs/
  architecture.md       taste memory and agent loop
  migration.md          public migration boundary and progress
  privacy.md            what must stay out of the public repo
  product-vision.md     human-centered music memory direction
examples/
  synthetic-events.jsonl
  synthetic-memory.json
schemas/
  taste-event.schema.json
  taste-memory.schema.json
  prompt-package.schema.json
  generation-job.schema.json
  rating-event.schema.json
  track.schema.json
src/djclaw/
  distill.py            deterministic event -> memory distillation
  planner.py            memory -> generation brief bridge
  storage.py            JSON/JSONL helpers
tests/
```

## Privacy Boundary

DJ Claw is built around personal music memory, so the public repo must avoid
shipping private data by default. Do not commit OAuth tokens, provider cookies,
browser profiles, generated audio libraries, private listening logs, raw chat
history, personal playlist exports, production queue state, screenshots, or
operational artifacts.

The goal is to open-source the reusable machinery: schemas, interfaces,
distillation logic, agent loops, tests, and safe examples.

## License

MIT
