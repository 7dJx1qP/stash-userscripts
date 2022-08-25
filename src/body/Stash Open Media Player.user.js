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

    stash.addEventListener('page:settings:system', function () {
        waitForElementId('userscript-settings', (elementId, el) => {
            const inputId = 'userscript-settings-mediaplayer-input';
            if (!document.getElementById(settingsId)) {
                const section = document.createElement("div");
                section.setAttribute('id', settingsId);
                section.classList.add('card');
                section.style.display = 'none';
                section.innerHTML = `<div class="setting">
<div>
<h3>Media Player Path</h3>
</div>
<div>
<div class="flex-grow-1 query-text-field-group">
<input id="${inputId}" class="bg-secondary text-white border-secondary form-control" placeholder="Media Player Path…">
</div>
</div>
</div>`;
                el.appendChild(section);
                const mediaplayerPathInput = document.getElementById(inputId);
                mediaplayerPathInput.addEventListener('change', () => {
                    const value = mediaplayerPathInput.value;
                    if (value) {
                        stash.updateConfigValueTask('MEDIAPLAYER', 'path', value);
                        alert(`Media player path set to ${value}`);
                    }
                    else {
                        stash.getConfigValueTask('MEDIAPLAYER', 'path').then(value => {
                            mediaplayerPathInput.value = value;
                        });
                    }
                });
                mediaplayerPathInput.disabled = true;
                stash.getConfigValueTask('MEDIAPLAYER', 'path').then(value => {
                    mediaplayerPathInput.value = value;
                    mediaplayerPathInput.disabled = false;
                });
            };
        });
    });
    stash.addEventListener('stash:pluginVersion', function () {
        waitForElementId(settingsId, (elementId, el) => {
            el.style.display = stash.pluginVersion != null ? 'flex' : 'none';
        });
        if (stash.comparePluginVersion(MIN_REQUIRED_PLUGIN_VERSION) < 0) {
            alert(`User functions plugin version is ${stash.pluginVersion}. Stash Open Media Player userscript requires version ${MIN_REQUIRED_PLUGIN_VERSION} or higher.`);
        }
    });
})();