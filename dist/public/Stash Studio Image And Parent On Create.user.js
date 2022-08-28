// ==UserScript==
// @name        Stash Studio Image And Parent On Create
// @description Set studio image and parent when creating from StashDB. Requires userscript_functions stash plugin
// @version     0.1.4
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
    } = window.stash;

    function runStudioUpdateTask(studioId, endpoint, remoteSiteId) {
        stash.runPluginTask("userscript_functions", "Update Studio", [{"key":"studio_id", "value":{"str": studioId}}, {"key":"endpoint", "value":{"str": endpoint}}, {"key":"remote_site_id", "value":{"str": remoteSiteId}}]);
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

})();