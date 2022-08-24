// ==UserScript==
// @name        Stash StashID Input
// @description Adds input for entering new stash id to performer details page and studio page
// @version     0.1
// @author      7dJx1qP
// @match       *localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/blob/master/src\StashUserscriptLibrary.js
// ==/UserScript==

(function () {
    'use strict';

    const {
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getElementsByXpath,
    } = window.stash;

    const stash = new Stash();

    async function updatePerformerStashIDs(performerId, stashIds) {
        const reqData = {
            "variables": {
                "input": {
                    "stash_ids": stashIds.map(stashId => ({
                        "endpoint": "https://stashdb.org/graphql",
                        "stash_id": stashId
                    })),
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

    async function updateStudioStashIDs(studioId, stashIds) {
        const reqData = {
            "variables": {
                "input": {
                    "stash_ids": stashIds.map(stashId => ({
                        "endpoint": "https://stashdb.org/graphql",
                        "stash_id": stashId
                    })),
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

    stash.addEventListener('page:performer', function () {
        waitForElementId('performer-details-tabpane-details', function (elementId, el) {
            if (!document.getElementById('update-stashids')) {
                const performerId = window.location.pathname.replace('/performers/', '');

                const stashIdInput = document.createElement('input');
                stashIdInput.classList.add('query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control');
                stashIdInput.setAttribute('id', 'update-stashids');
                stashIdInput.setAttribute('placeholder', 'Add StashID…');
                stashIdInput.addEventListener('change', () => {
                    const newStashId = stashIdInput.value.replace('https://stashdb.org/performers/', '');
                    stashIdInput.value = '';
                    if (!newStashId) return;

                    getPerformerStashIDs(performerId).then(data => {
                        const stashIds = data.data.findPerformer.stash_ids.map(({ endpoint, stash_id }) => stash_id);
                        if (stashIds.indexOf(newStashId) !== -1) return;
                        if (!confirm(`Add StashID ${newStashId}?`)) return;
                        stashIds.push(newStashId);
                        console.log('stashIds', stashIds, performerId, newStashId, stashIds.indexOf(newStashId) !== -1);
                        updatePerformerStashIDs(performerId, stashIds);
                        window.location.reload();
                    });
                });
                el.appendChild(stashIdInput);
            }
        });
    });

    stash.addEventListener('page:studio:scenes', function () {
        waitForElementByXpath("//div[contains(@class, 'studio-details')]", function (xpath, el) {
            if (!document.getElementById('studio-stashids')) {
                const container = document.createElement('div');
                container.setAttribute('id', 'studio-stashids');
                console.log(xpath, el);
                el.appendChild(container);
                const studioId = window.location.pathname.replace('/studios/', '');
                console.log('studio', studioId, el);

                const stashIdInput = document.createElement('input');
                stashIdInput.classList.add('query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control');
                stashIdInput.setAttribute('id', 'update-stashids');
                stashIdInput.setAttribute('placeholder', 'Add StashID…');
                stashIdInput.addEventListener('change', () => {
                    const newStashId = stashIdInput.value;
                    stashIdInput.value = '';
                    if (!newStashId) return;

                    getStudioStashIDs(studioId).then(data => {
                        const stashIds = data.data.findStudio.stash_ids.map(({ endpoint, stash_id }) => stash_id);
                        if (stashIds.indexOf(newStashId) !== -1) return;
                        if (!confirm(`Add StashID ${newStashId}?`)) return;
                        stashIds.push(newStashId);
                        console.log('stashIds', stashIds, studioId, newStashId, stashIds.indexOf(newStashId) !== -1);
                        updateStudioStashIDs(studioId, stashIds);
                        window.location.reload();
                    });
                });
                container.appendChild(stashIdInput);

                getStudioStashIDs(studioId).then(data => {
                    console.log(data.data.findStudio.stash_ids);
                    for (const { endpoint, stash_id } of data.data.findStudio.stash_ids) {
                        const url = endpoint.replace(/graphql$/, 'studios/') + stash_id
                        console.log(endpoint, stash_id, url);
                        const row = document.createElement('div');
                        row.classList.add('col-9');
                        row.innerHTML = `<ul class="pl-0">
<li class="row no-gutters">
<a href="${url}" target="_blank" rel="noopener noreferrer">${stash_id}</a>
</li>
</ul>`;
                        container.appendChild(row);
                    }
                });
            }
        });
    });
})();