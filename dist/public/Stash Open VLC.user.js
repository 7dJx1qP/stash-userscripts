// ==UserScript==
// @name        Stash Open VLC
// @description Open scene filepath links in VLC. Requires userscript_functions stash plugin
// @version     0.1.2
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// ==/UserScript==

(function () {
    'use strict';

    const {
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
    } = window.stash;

    const stash = new Stash();

    function openVLCTask(path) {
        stash.runPluginTask("userscript_functions", "Open in VLC", {"key":"path", "value":{"str": path}});
    }

    // scene filepath open with VLC
    stash.addEventListener('page:scene', function () {
        waitForElementClass('scene-file-info', function () {
            const a = getElementByXpath("//dt[text()='Path']/following-sibling::dd/a");
            if (a) {
                a.addEventListener('click', function () {
                    openVLCTask(a.href);
                });
            }
        });
    });
    
    const settingsId = 'userscript-settings-vlcpath';

    stash.addEventListener('page:settings:system', function () {
        waitForElementId('userscript-settings', (elementId, el) => {
            const inputId = 'userscript-settings-vlcpath-input';
            if (!document.getElementById(settingsId)) {
                const section = document.createElement("div");
                section.setAttribute('id', settingsId);
                section.classList.add('card');
                section.style.display = 'none';
                section.innerHTML = `<div class="setting">
<div>
<h3>VLC Path</h3>
</div>
<div>
<div class="flex-grow-1 query-text-field-group">
<input id="${inputId}" class="bg-secondary text-white border-secondary form-control" placeholder="VLC Path…">
</div>
</div>
</div>`;
                el.appendChild(section);
                const vlcPathInput = document.getElementById(inputId);
                vlcPathInput.addEventListener('change', () => {
                    const value = vlcPathInput.value;
                    if (value) {
                        stash.updateConfigValueTask('VLC', 'path', value);
                        alert(`VLC path set to ${value}`);
                    }
                    else {
                        stash.getConfigValueTask('VLC', 'path').then(value => {
                            vlcPathInput.value = value;
                        });
                    }
                });
                vlcPathInput.disabled = true;
                stash.getConfigValueTask('VLC', 'path').then(value => {
                    vlcPathInput.value = value;
                    vlcPathInput.disabled = false;
                });
            };
        });
    });
    stash.addEventListener('stash:plugin', function () {
        waitForElementId(settingsId, (elementId, el) => {
            el.style.display = stash.pluginInstalled ? 'flex' : 'none';
        });
    });
})();