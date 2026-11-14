---
paths:
  - "src/lib/sun.js"
  - "src/lib/daytime.js"
  - "scripts/nested.d/**"
---

# The time of day

- **The place** is the first in GNOME Weather's list, as the shell keeps it in
  `org.gnome.shell.weather` `locations`, deserialized with GWeather's own city list. It is
  only read, on the machine: the extension never asks for a location and never goes to
  the network. Without one, the periods start at fixed hours (`HOURS`).
- **`sun.js`** gives the sun's elevation, and so dawn, day, dusk or night, from a place
  and a time. It is pure, so `node` can run it.
- **`Daytime`** is kept by wallpaper.js only while the base is `daytime`: the period of the
  day from `sun.js` at that place (fixed hours without one), with one timer to the next
  change, looked at again on resume and on a new place. `NEAREST` says which picture
  stands in for a period that has none.
- In the nested shell, `./scripts/nested.sh weather-place` sets a stand-in place in the
  nested settings, never a real location.
