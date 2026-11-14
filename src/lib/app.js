import { WorkspaceFxSwitch } from './switch/switch.js';
import { WorkspaceFxTitles } from './titles/titles.js';
import { WorkspaceFxWallpaper } from './wallpaper.js';

// Each in a child schema of its own, switched on and off by its `enabled` key.
const PARTS = { titles: WorkspaceFxTitles, switch: WorkspaceFxSwitch };

export class WorkspaceFxApp {
    constructor(extension) {
        this._extension = extension;
    }

    enable() {
        this._wallpaper = new WorkspaceFxWallpaper(this._extension);
        this._wallpaper.enable();

        const schema = this._extension.metadata['settings-schema'];
        this._parts = Object.entries(PARTS).map(([name, Part]) => {
            const entry = { settings: this._extension.getSettings(`${schema}.${name}`), part: null };
            const sync = () => {
                const on = entry.settings.get_boolean('enabled');
                if (on && !entry.part) {
                    entry.part = new Part(this._extension, entry.settings);
                    entry.part.enable();
                } else if (!on && entry.part) {
                    entry.part.disable();
                    entry.part = null;
                }
            };
            entry.settings.connectObject('changed::enabled', sync, this);
            sync();
            return entry;
        });
    }

    disable() {
        for (const { settings, part } of this._parts) {
            settings.disconnectObject(this);
            part?.disable();
        }
        this._parts = null;
        this._wallpaper.disable();
        this._wallpaper = null;
    }
}
