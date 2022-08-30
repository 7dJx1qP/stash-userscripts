(function() {
    'use strict';

    const DELAY = 200;

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getElementsByXpath,
        getClosestAncestor,
        createElementFromHTML,
        updateTextInput,
        sortElementChildren,
    } = window.stash;

    let running = false;
    const buttons = [];

    const datePattern = /\d{4}\-\d{2}\-\d{2}/g;

    const COLORS = {
        'green': '#0f9960',
        'red': '#ff7373',
        'yellow': '#d9822b'
    };

    function colorizeSearchItem(searchItem) {
        const searchResultItem = searchItem.querySelector('li.search-result.selected-result.active');
        if (!searchResultItem) return;

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

        const {
            remoteUrlNode,
            remoteId,
            remoteUrl,
            remoteData,
            urlNode: matchUrlNode,
            detailsNode,
            imageNode,
            titleNode,
            dateNode,
            studioNode,
            performerNodes: matchPerformerNodes,
            matches
        } = stash.parseSearchResultItem(searchResultItem);

        const includeTitle = document.getElementById('colorize-title').checked;
        const includeDate = document.getElementById('colorize-date').checked;
        const includeStashID = document.getElementById('colorize-stashid').checked;
        const includeURL = document.getElementById('colorize-url').checked;
        const includeDetails = document.getElementById('colorize-details').checked;
        const includeStudio = document.getElementById('colorize-studio').checked;
        const includePerformers = document.getElementById('colorize-performers').checked;

        if (includeTitle && titleNode) {
            titleNode.firstChild.style.color = COLORS.yellow;
            if (data?.title) {
                titleNode.firstChild.style.color = titleNode.innerText === data.title ? COLORS.green : COLORS.red;
            }
        }

        if (includeDate && dateNode) {
            dateNode.style.color = COLORS.yellow;
            if (data?.date) {
                dateNode.style.color = dateNode.innerText === data.date ? COLORS.green : COLORS.red;
            }
        }

        if (includeStashID && remoteUrlNode) {
            remoteUrlNode.style.color = COLORS.yellow;
            if (data?.stash_ids?.length) {
                remoteUrlNode.style.color = data.stash_ids.find(o => o.stash_id === remoteUrlNode.innerText) ? COLORS.green : COLORS.red;
            }
        }

        if (includeDetails && detailsNode) {
            detailsNode.style.color = COLORS.yellow;
            if (data?.details) {
                detailsNode.style.color = detailsNode.innerText === data.details ? COLORS.green : COLORS.red;
            }
        }

        if (includeURL && matchUrlNode) {
            matchUrlNode.firstChild.style.color = COLORS.yellow;
            if (data?.url) {
                matchUrlNode.firstChild.style.color = matchUrlNode.innerText === data.url ? COLORS.green : COLORS.red;
            }
        }

        const performerTags = Array.from(performerNodes);
        performerTags.forEach(performerTag => performerTag.style.backgroundColor = COLORS.red);

        for (const {
            matchType,
            matchNode,
            data: matchData
        } of matches) {
            const subNode = matchNode.querySelector('b');
            const nodeToColor = subNode.firstChild.nodeType === Node.TEXT_NODE ? subNode : subNode.firstChild;
            let matched = false;
            if (matchType === 'performer') {
                const performer = data?.performers?.find(performer => performer.id === matchData.stored_id);
                if (performer) {
                    matched = true;
                    const performerTag = performerTags.find(performerTag => performerTag.innerText === performer.name);
                    if (performerTag) {
                        performerTag.style.backgroundColor = COLORS.green;
                    }
                }
            }
            else if (matchType === 'studio' && data?.studio?.id === matchData.stored_id) {
                matched = true;
            }
            if ((includeStudio && matchType === 'studio') || (includePerformers && matchType === 'performer')) {
                nodeToColor.style.color = matched ? COLORS.green : COLORS.red;
            }
        }

    }

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const searchItem = getClosestAncestor(button, '.search-item');
            colorizeSearchItem(searchItem);
            setTimeout(run, 50);
        }
        else {
            stop();
        }
    }

    const btnId = 'metadata-highlight';
    const startLabel = 'Highlight';
    const stopLabel = 'Stop Highlight';
    const btn = document.createElement("button");
    btn.setAttribute("id", btnId);
    btn.classList.add('btn', 'btn-primary', 'ml-3');
    btn.innerHTML = startLabel;
    btn.onclick = () => {
        if (running) {
            stop();
        }
        else {
            start();
        }
    };

    function start() {
        btn.innerHTML = stopLabel;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        running = true;
        buttons.length = 0;
        for (const button of document.querySelectorAll('.btn.btn-primary')) {
            if (button.innerText === 'Save') {
                buttons.push(button);
            }
        }
        run();
    }

    function stop() {
        btn.innerHTML = startLabel;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        running = false;
    }

    stash.addEventListener('tagger', evt => {
        const el = evt.detail;
        if (!document.getElementById(btnId)) {
            const container = el.parentElement;
            container.appendChild(btn);
            sortElementChildren(container);
            el.classList.add('ml-3');
        }
    });

    const colorizeConfigId = 'colorize-config';

    stash.addEventListener('tagger:configuration', evt => {
        const el = evt.detail;
        if (!document.getElementById(colorizeConfigId)) {
            const configContainer = el.parentElement;
            const colorizeConfig = createElementFromHTML(`
<div id="${colorizeConfigId}" class="col-md-6 mt-4">
<h5>Colorize Configuration</h5>
<div class="row">
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-title" class="form-check-input" data-default="true">
            <label title="" for="colorize-title" class="form-check-label">Title</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-date" class="form-check-input" data-default="true">
            <label title="" for="colorize-date" class="form-check-label">Date</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-stashid" class="form-check-input" data-default="true">
            <label title="" for="colorize-stashid" class="form-check-label">Stash ID</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-url" class="form-check-input" data-default="true">
            <label title="" for="colorize-url" class="form-check-label">URL</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-details" class="form-check-input" data-default="true">
            <label title="" for="colorize-details" class="form-check-label">Details</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-studio" class="form-check-input" data-default="true">
            <label title="" for="colorize-studio" class="form-check-label">Studio</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="colorize-performers" class="form-check-input" data-default="true">
            <label title="" for="colorize-performers" class="form-check-label">Performers</label>
        </div>
    </div>
</div>
</div>
            `);
            configContainer.appendChild(colorizeConfig);
            loadSettings();
        }
    });

    async function loadSettings() {
        for (const input of document.querySelectorAll(`#${colorizeConfigId} input`)) {
            input.checked = await GM.getValue(input.id, input.dataset.default === 'true');
            input.addEventListener('change', async () => {
                await GM.setValue(input.id, input.checked);
            });
        }
    }

    stash.addEventListener('tagger:mutation:add:remoteperformer', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:remotestudio', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:local', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:container', evt => colorizeSearchItem(evt.detail.node));
    stash.addEventListener('tagger:mutation:add:subcontainer', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));

})();