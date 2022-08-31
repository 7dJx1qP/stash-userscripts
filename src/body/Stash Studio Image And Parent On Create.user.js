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