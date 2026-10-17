---
project: "sway"
repo: "Audiofool934/sway"
sourceUrl: "https://github.com/Audiofool934/sway"
syncedAt: "2026-10-17T02:09:34.954Z"
---

# Sway

**An instrument you play with your hands.**

The [project status](https://github.com/Audiofool934/sway/blob/main/docs/project-status.md) is the map: where the work stands and what comes next.
The [V1 plan](https://github.com/Audiofool934/sway/blob/main/docs/v1-plan.md) defines the instrument, the rules it is built by, and the milestones.

Someone with no musical training should be able to make a piece they want to keep.
One hand plays a melody on a pitch ladder, with quicker pinches making stronger notes and leaning toward the camera swelling a held note.
The other hand sets the band's energy, cuts it, and loops what was played.
Sway keeps every note in time and in key, and the notes you play are synthesized in the browser, so no network request or large model sits between a gesture and its sound.
The band is generative: Qwen writes its next four bars while the current four play, from what you just played and the energy you set, and MRT2, a music model running on the same Mac, performs the harmony and Qwen's answering lines.
The engine checks every plan and keeps it in key and on the beat, and the built-in band steps in whenever a model is late.
V1 is playable and has had its first test with real hands.
The current candidate adds expressive lead controls, a listening mixer, and a matching tutorial and manual.
The [readiness record](https://github.com/Audiofool934/sway/blob/main/docs/v1-readiness.md) tracks the checks and remaining play tests.

## Play

On the configured development Mac:

```bash
cd ~/Projects/sway
uv run --locked sway serve
```

Open **<http://127.0.0.1:8765>** in Chrome, turn the camera on, and press **Learn to play** for setup and short lessons, or **Start playing** to go straight to a piece.
The camera tutorial includes expression practice; without a camera, it teaches the four core lessons with the mouse and keyboard.
**Leave lesson** returns to free play at any time.
The mirrored camera keeps your body, hands, and room visible for a sense of space.
Subtle hand skeletons and small fingertip markers show which hand controls each part of the instrument.
Without a camera, the mouse plays the lead and the keyboard steers the band; the start screen lists the keys.
Two fists or **End piece** finish a piece, which offers its audio, MIDI, and a performance file to save.
The **Harmony** setting on the start screen picks generated strings, piano, or choir, or the synthesized pad; a chip at the top lights while the generated harmony is playing.
**Band** chooses whether Qwen composes the band's cycles or the built-in patterns play; while a composed cycle plays, "by Qwen" shows under the beat and its caption appears at the bottom.
Qwen needs a DashScope API key in `~/.config/sway/qwen.json`, and `sway doctor` shows whether it is configured; only musical data is sent to it, never camera images.
Press D while playing to see measured tracking, audio timing, and how many bars were generated.
Press M during free play to compare the band's parts in the listening mixer.
Closing it restores the full mix; its extra comparison voices run only while it is open.
Stop the server with Ctrl-C when finished.

The separate [generative theremin experiment](https://github.com/Audiofool934/sway/blob/main/docs/generative-theremin-experiment.md) is at **<http://127.0.0.1:8765/theremin.html>**.
It explores continuous hand control of MRT2's generated sound through sustained movement, short strokes, and rests.
Either hand can play, and pointer input is also available.

For a fresh checkout, use an Apple Silicon Mac, Python 3.12 through [uv](https://docs.astral.sh/uv/), Node.js/npm, and a recent Chrome browser:

```bash
git clone https://github.com/Audiofool934/sway.git
cd sway
uv sync --locked
uv run --locked sway setup
uv run --locked sway doctor
```

`sway setup` installs hand tracking, browser dependencies, and MRT2 for the generated harmony.
`--instrument-only` skips MRT2, and V1 then plays its synthesized pad; the theremin experiment needs MRT2.

## Data and compute

The server listens on loopback.
In the V1 instrument, tracking and sound run in the browser, and camera images never leave the machine.
When Qwen composes the band, the server sends it musical data only: the energy, the chords, and the notes just played.
The theremin experiment sends nothing off the machine.
The Qwen credential stays in backend configuration outside the repository and browser.

Models and experiment outputs are ignored by Git and remain on the development machine.
A clone does not include them.
See [data locations](https://github.com/Audiofool934/sway/blob/main/docs/development.md#data-and-evidence) before moving or archiving the checkout.

## Development

```bash
uv run --locked pytest -q
node --test tests/*.test.js
uv run --locked ruff check src tests
uv run --locked ruff format --check src tests
node_modules/.bin/prettier --check 'web/*.{js,css,html}' 'web/instrument/*.{js,css}'
git diff --check
```

[CI](https://github.com/Audiofool934/sway/blob/main/.github/workflows/ci.yml) runs the same checks on Linux for every pull request and every push to `main`; the test that needs MRT2's model skips there.
The JavaScript tests cover the V1 instrument's timing, harmony, hand tracking, controls, band, looper, camera, engine, generated harmony scheduling, exports, lessons, and the theremin's controls.
These checks do not establish musical quality, recognition accuracy, or how the instrument feels to play.
The [development guide](https://github.com/Audiofool934/sway/blob/main/docs/development.md) maps the source, runtime, and evidence locations.

## Models and attribution

V1 uses MediaPipe to track hands, synthesizes its lead and rhythm in the browser, and can use local MRT2 for harmony and cloud Qwen for composition.

* [Magenta RealTime 2](https://github.com/magenta/magenta-realtime): generated harmony in V1, and the whole sound of the theremin experiment.
* [Qwen](https://www.alibabacloud.com/help/en/model-studio/text-generation): V1's band composer.
* [MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js): browser hand tracking.

See [third-party notices](https://github.com/Audiofool934/sway/blob/main/THIRD_PARTY_NOTICES.md) for attribution and model licensing references.
No license for original Sway code has been selected.
