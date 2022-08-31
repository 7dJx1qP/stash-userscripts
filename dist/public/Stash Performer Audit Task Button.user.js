// ==UserScript==
// @name        Stash Performer Audit Task Button
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds a button to the performers page to run the audit plugin task
// @version     0.3.0
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
    } = unsafeWindow.stash;

    stash.visiblePluginTasks.push('Audit performer urls');

    const settingsId = 'userscript-settings-audit-task';
    const inputId = 'userscript-settings-audit-task-button-visible';

    stash.addEventListener('page:performers', function () {
        waitForElementClass("btn-toolbar", async () => {
            if (!document.getElementById('audit-task')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('mx-2', 'mb-2', await GM.getValue(inputId, false) ? 'd-flex' : 'd-none');
                toolbar.appendChild(newGroup);

                const auditButton = document.createElement("button");
                auditButton.setAttribute("id", "audit-task");
                auditButton.classList.add('btn', 'btn-secondary');
                auditButton.innerHTML = 'Audit URLs';
                auditButton.onclick = () => {
                    stash.runPluginTask("userscript_functions", "Audit performer urls");
                };
                newGroup.appendChild(auditButton);
            }
        });
    });

    stash.addSystemSetting(async (elementId, el) => {
        if (document.getElementById(inputId)) return;
        const settingsHeader = 'Show Audit Performer URLs Button';
        const settingsSubheader = 'Display audit performer urls button on performers page.';
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
    });
})();