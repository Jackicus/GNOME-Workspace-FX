---
paths:
  - "src/lib/switch/**"
---

# The switch animation

`WorkspaceFxSwitch` (`src/lib/switch/switch.js`) turns a workspace switch into a camera
move through a cel-shaded scene: the current workspace pulls back into the scene, the
camera races through it, and the new workspace zooms in until it fills the screen.
`view.js` is one monitor's switch (`WorkspaceFxSwitchView`: the shader backdrop and two
cards), `shader.js` a `Clutter.ShaderEffect` class per scene (JS name
`WorkspaceFxSwitch_<id>`, kept across disable and enable), `scenes.js` the catalogue, the
shared GLSL and the camera path (pure: the preferences and `scripts/shaders.mjs` import
it), one module per scene (`corridor.js`, `shaft.js`, `warp.js`, `sky.js`), and
`prefs.js` the Switching page.

## How a switch runs

1. Mutter emits `switch-workspace`; the shell calls `Main.wm._workspaceAnimation.animateSwitch`,
   which `switch.js` has replaced on the instance (put back on disable only while still ours).
2. `play()` lets the controller's own `_prepareWorkspaceSwitch([from, to])` build its
   `MonitorGroup`s (window clones and wallpaper per workspace, the grab, unredirect), then
   moves the two `WorkspaceGroup`s of each monitor into a `WorkspaceFxSwitchView` at the
   bottom of that monitor group. Sticky windows stay in the shell's sticky group above.
3. Each view eases its own `progress` 0 → 1 (`LINEAR`; the easing is in `cameraAt()`),
   so the animations switch and slow-down factor apply. The primary monitor's completion
   calls `_finishWorkspaceSwitch` and mutter's `onComplete`, as the shell does.
4. Mutter's `kill-switch-workspace` (a new switch, the overview) goes through the shell's
   `cancelSwitchAnimation`, which destroys the monitor groups and our views with them.
5. Anything that throws in `play()` finishes the half-made switch and falls back to the
   shell's slide.

Touchpad swipes are the shell's (`_switchWorkspaceBegin/Update/End`), untouched.

## The scene contract

A scene module exports `glsl`, defining `vec3 scene(vec2 uv, float dp)`, `vec3 sceneInk()`
and `vec3 sceneLine()`, plus `fog`, `focus` (focus-line strength), `reveal` (the depth at
which the incoming workspace starts to show), `offset(depth, dir)` (where the centre line
is at that depth, in screen units), `roll(p, dir)` and `vanish(dir)`. `uv` is in units of
half the screen's height, already rolled; `dp` is one pixel in those units.

- **Everything in scene units.** A workspace is `HALF` tall and fills the screen at
  distance `HALF`. The camera path is `cameraAt(p, run)`; `run` grows with the number
  of workspaces jumped.
- **The scene steps, the cards do not.** `u_cam` and `u_frame` come from progress held at
  `step-rate` drawings a second; the cards, their shadows and the roll move every frame.
- **Colour** is neutrals moved toward the accent with `tint()`, and the accent itself
  (`St.ThemeContext.get_accent_color()`, read per switch). No hard-coded hue.
- **No `fwidth`**: GLSL ES 1.00 has no derivatives without an extension. Antialiasing
  widths are worked out from depth (`dp * z`, times the grazing factor on a wall).
- **Names GLSL already has**: `noise`, `noise2`… are built-ins and `half` is reserved;
  `scripts/shaders.mjs` catches these, where the shell would only draw black.
- **Roll sign**: the card actors take `rotation_angle_z = roll` in degrees and the shader
  takes `u_roll = roll` in radians; the card outlines drawn in the shader line up only so.

## Motion

Switch durations are 400–2000 ms (default 900), stated in CLAUDE.md; a jump across several
workspaces takes up to half as long again.

## Settings

In `org.gnome.shell.extensions.workspace-fx.switch`: `enabled` (off, app.js disables the
part and the shell's slide is back), `scene` (`corridor`, `shaft`, `warp`, `sky`,
`random`), `duration` (ms), `step-rate` (scene drawings a second, 0 = every frame),
`focus-lines`, `impact-frame`.

## Gotchas

- **A uniform wider than a vec4** (an array) cannot go through `set_uniform_float()`:
  it is written to the effect's pipeline in `vfunc_paint_target`, as the patterns'
  `src/lib/shader.js` does.
- **The wallpaper's `overview.js` also wraps this controller** (`_prepareWorkspaceSwitch`);
  the patterns it adds ride inside the workspace groups the switch moves.
- **Verifying**: motion is judged in the nested shell, with four static workspaces and
  `duration` 2000 to catch the phases (`.claude/skills/drive-extension/SKILL.md`).
- **The shell's workspace switcher pop-up** shows over the scene; it is the shell's own.
