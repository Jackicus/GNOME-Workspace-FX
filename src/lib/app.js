import { WorkspaceFxSwitch } from './switch.js';
import { WorkspaceFxWallpaper } from './wallpaper.js';

export class WorkspaceFxApp {
    constructor(extension) {
        this._extension = extension;
    }

    enable() {
        this._wallpaper = new WorkspaceFxWallpaper(this._extension);
        this._wallpaper.enable();

        const schema = this._extension.metadata['settings-schema'];
        this._switchSettings = this._extension.getSettings(`${schema}.switch`);
        this._switchSettings.connectObject('changed::enabled', () => this._syncSwitch(), this);
        this._syncSwitch();
    }

    _syncSwitch() {
        const on = this._switchSettings.get_boolean('enabled');
        if (on && !this._switch) {
            this._switch = new WorkspaceFxSwitch(this._extension, this._switchSettings);
            this._switch.enable();
        } else if (!on && this._switch) {
            this._switch.disable();
            this._switch = null;
        }
    }

    disable() {
        this._switchSettings.disconnectObject(this);
        this._switchSettings = null;
        this._switch?.disable();
        this._switch = null;
        this._wallpaper.disable();
        this._wallpaper = null;
    }
}
