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