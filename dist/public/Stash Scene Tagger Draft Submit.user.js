// ==UserScript==
// @name        Stash Scene Tagger Draft Submit
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds button to Scene Tagger to submit draft to stashdb
// @version     0.1.1
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
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
        getElementsByXpath,
        getClosestAncestor,
        insertAfter,
        createElementFromHTML,
    } = unsafeWindow.stash;

    document.body.appendChild(document.createElement('style')).textContent = `
    .search-item > div.row:first-child > div.col-md-6.my-1 > div:first-child { display: flex; flex-direction: column; }
    .submit-draft { order: 5; }
    `;

    async function submitDraft(sceneId, stashBoxIndex) {
        const reqData = {
            "variables": {
                "input": {
                    "id": sceneId,
                    "stash_box_index": stashBoxIndex
                }
            },
            "operationName": "SubmitStashBoxSceneDraft",
            "query": `mutation SubmitStashBoxSceneDraft($input: StashBoxDraftSubmissionInput!) {
                submitStashBoxSceneDraft(input: $input)
            }`
        }
        const res = await stash.callGQL(reqData);
        return res?.data?.submitStashBoxSceneDraft;
    }

    async function initDraftButtons() {
        const data = await stash.getStashBoxes();
        let i = 0;
        const stashBoxes = data.data.configuration.general.stashBoxes;

        const nodes = getElementsByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']");
        const buttons = [];
        let node = null;
        while (node = nodes.iterateNext()) {
            buttons.push(node);
        }
        for (const button of buttons) {
            const searchItem = getClosestAncestor(button, '.search-item');
            const {
                urlNode,
                url,
                id,
                data,
                nameNode,
                name,
                queryInput,
                performerNodes
            } = stash.parseSearchItem(searchItem);

            const draftButtonExists = searchItem.querySelector('.submit-draft');
            if (draftButtonExists) {
                continue;
            }

            const submit = createElementFromHTML('<div class="mt-2 text-right submit-draft"><button class="btn btn-primary">Submit StashDB Draft</button></div>');
            const submitButton = submit.querySelector('button');
            button.parentElement.parentElement.appendChild(submit);
            submitButton.addEventListener('click', async () => {
                const selectedStashbox = document.getElementById('scraper').value;
                if (!selectedStashbox.startsWith('stashbox:')) {
                    alert('No stashbox source selected.');
                    return;
                }
                const selectedStashboxIndex = parseInt(selectedStashbox.replace(/^stashbox:/, ''));
                const existingStashId = data.stash_ids.find(o => o.endpoint === stashBoxes[selectedStashboxIndex].endpoint);
                if (existingStashId) {
                    alert(`Scene already has StashID for ${stashBoxes[selectedStashboxIndex].endpoint}.`);
                    return;
                }
                const draftId = await submitDraft(id, selectedStashboxIndex);
                const draftLink = createElementFromHTML(`<a href="${stashBoxes[selectedStashboxIndex].endpoint.replace(/graphql$/, 'drafts')}/${draftId}" target="_blank">Draft: ${draftId}</a>`);
                submitButton.parentElement.appendChild(draftLink);
                submitButton.remove();
            });
        }
    }

    stash.addEventListener('page:studio:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initDraftButtons);
    });

    stash.addEventListener('page:performer:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initDraftButtons);
    });

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initDraftButtons);
    });
})();