// ==UserScript==
// @name        Stash Performer YAML Details Linkify
// @description Turns urls/filepaths in YAML formatted performer details into links that open in browser/file explorer. Requires userscript_functions stash plugin
// @version     0.1.2
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// @require     https://raw.githubusercontent.com/nodeca/js-yaml/master/dist/js-yaml.js
// ==/UserScript==

/* global jsyaml */

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

    function openExplorerTask(path) {
        stash.runPluginTask("userscript_functions", "Open in File Explorer", {"key":"path", "value":{"str": path}});
    }

    // parse performer details yaml turn paths and urls into links
    stash.addEventListener('page:performer', function () {
        waitForElementId('performer-details-tab-details', function () {
            const detailsEl = getElementByXpath("//dt[text()='Details']/following-sibling::dd");
            if (detailsEl) {
                const doc = jsyaml.load(detailsEl.innerText);
                if (doc.urls) {
                    doc.urls = doc.urls.map(url => `<a href="${url}" target="_blank">${url}</a>`);
                }
                if (doc.paths) {
                    console.log('paths', doc.paths);
                    doc.paths = doc.paths.map(path => `<a class="filepath">${path}</a>`);
                }
                detailsEl.innerHTML = jsyaml.dump(doc, {lineWidth: -1});
                for (const a of detailsEl.querySelectorAll('a.filepath')) {
                    a.style.cursor = 'pointer';
                    a.addEventListener('click', function () {
                        openExplorerTask(a.innerText);
                    });
                }
            }
        });
    });
})();