// ==UserScript==
// @name        Stash Studio Image And Parent On Create
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Set studio image and parent when creating from StashDB. Requires userscript_functions stash plugin
// @version     0.3.0
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
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
    } = unsafeWindow.stash;

    stash.userscripts.push('Stash Studio Image And Parent On Create');

    async function runStudioUpdateTask(studioId, endpoint, remoteSiteId) {
        return stash.runPluginTask("userscript_functions", "Update Studio", [{"key":"studio_id", "value":{"str": studioId}}, {"key":"endpoint", "value":{"str": endpoint}}, {"key":"remote_site_id", "value":{"str": remoteSiteId}}]);
    }

    stash.addEventListener('stash:response', function (evt) {
        const data = evt.detail;
        if (data.data?.studioCreate) {
            const studioId = data.data?.studioCreate.id;
            const endpoint = data.data?.studioCreate.stash_ids[0].endpoint;
            const remoteSiteId = data.data?.studioCreate.stash_ids[0].stash_id;
            runStudioUpdateTask(studioId, endpoint, remoteSiteId);
        }
    });

    stash.addEventListener('userscript_functions:update_studio', async function (evt) {
        const { studioId, endpoint, remoteSiteId, callback, errCallback } = evt.detail;
        await runStudioUpdateTask(studioId, endpoint, remoteSiteId);
        const prefix = `[Plugin / Userscript Functions] update_studio: Done.`;
        try {
            await this.pollLogsForMessage(prefix);
            if (callback) callback();
        }
        catch (err) {
            if (errCallback) errCallback(err);
        }
    });

})();