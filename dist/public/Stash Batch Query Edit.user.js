// ==UserScript==
// @name        Stash Batch Query Edit
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Batch modify scene tagger search query
// @version     0.4.5
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @grant       GM.getValue
// @grant       GM.setValue
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
// ==/UserScript==

(function() {
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
        createElementFromHTML,
        updateTextInput,
        sortElementChildren,
    } = window.stash;

    let running = false;
    const buttons = [];

    function run(videoExtensions) {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const searchItem = getClosestAncestor(button, '.search-item');
            const {
                data,
                queryInput,
            } = stash.parseSearchItem(searchItem);

            const includeStudio = document.getElementById('query-edit-include-studio').checked;
            const includeDate = document.getElementById('query-edit-include-date').checked;
            const includePerformers = document.querySelector('input[name="query-edit-include-performers"]:checked').value;
            const includeTitle = document.getElementById('query-edit-include-title').checked;
            const applyBlacklist = document.getElementById('query-edit-apply-blacklist').checked;

            const videoExtensionRegexes = videoExtensions.map(s => [new RegExp(`.${s}$`, "gi"), '']);
            const blacklist = [];
            if (applyBlacklist) {
                const blacklistTags = getElementsByXpath("//div[@class='tagger-container-header']//h5[text()='Blacklist']/following-sibling::span/text()")
                let node = null;
                while (node = blacklistTags.iterateNext()) {
                    blacklist.push([new RegExp(node.nodeValue, "gi"), '']);
                }
            }
            blacklist.push([/[_-]/gi, ' ']);
            blacklist.push([/[^a-z0-9\s]/gi, '']);
            if (data.date) {
                blacklist.push([new RegExp(data.date.replaceAll('-', ''), "gi"), '']);
            }

            const filterBlacklist = (s, regexes) => regexes.reduce((acc, [regex, repl]) => {
                return acc.replace(regex, repl);
            }, s)

            const queryData = [];
            if (data.date && includeDate) queryData.push(data.date);
            if (data.studio && includeStudio) queryData.push(filterBlacklist(data.studio.name, blacklist));
            if (data.performers && includePerformers !== 'none') {
                for (const performer of data.performers) {
                    if (includePerformers === 'all' || (includePerformers === 'female-only' && performer.gender.toUpperCase() === 'FEMALE')) {
                        queryData.push(filterBlacklist(performer.name, blacklist));
                    }
                }
            }
            if (data.title && includeTitle) queryData.push(filterBlacklist(data.title, videoExtensionRegexes.concat(blacklist)));

            const queryValue = queryData.join(' ');
            updateTextInput(queryInput, queryValue);

            setTimeout(() => run(videoExtensions), 50);
        }
        else {
            stop();
        }
    }

    const queryEditConfigId = 'query-edit-config';
    const btnId = 'batch-query-edit';
    const startLabel = 'Query Edit All';
    const stopLabel = 'Stop Query Edit';
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
            if (button.innerText === 'Search') {
                buttons.push(button);
            }
        }
        const reqData = {
            "variables": {},
            "query": `query Configuration {
                configuration {
                  general {
                    videoExtensions
                  }
                }
              }`
        }
        stash.callGQL(reqData).then(data => {
            run(data.data.configuration.general.videoExtensions);
        });
    }

    function stop() {
        btn.innerHTML = startLabel;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        running = false;
    }

    stash.addEventListener('tagger:mutations:header', evt => {
        const el = getElementByXpath("//button[text()='Scrape All']");
        if (el && !document.getElementById(btnId)) {
            const container = el.parentElement;
            container.appendChild(btn);
            sortElementChildren(container);
            el.classList.add('ml-3');
        }
    });

    stash.addEventListener('tagger:configuration', evt => {
        const el = evt.detail;
        if (!document.getElementById(queryEditConfigId)) {
            const configContainer = el.parentElement;
            const queryEditConfig = createElementFromHTML(`
<div id="${queryEditConfigId}" class="col-md-6 mt-4">
<h5>Query Edit Configuration</h5>
<div>
    <div class="align-items-center form-group">
        <div class="form-check">
            <input type="checkbox" id="query-edit-include-date" class="form-check-input" data-default="true">
            <label title="" for="query-edit-include-date" class="form-check-label">Include Date</label>
        </div>
        <small class="form-text">Toggle whether date is included in query.</small>
    </div>
    <div class="align-items-center form-group">
        <div class="form-check">
            <input type="checkbox" id="query-edit-include-studio" class="form-check-input" data-default="true">
            <label title="" for="query-edit-include-studio" class="form-check-label">Include Studio</label>
        </div>
        <small class="form-text">Toggle whether studio is included in query.</small>
    </div>
    <div class="align-items-center form-group">
        <div class="form-check">
            <input type="radio" name="query-edit-include-performers" id="query-edit-include-performers-all" value="all" class="form-check-input" data-default="true">
            <label title="" for="query-edit-include-performers-all" class="form-check-label mr-4">Include All Performers</label>
            <input type="radio" name="query-edit-include-performers" id="query-edit-include-performers-female-only" value="female-only" class="form-check-input" data-default="false">
            <label title="" for="query-edit-include-performers-female-only" class="form-check-label mr-4">Female Only</label>
            <input type="radio" name="query-edit-include-performers" id="query-edit-include-performers-none" value="none" class="form-check-input" data-default="false">
            <label title="" for="query-edit-include-performers-none" class="form-check-label">No Performers</label>
        </div>
        <small class="form-text">Toggle whether performers are included in query.</small>
    </div>
    <div class="align-items-center form-group">
        <div class="form-check">
            <input type="checkbox" id="query-edit-include-title" class="form-check-input" data-default="true">
            <label title="" for="query-edit-include-title" class="form-check-label">Include Title</label>
        </div>
        <small class="form-text">Toggle whether title is included in query.</small>
    </div>
    <div class="align-items-center form-group">
        <div class="form-check">
            <input type="checkbox" id="query-edit-apply-blacklist" class="form-check-input" data-default="true">
            <label title="" for="query-edit-apply-blacklist" class="form-check-label">Apply Blacklist</label>
        </div>
        <small class="form-text">Toggle whether blacklist is applied to query.</small>
    </div>
</div>
</div>
            `);
            configContainer.appendChild(queryEditConfig);
            loadSettings();
        }
    });

    async function loadSettings() {
        for (const input of document.querySelectorAll(`#${queryEditConfigId} input`)) {
            input.checked = await GM.getValue(input.id, input.dataset.default === 'true');
            input.addEventListener('change', async () => {
                await GM.setValue(input.id, input.checked);
            });
        }
    }

})();