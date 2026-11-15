import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { SCENES } from './switch/scenes.js';

// The Switching page. Its own process's code: Gtk and Adw only.
export function switchPage(settings) {
    const page = new Adw.PreferencesPage({ title: 'Switching', icon_name: 'object-flip-horizontal-symbolic' });

    const top = new Adw.PreferencesGroup();
    const enabled = new Adw.SwitchRow({
        title: 'Switch Animation',
        subtitle: 'A workspace switch as a camera move through a scene',
    });
    settings.bind('enabled', enabled, 'active', Gio.SettingsBindFlags.DEFAULT);
    top.add(enabled);
    const choices = [...SCENES.map(s => [s.id, s.name]), ['random', 'A Different One Each Time']];
    const scene = new Adw.ComboRow({
        title: 'Scene',
        subtitle: 'What a workspace switch passes through',
        model: Gtk.StringList.new(choices.map(([, name]) => name)),
    });
    const syncScene = () => (scene.selected = choices.findIndex(([id]) => id === settings.get_string('scene')));
    settings.connect('changed::scene', syncScene);
    syncScene();
    scene.connect('notify::selected', () => settings.set_string('scene', choices[scene.selected][0]));
    top.add(scene);
    page.add(top);

    const motion = new Adw.PreferencesGroup({ title: 'Motion' });
    const duration = Adw.SpinRow.new_with_range(400, 2000, 50);
    duration.set({ title: 'Duration', subtitle: 'Milliseconds for a switch to the next workspace' });
    settings.bind('duration', duration, 'value', Gio.SettingsBindFlags.DEFAULT);
    motion.add(duration);
    const rate = Adw.SpinRow.new_with_range(0, 30, 1);
    rate.set({
        title: 'Scene Drawings per Second',
        subtitle: 'Anime holds each drawing; 0 draws every frame',
    });
    settings.bind('step-rate', rate, 'value', Gio.SettingsBindFlags.DEFAULT);
    motion.add(rate);
    page.add(motion);

    const style = new Adw.PreferencesGroup({ title: 'Style' });
    for (const [key, title, subtitle] of [
        ['focus-lines', 'Focus Lines', 'Speed lines while the camera races'],
        ['impact-frame', 'Impact Frame', 'One inverted drawing as the new workspace arrives'],
    ]) {
        const row = new Adw.SwitchRow({ title, subtitle });
        settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
        style.add(row);
    }
    page.add(style);

    for (const row of [scene, motion, style])
        settings.bind('enabled', row, 'sensitive', Gio.SettingsBindFlags.GET);
    return page;
}

