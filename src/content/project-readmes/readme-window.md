---
project: "window"
repo: "Audiofool934/window"
sourceUrl: "https://github.com/Audiofool934/window"
syncedAt: "2026-10-17T02:09:38.546Z"
---

# Window

A menu-bar app for the Mac.
Turn it on and the desktop becomes a room looking out a window.
Turn it off and that layer goes away, and the wallpaper you already had comes back.
The system wallpaper is never replaced.

Outside the glass follows a place, the time, and the live weather.
The sun angle, the clouds, the rain, the snow, and the fog are the real ones for that place.
The sky does not follow the music.

The song stays inside the room.
The album cover stands on the windowsill like a record sleeve while something is playing.
The title and artist sit in small type under the sleeve, and that label can be hidden.
When nothing is playing, the sill is clear, and the window is still the picture.

Spotify is the first source.
The Web API reports whatever is playing on the account, including a phone, a speaker, or the computer.
That path needs a developer app whose owner account has Spotify Premium.
The Mac app can be read locally with AppleScript and no login, but that misses playback on other devices.
Cover art still comes from the track id.

The place is where this Mac is, unless you choose another on the map.
The place stays on the machine, at city level.
Only the latitude and longitude go out, to Open-Meteo, about every fifteen minutes.
The sun is computed on the machine from those coordinates and the clock.

While it is on, one click-through window covers each display, above the wallpaper and below the icons.
It keeps drawing the whole time it is on, including behind other windows.
Turning it off closes those windows and stops the drawing.

The window stays the size you set.
Size in the menu runs from the designed window up to the largest that still sits a little short of the edges.
It stays centered.
What the day did shows in the wall, and in what has taken hold around the frame.
Codex, Claude Code, and Grok Build leave their usage in local logs, and Window reads only those.
A quiet day leaves the plaster a little raw and the joints bare.
Use brings moss into the joints, then a few dry stems, and on a long day some growth and a few small flowers along the frame.
It changes slowly, and then it sits.
It is not a token counter, and nothing is written on the wall.
Rain does not hit the beat.
There is no waveform, and there are no lyrics across the sky.

## For review

Is the sleeve the right size for the song, or should the cover be larger?
Should "now playing" mean the Spotify account, or only the Mac app?
Should the small title be on by default?

## Running it

Build the app and open it:

```bash
bash scripts/build.sh
```

```bash
open dist/Window.app
```

The build needs only the Command Line Tools.
The shader is compiled when the app starts, so no Metal toolchain is required.

`scripts/build.sh` signs ad hoc by default.
macOS ties the Location and Automation approvals to the signature, so an ad-hoc build is asked again after every rebuild.
To keep those approvals, sign with a certificate listed by `security find-identity -v -p codesigning`:

```bash
SIGNING_IDENTITY="Apple Development: Your Name (TEAMID)" bash scripts/build.sh
```

Open at Login works best once the app lives somewhere stable, such as `/Applications`.

On first use macOS asks two questions.
Location gives the city-level sky; without it Window uses the reference city of your time zone.
Place in the menu can stand the window somewhere else instead.
Automation of Spotify lets Window read the current song once at launch; without it Window waits for Spotify's next change notification, which needs no permission.
Window never controls playback, and it never launches Spotify.

### The menu

* **Turn On / Turn Off** opens or closes the room on every display.
* **Show Title** shows or hides the small label under the sleeve.
* **Size** sets how large the opening is, from the designed window up to the largest that still sits a little short of the edges.
* **Place** uses this Mac's location, or a place chosen on the map. The window can stand somewhere you want to be.
* **Window Faces** picks the compass direction of the view; automatically it faces the equator, or west in the tropics, where the sun stands overhead at noon.
* **Music** chooses between Spotify on this Mac and a Spotify account.

### A Spotify account

**Music › Connect Spotify Account…** walks through the account path.
Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), or open one you already have, since Spotify now allows one development-mode Client ID per developer.
Add the Redirect URI `http://127.0.0.1/callback`, tick Web API, and paste the app's Client ID into Window.
Window signs in with Authorization Code and PKCE, so no client secret is involved, and the redirect lands on a loopback port that exists only during sign-in.
The refresh token is kept in the login keychain.
While the room is on, Window asks the account what is playing every few seconds, sooner near the end of a track, and immediately whenever the local Spotify app reports a change.

## How it is built

`Sources/WindowCore` holds everything that runs without the menu bar.

* `Astronomy` computes the sun and the moon from the coordinates and the clock, after the formulas SunCalc uses, and the rotation that keeps the stars fixed to the sky.
* `Weather` fetches Open-Meteo's current conditions with only the rounded coordinates, and turns weather codes, cloud decks, visibility, wind, and snow depth into what the glass shows.
* `Scene` holds the room in real measurements, a 1.8 m window in a thick wall seen from a chair 2.4 m away, and the driver that moves it through time.
  That 1.8 m is the size the window was designed at.
  On screen the size is chosen in the menu, from that designed window up to one that stops a little short of the edges, and it stays centered.
  A quiet day leaves the wall raw, and use lets moss, stems, and a little growth take hold around the frame.
* `Usage` reads the local logs of Codex, Claude Code, and Grok Build and turns the last day of that use into how lived-in the wall looks. Nothing is sent off the machine.
* `Render` and `Shaders/Room.metal` draw it with Metal.
* `Music` has the two Spotify sources and the artwork lookup.
* `Location` asks Location Services for a city-level fix and falls back to the time zone.

`Sources/WindowApp` is the menu-bar app: one desktop window per display, the frame loop, the menu, and settings.
`Sources/WindowLab` renders any date, place, weather, and cover to a PNG, layer by layer, the way the window server composites them.

Each display has three layers.
The glass redraws every frame, at 24 frames a second while rain or snow falls and at 10 otherwise.
The view behind it, sky, cloud, and land, is rendered twice a second at half resolution and crossfaded, since cloud drifts slowly.
The room and the sill redraw only when their light visibly changes or the sleeve moves.
On an M2 Pro driving a 5K display and the built-in display, drizzle costs about 0.1 seconds of GPU time per second and under a tenth of one CPU core.
Low Power Mode halves the frame rates.

## Development

```bash
bash scripts/test.sh
```

```bash
swift run window-lab --out room.png --date 2026-10-02T13:30:00Z --weather storm --flash 0.5 --cover cover.jpg --title "Song" --artist "Artist" --pose 0
```

The lab takes `--weather` presets (clear, fair, partly, cirrus, overcast, drizzle, rain, heavy, storm, snow, fog, haze, frost), `--report` with a saved Open-Meteo report, `--facing`, `--lat` and `--lon`, `--crop`, and `--timing` for per-pass GPU times.
`--opening` sets the hole, and `--growth` sets how lived-in the wall is, from 0 to 1.

Running the app's binary directly takes a few switches for checking it:

* `WINDOW_DEBUG=1` prints frame counts and GPU time each second, and events from the sources; `kill -USR1` then turns the room on or off.
* `WINDOW_SNAPSHOT=<folder>` writes each display's live room to a PNG after a few seconds.
* `WINDOW_DEMO_TRACK=spotify:track:<id>` pretends that track is playing, without touching Spotify.
* `WINDOW_FPS=<n>` pins the frame rate.
* `WINDOW_OPENING=<scale>` fixes the opening and ignores Size in the menu. 0 is the closed wall, 1 is the designed window, and a larger number keeps growing until it is a little short of the screen edge.
