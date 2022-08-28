// ==UserScript==
// @name        Stash StashID Input
// @description Adds input for entering new stash id to performer details page and studio page
// @version     0.2.1
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
        createElementFromHTML,
    } = window.stash;

    async function updatePerformerStashIDs(performerId, stash_ids) {
        const reqData = {
            "variables": {
                "input": {
                    "stash_ids": stash_ids,
                    "id": performerId
                }
            },
            "query": `mutation PerformerUpdate($input: PerformerUpdateInput!) {
    performerUpdate(input: $input) {
        ...PerformerData
    }
}

fragment PerformerData on Performer {
    id
    stash_ids {
        stash_id
        endpoint
  }
}`
        };
        await stash.callGQL(reqData);
    }

    async function getPerformerStashIDs(performerId) {
        const reqData = {
            "variables": {
                "id": performerId
            },
            "query": `query FindPerformer($id: ID!) {
    findPerformer(id: $id) {
        ...PerformerData
    }
}

fragment PerformerData on Performer {
    id
    stash_ids {
        endpoint
        stash_id
    }
}`
        };
        return stash.callGQL(reqData);
    }

    async function getStudioStashIDs(studioId) {
        const reqData = {
            "variables": {
                "id": studioId
            },
            "query": `query FindStudio($id: ID!) {
    findStudio(id: $id) {
        ...StudioData
    }
}

fragment StudioData on Studio {
    id
    stash_ids {
        endpoint
        stash_id
    }
}`
        };
        return stash.callGQL(reqData);
    }

    async function updateStudioStashIDs(studioId, stash_ids) {
        const reqData = {
            "variables": {
                "input": {
                    "stash_ids": stash_ids,
                    "id": studioId
                }
            },
            "query": `mutation StudioUpdate($input: StudioUpdateInput!) {
    studioUpdate(input: $input) {
        ...StudioData
    }
}

fragment StudioData on Studio {
    id
    stash_ids {
        stash_id
        endpoint
    }
}`
        };
        await stash.callGQL(reqData);
    }

    function toUrl(string) {
        let url;
        
        try {
            url = new URL(string);
        } catch (_) {
            return null;
        }
    
        if (url.protocol === "http:" || url.protocol === "https:") return url;
        return null;
    }

    stash.addEventListener('page:performer:details', function () {
        waitForElementId('performer-details-tabpane-details', async function (elementId, el) {
            if (!document.getElementById('update-stashids-endpoint')) {
                const detailsList = el.querySelector('.details-list');
                const stashboxInputContainer = document.createElement('dt');
                const stashboxInput = document.createElement('select');
                stashboxInput.setAttribute('id', 'update-stashids-endpoint');
                stashboxInput.classList.add('form-control', 'input-control');
                stashboxInputContainer.appendChild(stashboxInput);
                detailsList.appendChild(stashboxInputContainer);

                const data = await stash.getStashBoxes();
                let i = 0;
                for (const { name, endpoint } of data.data.configuration.general.stashBoxes) {
                    i++;
                    const option = document.createElement('option');
                    option.innerText = name || `stash-box: #${i}`
                    option.value = endpoint;
                    stashboxInput.appendChild(option);
                }

                const performerId = window.location.pathname.replace('/performers/', '');

                const stashIdInputContainer = document.createElement('dd');
                const stashIdInput = document.createElement('input');
                stashIdInput.classList.add('query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control');
                stashIdInput.setAttribute('id', 'update-stashids');
                stashIdInput.setAttribute('placeholder', 'Add StashID…');
                stashIdInput.addEventListener('change', () => {
                    const url = toUrl(stashIdInput.value);
                    let newEndpoint;
                    let newStashId;
                    if (url) {
                        for (const option of stashboxInput.options) {
                            if (option.value === url.origin + '/graphql') {
                                newEndpoint = option.value;
                            }
                        }
                        if (!newEndpoint || !url.pathname.startsWith('/performers/')) {
                            alert('Unknown stashbox url.');
                            return;
                        }
                        newStashId = url.pathname.replace('/performers/', '');
                    }
                    else {
                        newEndpoint = stashboxInput.options[stashboxInput.selectedIndex].value;
                        newStashId = stashIdInput.value;
                    }
                    stashIdInput.value = '';
                    if (!newStashId) return;

                    getPerformerStashIDs(performerId).then(data => {
                        const stash_ids = data.data.findPerformer.stash_ids;
                        if (stash_ids.find(({endpoint, stash_id }) => endpoint === newEndpoint && stash_id === newStashId)) return;
                        if (!confirm(`Add StashID ${newStashId}?`)) return;
                        updatePerformerStashIDs(performerId, stash_ids.concat([{ endpoint: newEndpoint, stash_id: newStashId }]));
                        window.location.reload();
                    });
                });
                stashIdInputContainer.appendChild(stashIdInput);
                detailsList.appendChild(stashIdInputContainer);
            }
        });
    });

    stash.addEventListener('page:studio:scenes', function () {
        waitForElementByXpath("//div[contains(@class, 'studio-details')]", async function (xpath, el) {
            if (!document.getElementById('studio-stashids')) {
                const container = document.createElement('div');
                container.setAttribute('id', 'studio-stashids');
                container.classList.add('row', 'pl-3');
                el.appendChild(container);

                const stashboxInput = document.createElement('select');
                stashboxInput.setAttribute('id', 'update-stashids-endpoint');
                stashboxInput.classList.add('form-control', 'input-control', 'mt-2', 'col-md-4');

                const data = await stash.getStashBoxes();
                let i = 0;
                for (const { name, endpoint } of data.data.configuration.general.stashBoxes) {
                    i++;
                    const option = document.createElement('option');
                    option.innerText = name || `stash-box: #${i}`
                    option.value = endpoint;
                    stashboxInput.appendChild(option);
                }

                const studioId = window.location.pathname.replace('/studios/', '');

                const stashIdInput = document.createElement('input');
                stashIdInput.classList.add('query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control', 'mt-2', 'col-md-8');
                stashIdInput.setAttribute('id', 'update-stashids');
                stashIdInput.setAttribute('placeholder', 'Add StashID…');
                stashIdInput.addEventListener('change', () => {
                    const url = toUrl(stashIdInput.value);
                    let newEndpoint;
                    let newStashId;
                    if (url) {
                        for (const option of stashboxInput.options) {
                            if (option.value === url.origin + '/graphql') {
                                newEndpoint = option.value;
                            }
                        }
                        if (!newEndpoint || !url.pathname.startsWith('/studios/')) {
                            alert('Unknown stashbox url.');
                            return;
                        }
                        newStashId = url.pathname.replace('/studios/', '');
                    }
                    else {
                        newEndpoint = stashboxInput.options[stashboxInput.selectedIndex].value;
                        newStashId = stashIdInput.value;
                    }
                    stashIdInput.value = '';
                    if (!newStashId) return;

                    getStudioStashIDs(studioId).then(data => {
                        const stash_ids = data.data.findStudio.stash_ids;
                        if (stash_ids.find(({endpoint, stash_id }) => endpoint === newEndpoint && stash_id === newStashId)) return;
                        if (!confirm(`Add StashID ${newStashId}?`)) return;
                        updateStudioStashIDs(studioId, stash_ids.concat([{ endpoint: newEndpoint, stash_id: newStashId }]));
                        window.location.reload();
                    });
                });
                container.appendChild(stashIdInput);
                container.appendChild(stashboxInput);

                getStudioStashIDs(studioId).then(data => {
                    for (const { endpoint, stash_id } of data.data.findStudio.stash_ids) {
                        const url = endpoint.replace(/graphql$/, 'studios/') + stash_id
                        const row = document.createElement('div');
                        row.classList.add('col-md-12', 'pl-1');
                        row.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${stash_id}</a>`;
                        container.appendChild(row);
                    }
                });
            }
        });
    });
})();