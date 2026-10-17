---
project: "timbreloom"
repo: "Audiofool934/Timbreloom"
sourceUrl: "https://github.com/Audiofool934/Timbreloom"
syncedAt: "2026-10-17T02:09:36.161Z"
---

<div></div>

<img referrerpolicy="no-referrer" decoding="async" loading="lazy" src="https://raw.githubusercontent.com/Audiofool934/Timbreloom/main/docs/assets/app-icon.png" width="112" alt="Timbreloom app icon" />

# Timbreloom

### A local voice studio for your Mac.

Clone a voice. Keep a performance. Turn speech into text. Bring dialogue to picture.

[![Platform](https://img.shields.io/badge/macOS-26.2%2B-20251f?style=flat-square)](https://github.com/Audiofool934/Timbreloom/blob/main/docs/macos-app.md)
[![Apple Silicon](https://img.shields.io/badge/Apple_Silicon-MLX_%2B_MPS-6e854a?style=flat-square)](https://github.com/Audiofool934/Timbreloom/blob/main/docs/provider-architecture.md)
[![License](https://img.shields.io/badge/License-MIT-6e854a?style=flat-square)](https://github.com/Audiofool934/Timbreloom/blob/main/LICENSE)

[Get started](#get-started) · [User guide](https://github.com/Audiofool934/Timbreloom/blob/main/docs/user-guide.md) · [Mac app](https://github.com/Audiofool934/Timbreloom/blob/main/docs/macos-app.md) · [Architecture](https://github.com/Audiofool934/Timbreloom/blob/main/docs/provider-architecture.md)



![Timbreloom dubbing studio with a generated English project and a shared waveform timeline](https://raw.githubusercontent.com/Audiofool934/Timbreloom/main/docs/assets/dubbing-studio.png)

Timbreloom brings four audio workflows into a native Mac app, with a shared local library and an English interface.
Audio processing runs on your Mac using Qwen3-TTS, Whisper, and Seed-VC.
Download the models you need once, then work offline.

## Four ways to work with a voice

| Workspace            | What you can do                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Voice cloning**    | Save a short reference recording and generate a sentence, a chapter, or a full script in that voice.                    |
| **Voice conversion** | Give an existing audio or video performance a new voice while preserving its rhythm, pauses, and expression.            |
| **Transcription**    | Turn audio or video into editable, timestamped text; export TXT, SRT, or VTT.                                           |
| **Dubbing studio**   | Assign roles and voices, edit lines on a shared timeline, regenerate individual segments, and export WAV, SRT, and MP4. |

| From a reference to a new script                                                                                                                                      | From a recording to editable words                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Voice cloning workspace with a saved sample voice and English script](https://raw.githubusercontent.com/Audiofool934/Timbreloom/main/docs/assets/voice-cloning.png) | ![Transcription workspace with timestamped English segments](https://raw.githubusercontent.com/Audiofool934/Timbreloom/main/docs/assets/transcription.png) |

The screenshots show the actual Mac app using a separate demonstration library.

* **Listen while it works.** Finished speech segments join a continuous playback queue as generation progresses.
* **Keep your work.** Voices, transcripts, projects, and job progress are saved locally; supported jobs resume after a restart.
* **Edit without starting over.** Dubbing caches unchanged segments and lets you retry individual lines.
* **Preserve every line.** Safe duration fitting adjusts playback within 0.8x to 1.25x and reports remaining overlaps without cutting dialogue.
* **Take projects with you.** A `.timbreloom` bundle carries the project, referenced voices, media, and generated audio.

## Get started

Timbreloom is built for **Apple Silicon Macs**.
The current standalone app requires **macOS 26.2 or later**.
This repository provides the source and build tools; the current local binary candidate is development-signed and has not been notarized for public distribution.
See [release validation](https://github.com/Audiofool934/Timbreloom/blob/main/docs/release-readiness.md) for the exact status and testing limits.

### Run from source

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and FFmpeg, then clone this repository.
The main environment uses Python 3.12; Seed-VC uses an isolated Python 3.10 environment.

```bash
brew install uv ffmpeg
git clone https://github.com/Audiofool934/Timbreloom.git
cd Timbreloom
./setup.sh
./start.sh
```

Open [localhost:7865](http://127.0.0.1:7865).
The developer setup downloads all three model groups and prepares the environments, so allow several gigabytes of disk space.
Models and your library are excluded from Git.

### Build the Mac app

After setting up the project:

```bash
.venv/bin/python scripts/build_macos_app.py --install
open ~/Applications/Timbreloom.app
```

This builds a development app connected to your checkout.
For a standalone app with bundled runtimes, see the [Mac build guide](https://github.com/Audiofool934/Timbreloom/blob/main/docs/macos-app.md#build).

## Models, on your terms

The standalone app includes the runtime and downloads **no model weights at launch**.
Open **Models** or press **⌘,** to download, pause, or resume each model separately.
Existing library items remain available to view and edit while a model is missing.

| Model                         | Enables                   | Download size |
| ----------------------------- | ------------------------- | ------------: |
| Qwen3-TTS 0.6B Base, BF16     | Voice cloning and dubbing | About 2.52 GB |
| Whisper Large v3 Turbo, Q4    | Transcription             |  About 464 MB |
| Seed-VC and supporting models | Voice conversion          | About 1.88 GB |

<details>
<summary>See the model manager and storage locations</summary></details>

![Model manager with separate Qwen, Whisper, and Seed-VC downloads](https://raw.githubusercontent.com/Audiofool934/Timbreloom/main/docs/assets/models.png)

The Mac app keeps models in `~/Library/Application Support/Timbreloom/models` and your library in `~/Library/Application Support/Timbreloom/data`.
Replacing the app preserves both.
Source runs use the repository's `models/` and `data/` folders by default.
Set `TIMBRELOOM_MODELS_DIR` or `TIMBRELOOM_DATA_DIR` to use a different location.

Downloads use pinned revisions and verify every file with SHA-256 before enabling a model.
Partial downloads are retained across pauses, connection failures, and app restarts.



## Local by default

The service listens only on `127.0.0.1`.
Local voice cloning, conversion, transcription, and dubbing do not upload your recordings or generated audio.
Microphone access is requested only when you start recording.
The English interface supports multilingual speech and text.

Gemini is an optional text tool for punctuation, cleanup, and translation.
It requires `GEMINI_API_KEY` and explicit confirmation before sending selected text; audio stays local.
Cloud usage may incur charges.
Keep credentials out of source files and Git.

Use your own voice or voices you have explicit permission to use, and disclose AI processing when sharing results.

## Documentation and development

* [User guide](https://github.com/Audiofool934/Timbreloom/blob/main/docs/user-guide.md): the four workflows, long audio, exports, and recovery.
* [Mac app](https://github.com/Audiofool934/Timbreloom/blob/main/docs/macos-app.md): shortcuts, installation, builds, and validation.
* [Provider architecture](https://github.com/Audiofool934/Timbreloom/blob/main/docs/provider-architecture.md): model interfaces, job persistence, and accelerator lifecycle.
* [Project format](https://github.com/Audiofool934/Timbreloom/blob/main/docs/project-format.md): schema, segment caching, roles, and portable bundles.
* [Mac design](https://github.com/Audiofool934/Timbreloom/blob/main/docs/macos-design.md): visual system and interaction checks.
* [Release validation](https://github.com/Audiofool934/Timbreloom/blob/main/docs/release-readiness.md): tested builds, evidence, and remaining limits.

```bash
TIMBRELOOM_DATA_DIR="$(mktemp -d -t timbreloom-tests)" TIMBRELOOM_PRELOAD=0 uv run pytest -q
node --test tests/test_browser_helpers.mjs
.venv/bin/python scripts/e2e_macos.py
.venv/bin/python scripts/e2e_macos.py --models
```

The WebKit checks use an isolated sample library and synthetic ASR.
Real model validation is a separate step described in the Mac build guide.

## License

The independently authored Timbreloom application and integration code is licensed under [MIT](https://github.com/Audiofool934/Timbreloom/blob/main/LICENSE).
Third-party software and model weights retain their own licenses, including GPL-3.0 for the optional Seed-VC engine.
See [third-party notices](https://github.com/Audiofool934/Timbreloom/blob/main/THIRD_PARTY.md) and [Seed-VC integration](https://github.com/Audiofool934/Timbreloom/blob/main/docs/seed-vc-integration.md) for details.
Model weights, personal audio, local libraries, credentials, Python environments, and built applications are not included in this repository.
