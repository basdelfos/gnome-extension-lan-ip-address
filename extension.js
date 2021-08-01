const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const ShellToolkit = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();


// function _get_lan_ip() {
//     // Ask the IP stack what route would be used to reach 1.1.1.1 (Cloudflare DNS)
//     // Specifically, what src would be used for the 1st hop?
//     var command_output_bytes = GLib.spawn_command_line_sync('ip route get 1.1.1.1')[1];
//     var command_output_string = '';

//     for (var current_character_index = 0;
//         current_character_index < command_output_bytes.length;
//         ++current_character_index)
//     {
//         var current_character = String.fromCharCode(command_output_bytes[current_character_index]);
//         command_output_string += current_character;
//     }

//     // Output of the "ip route" command will be a string
//     // " ... src 1.2.3.4 ..."
//     // So basically we want the next token (word) immediately after the "src"
//     // word, and nothing else. This is considerd our LAN IP address.
//     var Re = new RegExp(/src [^ ]+/g);
//     var matches = command_output_string.match(Re);
//     var lanIpAddress;
//     if (matches) {
//         lanIpAddress = matches[0].split(' ')[1];
//     } else {
//         lanIpAddress = '';
//     }
 
//     return lanIpAddress;
// }

function _get_dev_ip(device) {
    // Ask the IP stack what the current IP address of the device is
    var cmd = 'ip a s ' + device;
    var command_output_bytes = GLib.spawn_command_line_sync(cmd)[1];
    var command_output_string = '';

    for (var current_character_index = 0;
        current_character_index < command_output_bytes.length;
        ++current_character_index)
    {
        var current_character = String.fromCharCode(command_output_bytes[current_character_index]);
        command_output_string += current_character;
    }

    var Re = new RegExp(/([0-9]{1,3}[.]){3}[0-9]{1,3}/g);
    var matches = command_output_string.match(Re);
    var ipAddress = '';
    if (matches) {
        ipAddress = matches[0];
    }
 
    return ipAddress; 
}

const LanIpAddressIndicator = new Lang.Class({
    Name: 'LanIpAddress.indicator',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0.0, "LAN IP Address Indicator", false);

        this.boxLayout = new St.BoxLayout();
        this.iconVpn = new St.Icon({
            style_class: 'system-status-icon',           
        });
        this.iconVpn.set_gicon(Gio.icon_new_for_string(Extension.path + '/network-vpn-symbolic.svg'));
        this.buttonText = new St.Label({
            text: 'Loading...',
            y_align: Clutter.ActorAlign.CENTER
        });

        this.boxLayout.add_child(this.iconVpn);
        this.boxLayout.add_child(this.buttonText);
        this.add_child(this.boxLayout)

        this._updateLabel();
    },

    _updateLabel : function(){
        const refreshTime = 5 // in seconds

        if (this._timeout) {
                Mainloop.source_remove(this._timeout);
                this._timeout = null;
        }
        this._timeout = Mainloop.timeout_add_seconds(refreshTime, Lang.bind(this, this._updateLabel));

        // this.buttonText.set_text(_get_lan_ip());
        var ipAddress = _get_dev_ip('tun0');
        if (ipAddress == '') {
            this.boxLayout.visible = false;
        }
        else {
            this.boxLayout.visible = true;
            this.buttonText.set_text(ipAddress);
        }
        
    },

    _removeTimeout: function () {
        if (this._timeout) {
            this._timeout = null;
        }
    },

    stop: function () {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
        }
        this._timeout = undefined;

        this.menu.removeAll();
    }
});

let _indicator;

function init() {
    log('LAN IP Address extension initialized');
}

function enable() {
    log('LAN IP Address extension enabled');
    _indicator = new LanIpAddressIndicator();
	Main.panel.addToStatusArea('lan-ip-address-indicator', _indicator);
}

function disable() {
    log('LAN IP Address extension disabled');
    _indicator.stop();
    _indicator.destroy();
}
