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
})();