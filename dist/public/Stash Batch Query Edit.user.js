// ==UserScript==
// @name        Stash Batch Query Edit
// @description Batch modify scene tagger search query
// @version     0.2.0
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('Stash Batch Query Edit');

    const scenes = {};

    const processScenes = function (data) {
        if (data.data.findScenes?.scenes) {
            for (const scene of data.data.findScenes.scenes) {
                scenes[scene.id] = scene;
            }
        }
    }

    const DELAY = 200;

    const {
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

    const stash = new Stash();

    let running = false;
    const buttons = [];

    function run(videoExtensions) {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const scene = getClosestAncestor(button, '.search-item');
            const sceneLink = scene.querySelector('a.scene-link');
            const sceneURL = new URL(sceneLink.href);
            const sceneId = sceneURL.pathname.replace('/scenes/', '');
            const sceneData = scenes[sceneId];
            const sceneName = scene.querySelector('a.scene-link > div.TruncatedText');

            const queryInput = scene.querySelector('input.text-input');

            const includeStudio = document.getElementById('query-edit-include-studio').checked;
            const includeDate = document.getElementById('query-edit-include-date').checked;
            const includePerformers = document.getElementById('query-edit-include-performers').checked;
            const includeTitle = document.getElementById('query-edit-include-title').checked;
            const applyBlacklist = document.getElementById('query-edit-apply-blacklist').checked;

            const videoExtensionRegexes = videoExtensions.map(s => [new RegExp(`.${s}$`, "gi"), '']);
            const blacklist = [];
            if (applyBlacklist) {
                const blacklistTags = getElementsByXpath("//div[@class='tagger-container-header']//h5[text()='Blacklist']/following-sibling::span/text()")
                console.log(blacklistTags);
                let node = null;
                while (node = blacklistTags.iterateNext()) {
                    blacklist.push([new RegExp(node.nodeValue, "gi"), '']);
                }
            }
            blacklist.push([/[_-]/gi, ' ']);
            blacklist.push([/[^a-z0-9\s]/gi, '']);
            if (sceneData.date) {
                blacklist.push([new RegExp(sceneData.date.replaceAll('-', ''), "gi"), '']);
            }

            const filterBlacklist = (s, regexes) => regexes.reduce((acc, [regex, repl]) => {
                return acc.replace(regex, repl);
            }, s)

            const queryData = [];
            if (sceneData.date && includeDate) queryData.push(sceneData.date);
            if (sceneData.studio && includeStudio) queryData.push(filterBlacklist(sceneData.studio.name, blacklist));
            if (sceneData.performers && includePerformers) {
                for (const performer of sceneData.performers) {
                    queryData.push(filterBlacklist(performer.name, blacklist));
                }
            }
            if (sceneData.title && includeTitle) queryData.push(filterBlacklist(sceneData.title, videoExtensionRegexes.concat(blacklist)));

            const queryValue = queryData.join(' ');
            updateTextInput(queryInput, queryValue);

            setTimeout(() => run(videoExtensions), 50);
        }
        else {
            stop();
        }
    }

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
        console.log('Query Edit Started');
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
        console.log('Query Edit Stopped');
    }

    stash.addEventListener('stash:response', function (evt) {
        processScenes(evt.detail);
    });

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[text()='Scrape All']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;
                container.appendChild(btn);
                sortElementChildren(container);
                el.classList.add('ml-3');
            }
        });
        waitForElementByXpath("//div[@class='tagger-container-header']/div/div[@class='row']/h4[text()='Configuration']", function (xpath, el) {
            console.log(el.parentElement.parentElement);
            const queryEditConfigId = 'query-edit-config';
            if (!document.getElementById(queryEditConfigId)) {
                const configContainer = el.parentElement.parentElement;
                const queryEditConfig = createElementFromHTML(`
<div id="${queryEditConfigId}" class="row">
    <h4 class="col-12">Query Edit Configuration</h4>
    <hr class="w-100">
    <div class="col-md-6">
        <div class="align-items-center form-group">
            <div class="form-check">
                <input type="checkbox" id="query-edit-include-date" class="form-check-input" checked>
                <label title="" for="query-edit-include-date" class="form-check-label">Include Date</label>
            </div>
            <small class="form-text">Toggle whether date is included in query.</small>
        </div>
        <div class="align-items-center form-group">
            <div class="form-check">
                <input type="checkbox" id="query-edit-include-studio" class="form-check-input" checked>
                <label title="" for="query-edit-include-studio" class="form-check-label">Include Studio</label>
            </div>
            <small class="form-text">Toggle whether studio is included in query.</small>
        </div>
        <div class="align-items-center form-group">
            <div class="form-check">
                <input type="checkbox" id="query-edit-include-performers" class="form-check-input" checked>
                <label title="" for="query-edit-include-performers" class="form-check-label">Include Performers</label>
            </div>
            <small class="form-text">Toggle whether performers are included in query.</small>
        </div>
        <div class="align-items-center form-group">
            <div class="form-check">
                <input type="checkbox" id="query-edit-include-title" class="form-check-input" checked>
                <label title="" for="query-edit-include-performers" class="form-check-label">Include Title</label>
            </div>
            <small class="form-text">Toggle whether title is included in query.</small>
        </div>
        <div class="align-items-center form-group">
            <div class="form-check">
                <input type="checkbox" id="query-edit-apply-blacklist" class="form-check-input" checked>
                <label title="" for="query-edit-apply-blacklist" class="form-check-label">Apply Blacklist</label>
            </div>
            <small class="form-text">Toggle whether blacklist is applied to query.</small>
        </div>
    </div>
</div>
                `);
                configContainer.appendChild(queryEditConfig)
            }
        });
    });

})();