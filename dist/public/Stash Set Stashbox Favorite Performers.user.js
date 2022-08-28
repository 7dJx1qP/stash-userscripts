// ==UserScript==
// @name        Stash Set Stashbox Favorite Performers
// @description Set Stashbox favorite performers according to stash favorites. Requires userscript_functions stash plugin
// @version     0.1.3
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @grant       GM.getValue
// @grant       GM.setValue
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
// ==/UserScript==

(function() {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getClosestAncestor,
        updateTextInput,
    } = window.stash;

    const MIN_REQUIRED_PLUGIN_VERSION = '0.5.0';

    stash.visiblePluginTasks.push('Set Stashbox Favorite Performers');

    const settingsId = 'userscript-settings-set-stashbox-favorites-task';
    const inputId = 'userscript-settings-set-stashbox-favorites-button-visible';

    async function runSetStashBoxFavoritePerformersTask() {
        const data = await stash.getStashBoxes();
        if (!data.data.configuration.general.stashBoxes.length) {
            alert('No Stashbox configured.');
        }
        for (const { endpoint } of data.data.configuration.general.stashBoxes) {
            await stash.runPluginTask("userscript_functions", "Set Stashbox Favorite Performers", [{"key":"endpoint", "value":{"str": endpoint}}]);
        }
    }

    async function runSetStashBoxFavoritePerformerTask(endpoint, stashId, favorite) {
        return stash.runPluginTask("userscript_functions", "Set Stashbox Favorite Performer", [{"key":"endpoint", "value":{"str": endpoint}}, {"key":"stash_id", "value":{"str": stashId}}, {"key":"favorite", "value":{"b": favorite}}]);
    }

    stash.addEventListener('page:performers', function () {
        waitForElementClass("btn-toolbar", async function () {
            if (!document.getElementById('stashbox-favorite-task')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('mx-2', 'mb-2', await GM.getValue(inputId, false) ? 'd-flex' : 'd-none');
                toolbar.appendChild(newGroup);

                const button = document.createElement("button");
                button.setAttribute("id", "stashbox-favorite-task");
                button.classList.add('btn', 'btn-secondary');
                button.innerHTML = 'Set Stashbox Favorites';
                button.onclick = () => {
                    runSetStashBoxFavoritePerformersTask();
                };
                newGroup.appendChild(button);
            }
        });
    });

    stash.addEventListener('stash:response', function (evt) {
        const data = evt.detail;
        let performers;
        if (data.data?.performerUpdate?.stash_ids?.length) {
            performers = [data.data.performerUpdate];
        }
        else if (data.data?.bulkPerformerUpdate) {
            performers = data.data.bulkPerformerUpdate.filter(performer => performer?.stash_ids?.length);
        }
        if (performers) {
            for (const performer of performers) {
                for (const { endpoint, stash_id } of performer.stash_ids) {
                    runSetStashBoxFavoritePerformerTask(endpoint, stash_id, performer.favorite);
                }
            }
        }
    });

    stash.addSystemSetting(async (elementId, el) => {
        if (document.getElementById(inputId)) return;
        const settingsHeader = 'Show Set Stashbox Favorites Button';
        const settingsSubheader = 'Display set stashbox favorites button on performers page.';
        const checkbox = await stash.createSystemSettingCheckbox(el, settingsId, inputId, settingsHeader, settingsSubheader);
        checkbox.checked = await GM.getValue(inputId, false);
        checkbox.addEventListener('change', async () => {
            const value = checkbox.checked;
            await GM.setValue(inputId, value);
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
                alert(`User functions plugin version is ${stash.pluginVersion}. Set Stashbox Favorite Performers userscript requires version ${MIN_REQUIRED_PLUGIN_VERSION} or higher.`);
            }
        }
    });

})();