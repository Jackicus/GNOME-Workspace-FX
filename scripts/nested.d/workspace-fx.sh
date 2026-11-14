# Workspace FX's own nested.sh commands, sourced by the kit's scripts/nested.sh.
#
#   ./scripts/nested.sh weather-place [LATITUDE LONGITUDE | none]
#                                     set GNOME Weather's place, as the shell keeps it in
#                                     org.gnome.shell.weather locations, in the nested
#                                     session's own settings, for the Time of Day base's
#                                     sun: the GWeather city nearest the point (default
#                                     60.39 5.32, Bergen, a stand-in); none clears it
#

cmd_weather_place() {
    require_running
    local value='@av []' script
    if [[ "${1:-}" != none ]]; then
        script="$RUN_DIR/weather-place.js"
        cat > "$script" <<'EOF'
import GLib from 'gi://GLib';
import GWeather from 'gi://GWeather?version=4.0';
import System from 'system';
const [latitude, longitude] = System.programArgs.map(Number);
const city = GWeather.Location.get_world().find_nearest_city(latitude, longitude);
print(new GLib.Variant('av', [city.serialize()]).print(true));
EOF
        value="$(gjs -m "$script" "${1:-60.39}" "${2:-5.32}")"
    fi
    nested_env timeout 5 gsettings set org.gnome.shell.weather locations "$value"
    nested_env timeout 5 gsettings get org.gnome.shell.weather locations
}
