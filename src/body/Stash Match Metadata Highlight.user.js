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

        // let myDate = '';

        // let newQuery = queryInput.value;

        // let dateIndex = queryInput.value.search(datePattern);
        // if (dateIndex !== -1) {
        //     myDate = queryInput.value.substring(dateIndex, dateIndex+10);
        // }

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

        if (titleNode) {
            titleNode.firstChild.style.color = COLORS.yellow;
            if (data?.title) {
                titleNode.firstChild.style.color = titleNode.innerText === data.title ? COLORS.green : COLORS.red;
            }
        }

        if (dateNode) {
            dateNode.style.color = COLORS.yellow;
            if (data?.date) {
                dateNode.style.color = dateNode.innerText === data.date ? COLORS.green : COLORS.red;
            }
        }

        if (remoteUrlNode) {
            remoteUrlNode.style.color = COLORS.yellow;
            if (data?.stash_ids?.length) {
                remoteUrlNode.style.color = data.stash_ids.find(o => o.stash_id === remoteUrlNode.innerText) ? COLORS.green : COLORS.red;
            }
        }

        if (detailsNode) {
            detailsNode.style.color = COLORS.yellow;
            if (data?.details) {
                detailsNode.style.color = detailsNode.innerText === data.details ? COLORS.green : COLORS.red;
            }
        }

        if (matchUrlNode) {
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
            nodeToColor.style.color = matched ? COLORS.green : COLORS.red;
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

    stash.addEventListener('tagger:mutation:add:remoteperformer', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:remotestudio', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:local', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));
    stash.addEventListener('tagger:mutation:add:container', evt => colorizeSearchItem(evt.detail.node));
    stash.addEventListener('tagger:mutation:add:subcontainer', evt => colorizeSearchItem(getClosestAncestor(evt.detail.node, '.search-item')));

})();