// ==UserScript==
// @name        Stash Open Media Player
// @description Open scene filepath links in an external media player. Requires userscript_functions stash plugin
// @version     0.1.7
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @grant       GM.getValue
// @grant       GM.setValue
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
// ==/UserScript==

(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
    } = window.stash;

    const MIN_REQUIRED_PLUGIN_VERSION = '0.4.0';

    function openMediaPlayerTask(path) {
        stash.runPluginTask("userscript_functions", "Open in Media Player", {"key":"path", "value":{"str": path}});
    }

    // scene filepath open with Media Player
    stash.addEventListener('page:scene', function () {
        waitForElementClass('scene-file-info', function () {
            const a = getElementByXpath("//dt[text()='Path']/following-sibling::dd/a");
            if (a) {
                a.addEventListener('click', function () {
                    openMediaPlayerTask(a.href);
                });
            }
        });
    });
    
    const settingsId = 'userscript-settings-mediaplayer';

    stash.addSystemSetting(async (elementId, el) => {
        const inputId = 'userscript-settings-mediaplayer-input';
        if (document.getElementById(inputId)) return;
        const settingsHeader = 'Media Player Path';
        const settingsSubheader = 'Path to external media player.';
        const placeholder = 'Media Player Path…';
        const textbox = await stash.createSystemSettingTextbox(el, settingsId, inputId, settingsHeader, settingsSubheader, placeholder, false);
        textbox.addEventListener('change', () => {
            const value = textbox.value;
            if (value) {
                stash.updateConfigValueTask('MEDIAPLAYER', 'path', value);
                alert(`Media player path set to ${value}`);
            }
            else {
                stash.getConfigValueTask('MEDIAPLAYER', 'path').then(value => {
                    textbox.value = value;
                });
            }
        });
        textbox.disabled = true;
        stash.getConfigValueTask('MEDIAPLAYER', 'path').then(value => {
            textbox.value = value;
            textbox.disabled = false;
        });
    });

    stash.addEventListener('stash:pluginVersion', async function () {
        waitForElementId(settingsId, async (elementId, el) => {
            el.style.display = stash.pluginVersion != null ? 'flex' : 'none';
        });
        if (stash.comparePluginVersion(MIN_REQUIRED_PLUGIN_VERSION) < 0) {
            const alertedPluginVersion = await GM.getValue('alerted_plugin_version');
            if (alertedPluginVersion !== stash.pluginVersion) {
                await GM.setValue('alerted_plugin_version', stash.pluginVersion);
                alert(`User functions plugin version is ${stash.pluginVersion}. Stash Open Media Player userscript requires version ${MIN_REQUIRED_PLUGIN_VERSION} or higher.`);
            }
        }
    });
})();