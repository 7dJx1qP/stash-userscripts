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