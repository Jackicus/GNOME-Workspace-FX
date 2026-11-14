---
paths:
  - "src/lib/titles.js"
  - "src/lib/title.js"
  - "src/lib/editor.js"
  - "src/lib/names.js"
  - "src/lib/titlesPrefs.js"
  - "src/stylesheet.css"
---

# Titles

`WorkspaceFxTitles` (`src/lib/titles.js`): the name of a workspace, in large
type, shown with the shell's workspace switcher popup (the dots) when it is switched to,
and edited in place to name the current one. `title.js` is one monitor's title inside the
popup, `names.js` keeps GNOME's `workspace-names` with their workspaces, `editor.js` is
the title as an entry with clear and confirm buttons, and `titlesPrefs.js` is the Titles
page.

## How it fits together

- **The title lives inside the shell's own popup.** `titles.js` wraps
  `WorkspaceSwitcherPopup.prototype.display` (`ui/workspaceSwitcherPopup.js`, an exported
  class) with the `InjectionManager`; the first `display` of each popup adds one
  `WorkspaceFxTitle` per monitor the dots are on, *before* calling the original.
  The popup's `_redisplayAllPopups` calls `redisplay(index)` on every child, so the title
  updates, fades and is destroyed with the dots. Only keyboard switches put the popup up,
  so only they show a title; renaming puts one up itself.
- **Same container as the dots**: the title's box carries `workspace-switcher` as well as
  its own classes. Blur my Shell finds popup boxes by that class when the popup is added
  to `uiGroup` and blurs them, and Just Perfection's theme restyles it; both reach the
  title only because it is there by the first `display`. Our CSS sets only margins and
  type size.
- **Names** are `org.gnome.desktop.wm.preferences workspace-names`, never a key of ours.
  Mutter matches them by position, so `names.js` keeps a list of the `Meta.Workspace`s and,
  on `notify::n-workspaces` (emitted on every add and removal, a lowered static
  `num-workspaces` included, which emits no `workspace-removed`), rewrites the key so each
  name stays with its workspace. A workspace added at the end takes the first stored name
  past the old ones, as it would by position (names left from the last session apply
  again). The name of a workspace that closes goes with it.
- **Inserting** (dropping a window between workspaces in the overview, or moving one left
  of the first) is `Main.wm.insertWorkspace(pos)`: it appends a workspace and moves every
  window from `pos` on along by one, so no workspace moves. `titles.js` wraps it to put an
  empty name in at `pos` first (`names.js` `insert`).
- **Hover**: a half-second rest on the Activities button (`Main.panel.statusArea.activities`,
  its `notify::hover`) puts the popup up for the current workspace and shows it again
  every 500 ms, inside the popup's own 600 ms timeout, so it stays while the pointer does
  and fades as a switch's does once it leaves. `_show` is the one way the extension puts a
  popup up (hover and rename): only for a named workspace, never over the overview.
- **Renaming** is a `WorkspaceFxTitleEditor`: a `WorkspaceFxTitle` of its own in
  `uiGroup` (the popup is not reactive and closes itself), holding a `pushModal` grab, on
  the pointer's monitor. Each button is in a clipped `St.Widget` slot whose width eases
  open (an `St.Widget`, so focus navigation reaches it). On save the slots close, then the
  popup is put up and fades in over the editor before it goes. ✕ saves an empty name;
  Escape or a click outside cancels. The box is reactive: Shell 51's focus groups
  navigate with a key controller, which only a reactive actor runs. `titles.js` keeps the
  `Meta.Workspace`, not its index, while the editor is open. The popup it puts up afterwards is destroyed when any other
  popup displays, so a quick switch never shows two.
- **The editor's colours are ours**: an extension's rule outranks every theme rule, even
  `!important`, so `stylesheet.css` sets the entry's and buttons' colours for the popup's
  dark surface (dark in both schemes); an inset focus ring draws only over a background.

## Settings

In `org.gnome.shell.extensions.workspace-fx.titles`: `enabled` (app.js builds and
destroys the whole part on it), `rename-shortcut` (`['<Super>F2']`, grabbed with `Main.wm.addKeybinding`),
`show-indicator` (true: the pencil in the top bar), `indicator-position` (`left`, right
of the Activities button; `center`, right of the clock; `right`), `show-on-hover` (true),
`title-position` (`top`, `center`), `title-size` (`small`, `large`, `huge`). A title's settings are read when a popup is
made, so a change shows on the next switch.

## Running next to other extensions

- Just Perfection's "workspace popup" off replaces `display` with a destroy: no popup, no
  title. Workspace Matrix shows its own popup instead of the shell's: no title either.
- Anything else that rewrites `workspace-names` on removal would shift names twice.
- The screen lock disables the extension (`session-modes` is `user`): a workspace that closes while
  locked is not followed, and the names after it shift by one.
