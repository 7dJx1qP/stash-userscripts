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
    } = unsafeWindow.stash;

    const MIN_REQUIRED_PLUGIN_VERSION = '0.6.0';

    const TASK_NAME = 'Set Stashbox Favorite Performers';
    stash.visiblePluginTasks.push(TASK_NAME);

    const settingsId = 'userscript-settings-set-stashbox-favorites-task';
    const inputId = 'userscript-settings-set-stashbox-favorites-button-visible';

    async function runSetStashBoxFavoritePerformersTask() {
        const data = await stash.getStashBoxes();
        if (!data.data.configuration.general.stashBoxes.length) {
            alert('No Stashbox configured.');
        }
        for (const { endpoint } of data.data.configuration.general.stashBoxes) {
            if (endpoint !== 'https://stashdb.org/graphql') continue;
            await stash.runPluginTask("userscript_functions", "Set Stashbox Favorite Performers", [{"key":"endpoint", "value":{"str": endpoint}}]);
        }
    }

    async function runSetStashBoxFavoritePerformerTask(endpoint, stashId, favorite) {
        if (endpoint !== 'https://stashdb.org/graphql') return;
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
            if (performers.length <= 10) {
                for (const performer of performers) {
                    for (const { endpoint, stash_id } of performer.stash_ids) {
                        runSetStashBoxFavoritePerformerTask(endpoint, stash_id, performer.favorite);
                    }
                }
            }
            else {
                runSetStashBoxFavoritePerformersTask();
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

    stash.addEventListener('stash:plugin:task', async function (evt) {
        const { taskName, task } = evt.detail;
        if (taskName === TASK_NAME) {
            const taskButton = task.querySelector('button');
            if (!taskButton.classList.contains('hooked')) {
                taskButton.classList.add('hooked');
                taskButton.addEventListener('click', evt => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    runSetStashBoxFavoritePerformersTask();
                });
            }
        }
    });

})();