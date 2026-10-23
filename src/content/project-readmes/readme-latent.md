---
project: "latent"
repo: "Audiofool934/latent"
sourceUrl: "https://github.com/Audiofool934/latent"
syncedAt: "2026-10-23T13:29:05.465Z"
---

# Latent

A personal photographic workspace for rediscovery, curation, and new work.

Project page: [latent.audiofool.ai](https://latent.audiofool.ai)

Latent is a macOS app for photographers with a large archive of RAW and JPEG files.
It builds a fast local index of previews and metadata, so you can browse the whole archive without downloading originals.
You can search photos by meaning, find related pictures across years, grade and caption them, and arrange selections into Sequences.
Originals stay where they are: on a local disk, an external drive, or a mounted cloud drive.

![The Latent library window: a timeline sidebar and a grid of photos filtered by date and rating](https://raw.githubusercontent.com/Audiofool934/latent/main/assets/screenshots/latent-library.webp)

> **Status: developer preview.**
> Latent runs from a source checkout on Apple Silicon Macs with macOS 26.
> There is no packaged download yet.

## Features

* **Archive browsing.**
  A photo-first masonry gallery and a year, month, and day timeline, tested with more than 40,000 photos.
  Browsing reads only local previews and never moves, renames, or rewrites originals.
* **Semantic search.**
  Search by text in any language, or by a reference image.
  Sort results by most similar, least similar, or more variety, and open similar photos from any picture.
* **Two search engines.**
  Use [Gemini Embedding 2](https://github.com/Audiofool934/latent/blob/main/docs/gemini-embeddings.md) through the Gemini API, or [EmbeddingGemma 2](https://github.com/Audiofool934/latent/blob/main/docs/local-embeddings.md) running on your Mac.
  Each engine keeps its own index, and you switch between them explicitly.
* **Review.**
  Star ratings, pick and reject flags, captions, Starred photos, and filters by date, rating, Starred, and flag.
  Keyboard shortcuts cover preview (Space), ratings (0-5), flags (Q and R), and navigation (W and E).
* **Sequences.**
  Ordered selections in nested folders, with drag and drop.
  Sequences can be exported as folders of symbolic links to the originals.
* **Imports.**
  Add camera cards or folders and build previews for ARW, JPEG, HEIF/HIF, PNG, and TIFF.
  Copy originals into an archive folder with verified checksums.
* **Editing handoff.**
  Prepare a batch for DxO PhotoLab and save finished photos next to their originals.
* **Timelapse organizer.**
  Find interval-shooting sequences from EXIF data and collapse them into one entry in the timeline.
* **Curator.**
  Explain why photos are related and discover visual motifs across years, grounded in stored embeddings and EXIF data.
* **Recoverable changes.**
  Trash with restore, a user workspace kept apart from the rebuildable index, and non-destructive workspace export and import.

## Privacy

Latent has no accounts and no telemetry.
The catalog, previews, vectors, and your ratings, captions, and Sequences stay on your Mac.

What leaves your Mac depends on the search engine:

| Engine             | Sent off the Mac                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Gemini Embedding 2 | 512-pixel contact previews when you build the index, plus search text and reference images |
| EmbeddingGemma 2   | Nothing                                                                                    |

Building an index always starts with a review of the photo count, and for Gemini the upload size and estimated cost.
Imports never start it automatically.
The Gemini API key is kept in your login Keychain or read from the environment.
Latent never writes it to its own files, databases, or logs, and never returns it from the local service.

## Requirements

* An Apple Silicon Mac with macOS 26 or later.
* Xcode or the Command Line Tools with Swift 6.2 or later.
* Python 3.11 or later and [uv](https://docs.astral.sh/uv/).
* [ExifTool](https://exiftool.org) for photo metadata: `brew install exiftool`.

Optional:

* A [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key) for Gemini search.
* A llama.cpp build with EmbeddingGemma 2 support for on-device search; see [local search](https://github.com/Audiofool934/latent/blob/main/docs/local-embeddings.md).
* [CloudDrive2](https://www.clouddrive2.com) for archives on cloud storage.
* DxO PhotoLab for the editing handoff.

## Getting started

Clone the repository, install the Python environment, and build the app:

```bash
git clone https://github.com/Audiofool934/latent.git
cd latent
uv sync
scripts/build-macos.sh
open var/native/Latent.app
```

The build script creates an ad hoc signed app at `var/native/Latent.app`.
The app uses this checkout's Python environment, so rebuild it if you move the project.
Opening the app starts a local service on `127.0.0.1:8766`, and quitting the app stops it.
Latent keeps its data in `~/Library/Application Support/Latent/`.

Then, in the app:

1. Open **Imports** and choose **Add folders…** to add camera folders, then **Build previews**.
2. Use **Locations** to connect existing archive folders or a mounted cloud drive.
3. Open **AI Search** to choose a search engine and build its index.

### Gemini search

In **AI Search**, choose **Add API Key…** on the Gemini row and paste your key.
Latent saves it in your login Keychain, so it works when you open the app from the Dock.
From a terminal, `uv run latent gemini-key set` does the same, and `gemini-key status` shows where the key comes from.
`GEMINI_API_KEY` or `GOOGLE_API_KEY` in the service environment takes precedence over the Keychain.

### On-device search

EmbeddingGemma 2 needs no API key.
Download the pinned model files, then point Latent at a compatible `llama-server`:

```bash
uv run latent local-encoder fetch --model-dir ~/Library/Application\ Support/Latent/models/embeddinggemma-2
uv run latent local-encoder setup --llama-server /path/to/llama-server --model-dir ~/Library/Application\ Support/Latent/models/embeddinggemma-2
```

Then build, validate, and activate its index in **AI Search**.
See [local search](https://github.com/Audiofool934/latent/blob/main/docs/local-embeddings.md) for the llama.cpp requirement and the validation steps.

## Command line

The `latent` command manages the same data as the app.
Run `uv run latent --help` for every command and option.

| Command                                | Purpose                                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `serve`                                | Run the local service for the app and the web gallery                |
| `scan-tree`, `scan`, `work`            | Catalog a CloudDrive archive and build previews in a resumable queue |
| `embedding-build`, `embedding-status`  | Build and inspect a search index                                     |
| `local-encoder`, `search-backend`      | Set up on-device search and switch engines                           |
| `gemini-key`                           | Save, check, or remove the Gemini API key in the login Keychain      |
| `timelapse-audit`, `scan-jpeg`         | Find interval-shooting candidates and plan missing JPEG additions    |
| `workspace-export`, `workspace-import` | Back up and merge ratings, captions, and Sequences                   |

## How it works

Latent separates your data into three layers:

1. **The archive.** Your originals and sidecars, which browsing and search only read.
2. **A rebuildable index.** Metadata, contact and preview images, and search vectors in a local SQLite catalog and cache.
   You can delete it and rebuild it from the archive.
3. **The workspace.** Ratings, captions, flags, Sequences, imports, and search history, stored apart from the index.

A Python service in `src/latent` owns all three layers.
The native client in `macos/` is built with SwiftUI and AppKit and talks to the service over loopback HTTP.
The same service also serves a browser gallery at `http://127.0.0.1:8766`.

## Development

```bash
uv sync
uv run pytest
uv run ruff check .
scripts/test-macos.sh
```

To also test the native app starting, reusing, and stopping a real Python service, run:

```bash
LATENT_TEST_PYTHON="$PWD/.venv/bin/python" scripts/test-macos.sh
```

## Documentation

* [Native macOS client](https://github.com/Audiofool934/latent/blob/main/docs/native-macos.md): build, launch, service ownership, and validation.
* [Imports](https://github.com/Audiofool934/latent/blob/main/docs/import-workflow.md): previews, archive copies, and photo embeddings.
* [Locations and editing](https://github.com/Audiofool934/latent/blob/main/docs/archived-photo-editing.md): folders, PhotoLab handoff, and Trash.
* [Gemini search](https://github.com/Audiofool934/latent/blob/main/docs/gemini-embeddings.md) and [on-device search](https://github.com/Audiofool934/latent/blob/main/docs/local-embeddings.md).
* [Workspace format](https://github.com/Audiofool934/latent/blob/main/docs/writable-workspace.md): Sequences, annotations, export, and import.
* [Timelapse audit](https://github.com/Audiofool934/latent/blob/main/docs/timelapse-audit.md) and [JPEG backfill](https://github.com/Audiofool934/latent/blob/main/docs/jpeg-backfill.md).
* Development history: [Phase 0](https://github.com/Audiofool934/latent/blob/main/docs/phase-0-results.md), [Phase 1](https://github.com/Audiofool934/latent/blob/main/docs/phase-1-library-slice.md), [encoder benchmark](https://github.com/Audiofool934/latent/blob/main/docs/embedding-benchmark.md), and the original [product notes](https://github.com/Audiofool934/latent/blob/main/docs/product-notes.zh-CN.md) (Chinese).

## Limitations

* Latent is not packaged or notarized, and the app depends on the checkout's Python environment.
* Cloud archives are supported through CloudDrive2 only.
* Most testing used Sony ARW files.
* Adding words to a reference image search is not available with on-device search yet.

## License

Latent is licensed under the [Apache License 2.0](https://github.com/Audiofool934/latent/blob/main/LICENSE).
