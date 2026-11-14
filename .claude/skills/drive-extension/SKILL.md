---
name: drive-extension
description: What is particular to driving Workspace FX in the nested GNOME Shell - the start flags that matter here (--clean, --monitors, --stand-in), the settings that change what is drawn, the workspace titles and their editor, a switch animation caught phase by phase, comparing animated frames, measuring, and the README's screenshots. Read the kit's gnome-ext:nested-shell skill first; use this whenever a pattern's look, colours, palettes, opacity, motion, the overview or prefs layout must be SEEN.
---

# Driving Workspace FX in the nested shell

Read **`gnome-ext:nested-shell`** first: the loop, `do` and its steps, `reload` versus
`stop` + `start`, the logs, the preferences and stopping are all there and not repeated
here. This is what differs for Workspace FX.

## What it looks like, and where

The patterns cover the whole desktop of every monitor, behind the windows, and appear
again in the overview's workspace previews, its thumbnail strip and the workspace slide
(`overview on`, or `key Super+Page_Down` for a switch). The titles' pencil is the only
thing in the top bar; everything else visible is a GSettings key. Crop `shot`s to the part
being judged.

The nested session starts with dynamic workspaces and one workspace, where no switch
happens. For the titles and the switch animation give it four, and names, in its own
settings:

```bash
N="./scripts/nested.sh run timeout 5 gsettings"
$N set org.gnome.mutter dynamic-workspaces false
$N set org.gnome.desktop.wm.preferences num-workspaces 4
$N set org.gnome.desktop.wm.preferences workspace-names "['First', '', 'Third']"
```

From zsh, run those under `bash -c` (zsh does not split `$N`).

## In the nested shell

- **`start --clean`** after a `stop` (a running shell is reused as it is) for an
  enable-path check that must not depend on an earlier run.
- **`start --monitors N`** is the only way to check `span-monitors`, the seam between two
  monitors, or the overview's previews on a secondary monitor. Shots and pointer
  coordinates then span all of them.
- **`start --stand-in`** runs a copy of `src/` with a scratch home and fresh settings:
  the `desktop` base is GNOME's default wallpaper and `~/.cache/workspace-fx` is the
  scratch one. For screenshots that are kept.
- **The weather follows GNOME Weather's place**, which the shell keeps in
  `org.gnome.shell.weather` `locations`. `./scripts/nested.sh weather-place` writes a
  stand-in one (Bergen by default; `LATITUDE LONGITUDE` for the nearest GWeather city;
  `none` to clear) into the nested settings only, never a real location. Under
  `--stand-in` a GNOME Weather desktop entry that runs nothing lets the Place row open it.
- **`/prefs`** opens the preferences in the nested shell; `make prefs` opens the user's
  own, never used to test.
- **No shell at all**: `node scripts/shaders.mjs render PATTERN --out $S/x.png
  --frames 3 [--span 2] [--density D]` draws frames of one pattern straight to a PNG
  (`.claude/rules/shaders.md`). Use it for a pattern's look, and while another session
  has the nested shell; come here for motion, the overview and prefs.

## Changing what is drawn

`wallpaper.js` repaints on a key change, without a reload. The schema is not installed
system-wide, so every `gsettings` call names its directory:

```bash
./scripts/nested.sh run timeout 5 gsettings --schemadir src/schemas \
    set org.gnome.shell.extensions.workspace-fx enabled-effects "['aurora']"
```

Useful keys: `enabled-effects` (`as` of catalog ids), `background-mode`
(`desktop`/`accent`/`color`/`image`/`daytime`), `color-palette`, `speed`, `opacity`,
`target-fps`, `pause-when-covered`, `span-monitors`, `parallax`, `pointer-tilt`,
`weather`.

- **Two frames of the same animation are not a comparison.** The patterns move, so a
  before/after pair always differs a little. Judge shape, colour, density and
  brightness, and set `speed` very low if a frame must be comparable.
- **Covering the desktop** (for `pause-when-covered`): `key F11` fullscreens most apps;
  `key Alt+F10` maximizes where a tiling extension has taken `Super+Up`.

## The titles

- **The popup lasts about 0.7 s**: shoot 0.2–0.3 s after the key, in the same `do`.
  The first `shot` after a `start` takes longer than that: take a throwaway one first.
- **Where it is**: the title is centred just below the top bar, its box about y 57–127
  on a 1600x900 monitor at `large` (in the middle with `title-position center`); the
  dots are at the bottom. The pencil is just right of the workspace dots, about x 118
  at y 14 (`indicator-position` `left`, the default).
- **Renaming**: `key Super+F2` (or `click 118 14`) opens the title as an editor with the
  name selected, ✕ left and ✓ right of it; type one `key` per letter (`say` does not
  type), `key Return`. The buttons are about 80 px either side of the name's ends at
  y 92 (`large`, `top`); `key Tab` reaches them.
- **Hover**: `move 40 14` is on the workspace dots (the Activities button), clear of the
  hot corner; the title shows about 0.5 s later and stays until a `move` away.
- **Inserting**: with dynamic workspaces, `click` a window on the first workspace to
  focus it, then `key Super+Shift+Page_Up`; a workspace switch alone leaves no focus.
- **Names following workspaces** needs windows: `./scripts/nested.sh run gjs -m win.js`
  with a few-line Gtk 4 window script in the scratch folder, one per workspace with
  dynamic workspaces on; kill one window's process by pid and its workspace closes.
- **Never test the shortcut capture** in the preferences there: it asks to inhibit
  shortcuts, and the answer is written to the real permission store.
- **On and off**: `org.gnome.shell.extensions.workspace-fx.titles enabled` takes the
  pencil, the shortcut and the titles away and back, live.

## The switch animation

```bash
$N --schemadir src/schemas set org.gnome.shell.extensions.workspace-fx.switch duration 2000
$N --schemadir src/schemas set org.gnome.shell.extensions.workspace-fx.switch scene corridor
./scripts/nested.sh do "shot $S/0.png" "key Super+Page_Down" "wait 0.15" "shot $S/1.png" \
    "wait 0.25" "shot $S/2.png" "wait 0.25" "shot $S/3.png" "wait 0.25" "shot $S/4.png"
```

- **Take a `shot` before the first switch after `start`**: until one, the nested shell
  still reports the overview as visible, so the shell skips the switch animation
  (`_shouldAnimate()`) and nothing of the switch runs.
- **Phases at 2000 ms**: the pull back is the first quarter, the incoming workspace
  appears in the last third. A shot takes about a tenth of a second, so the waits are
  approximate; tile the PNGs into one sheet (`magick … +append`) to judge the run.
- **Direction**: `Super+Page_Down` goes forward, `Super+Page_Up` back (the corridor bends
  and the shaft and warp turn the other way). `Super+Home` returns to the first workspace;
  `Page_Down` on the last does nothing, so a test of quick switches starts from the first.
- **Cancellation**: three `Super+Page_Down` 0.2 s apart each cancel the last; the end is
  the right workspace (the dots at the top left) with nothing left over.
- **Card alignment**: on the shaft, warp and cloud sea, the shader's outline and shadow
  must turn with the workspace; a crossed pair of rectangles is a roll sign wrong.
- **The patterns ride on the cards**: a card that shows the bare wallpaper means the
  wallpaper's `_prepareWorkspaceSwitch` wrap no longer reaches the groups.
- `duration` back with `$N --schemadir src/schemas reset org.gnome.shell.extensions.workspace-fx.switch duration`.

## When it looks wrong, or measuring

- **A pattern that is missing** while the others draw is usually a shader that did not
  compile: `make check` names the line.
- **Measure with the mirror on**: headless never paints (`gnome-ext:nested-shell`).

## The README's screenshots

JPEGs in `docs/screenshots/`: `deep-space.jpg` at 1600×833, `patterns/*.jpg` and
`weather/*.jpg` at 960×500, and the preferences as PNGs taken with `window` in the dark
scheme (`org.gnome.desktop.interface color-scheme prefer-dark` in the nested settings):
`scenes.png` the Scenes page with `weather-place` set, `prefs.png` the Patterns page
scrolled six notches (`enabled-effects` `['wave', 'sparkles', 'constellation']`),
`prefs-titles.png` and `prefs-switching.png` the Titles and Switching pages at their
defaults. Click the window's title bar first: `window` needs it focused. Each
pattern is shown alone over a palette it suits; the particle patterns are cropped close,
and Starfield, Sparkles and Embers are at twice their Amount and 1.5× their Brightness,
which the README says. `titles/switch.jpg` is a `Super+Page_Down` shot onto "Photo Edits"
(names `['Writing', 'Photo Edits', 'Music']`, the switch animation off) cropped below the
top bar (`1600x868+0+32`), and `titles/rename.png` the editor 0.4 s after `key Super+F2`
there (`shot … 500 40 600 110`). Take them from a `start --stand-in` shell, whose `desktop`
base is GNOME's default wallpaper, never the user's; never point `image` at a file of
theirs.
