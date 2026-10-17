---
project: "filo"
repo: "Audiofool934/filo"
sourceUrl: "https://github.com/Audiofool934/filo"
syncedAt: "2026-10-17T02:09:21.514Z"
---

# filo

**Less setup. More listening.**

filo is a free, open-source menu bar companion for your Mac and USB DAC.
macOS runs an output device at one fixed sample rate, so a 44.1 kHz album played through a DAC left at 192 kHz is resampled on the way.
filo watches what Apple Music is playing and switches your DAC to the matching sample rate, and to a suitable bit depth when the source depth is known.
You keep listening in your usual player and spend less time in Audio MIDI Setup.

**[Download for Mac](https://github.com/Audiofool934/filo/releases/latest/download/filo-macos-universal.dmg)** · [Install guide](https://github.com/Audiofool934/filo/blob/main/docs/INSTALL.md) · [User guide](https://github.com/Audiofool934/filo/blob/main/docs/USAGE.md)

macOS 14.4 or later · Apple Silicon and Intel · Developer ID signed and notarized by Apple · MIT license

<p>
  <img referrerpolicy="no-referrer" decoding="async" loading="lazy" src="https://raw.githubusercontent.com/Audiofool934/filo/main/docs/images/filo-card.jpg" width="340" alt="filo's rounded menu bar card showing Apple Music connected to a WALKMAN at 192 kHz, Matched, 24-bit" />
</p>

## What it does

* **Follows your music.** In Apple Music, filo matches supported sample rates both up and down, and picks an output format with enough precision for the track's known integer bit depth.
* **Stays simple.** Choose your player and your DAC, then turn on one switch.
* **Stays out of the way.** A small ƒ in the menu bar opens a fixed-size card; there is no Dock icon or main window.
* **Cleans up after itself.** Disconnecting or quitting restores the output settings filo changed, unless you changed them yourself in the meantime.
* **Looks at home.** Native Liquid Glass on macOS 26, with material fallbacks on earlier versions, and a small listening scene for CD, studio, hi-fi, and higher rates.

The scenes are decoration, not sound-quality ratings.

## Player support

| Player      | What filo does                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Apple Music | Matches the rate automatically, using the track's local file when Music exposes one, or Music's lossless decoder diagnostics otherwise. |
| Spotify     | Applies a fixed 44.1 kHz music profile. Spotify's per-track format is not detected.                                                     |
| Either      | Lets you pick a fixed rate manually in Settings.                                                                                        |

When the source format is unknown or your DAC does not support it, filo leaves the output rate unchanged and says so on the card.

## Quick start

1. [Download the DMG](https://github.com/Audiofool934/filo/releases/latest/download/filo-macos-universal.dmg), open it, and drag **filo** to **Applications**.
2. Connect your USB DAC, and turn on its USB DAC mode if it has one.
3. Open filo, click **ƒ** in the menu bar, and choose **Music** and your DAC in the bottom row.
4. Turn on the switch, allow filo to read Music if macOS asks, and play a lossless track.

Connecting makes your DAC the Mac's default output.
The default path needs no extra audio driver, recording permission, or administrator access.
After sleep or unplugging the DAC, turn the switch on again.
See the [user guide](https://github.com/Audiofool934/filo/blob/main/docs/USAGE.md) for statuses, settings, and troubleshooting.

## What "Matched" means

**Matched** means the DAC's hardware rate equals the source rate filo observed.
It is not a certification of bit-perfect playback or of an audible difference.

* Detection relies on evidence Apple Music happens to expose; it can arrive a moment after a track starts, or not at all.
* The first moments of a track can play at the previous rate, and a DAC can briefly go quiet while it switches.
* Your player still handles playback, so its volume, EQ, and other effects remain yours to manage.

The [validation record](https://github.com/Audiofool934/filo/blob/main/docs/VALIDATION.md) lists exactly what has and has not been measured.

## Privacy

filo has no accounts, analytics, or network features, and it never uploads or records your music.
It reads playback state from your player through macOS Automation and keeps that information in memory.
It saves only your player and output choices as app preferences, plus small recovery records that let it restore your output settings after an unexpected exit.

## Experimental audio paths

**Direct relay** and **Exclusive preview** in Settings route the player's audio through filo itself.
They need extra permissions, and Exclusive preview needs [BlackHole 2ch](https://github.com/ExistentialAudio/BlackHole) and a compatible DAC.
They are research features, not recommended for everyday listening; read the [Exclusive preview guide](https://github.com/Audiofool934/filo/blob/main/docs/EXCLUSIVE-PREVIEW.md) first.

## Documentation

| Guide                                                                                         | For                                                             |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [Install](https://github.com/Audiofool934/filo/blob/main/docs/INSTALL.md)                     | Downloading, first launch, updating, and removing filo.         |
| [User guide](https://github.com/Audiofool934/filo/blob/main/docs/USAGE.md)                    | The card, statuses, settings, permissions, and troubleshooting. |
| [Exclusive preview](https://github.com/Audiofool934/filo/blob/main/docs/EXCLUSIVE-PREVIEW.md) | The experimental exclusive output path and its limits.          |
| [Architecture](https://github.com/Audiofool934/filo/blob/main/docs/ARCHITECTURE.md)           | How filo is built and where its guarantees stop.                |
| [Validation](https://github.com/Audiofool934/filo/blob/main/docs/VALIDATION.md)               | What has been tested, on what, and with what result.            |
| [All documentation](https://github.com/Audiofool934/filo/blob/main/docs/README.md)            | Laboratory, release process, research notes, and more.          |

## Feedback

[Tell us how filo works with your DAC](https://github.com/Audiofool934/filo/issues/new/choose), including your macOS version, player, DAC model, and what happened.
**••• → Connection details → Copy diagnostics** gives a summary you can review before posting.
You never need to share music files.
Report security issues privately as described in [SECURITY.md](https://github.com/Audiofool934/filo/blob/main/SECURITY.md).

## Build from source

You need Xcode 26 or later, or the Command Line Tools with the macOS 26 SDK.

```sh
git clone https://github.com/Audiofool934/filo.git
cd filo
bash scripts/build.sh
open dist/filo.app
```

filo is written in Swift with SwiftUI, AppKit, and CoreAudio, plus a small C audio bridge, and has no third-party runtime dependencies.
See [CONTRIBUTING.md](https://github.com/Audiofool934/filo/blob/main/CONTRIBUTING.md) for tests and project conventions, and [Distribution](https://github.com/Audiofool934/filo/blob/main/docs/DISTRIBUTION.md) for signed releases.

## License and acknowledgments

filo is released under the [MIT License](https://github.com/Audiofool934/filo/blob/main/LICENSE).
Its implementation is original and uses public Apple APIs.
[LosslessSwitcher](https://github.com/vincentneo/LosslessSwitcher) and [Choritsu](https://github.com/jcongaku/apple-music-lossless-eq) informed the early feasibility research; no code from either project is included.
The name comes from the Italian word for "thread".
