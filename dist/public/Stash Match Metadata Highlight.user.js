// ==UserScript==
// @name        Stash Match Metadata Highlight
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Highlight mismatching data in scene tagger matches
// @version     0.3.0
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
// ==/UserScript==

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
        updateTextInput,
        sortElementChildren,
    } = window.stash;

    let running = false;
    const buttons = [];

    const datePattern = /\d{4}\-\d{2}\-\d{2}/g;

    const COLORS = {
        'green': '#0f9960',
        'red': '#ff7373',
    };

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const scene = getClosestAncestor(button, '.search-item');
            const myTitle = scene.querySelector('a.scene-link > div.TruncatedText');
            let myDate = '';

            const queryInput = scene.querySelector('input.text-input');
            let newQuery = queryInput.value;

            let dateIndex = queryInput.value.search(datePattern);
            if (dateIndex !== -1) {
                myDate = queryInput.value.substring(dateIndex, dateIndex+10);
            }

            const resultMetadata = scene.querySelector('li.search-result.selected-result.active div.scene-metadata');
            const resultTitle = resultMetadata.querySelector('h4 > div.optional-field > div.optional-field-content > a > div.TruncatedText');
            if (resultTitle) {
                if (queryInput.value.indexOf(resultTitle.innerText) === -1) {
                    resultTitle.style.color = COLORS['red'];
                }
                else {
                    resultTitle.style.color = COLORS['green'];
                    newQuery = newQuery.replace(resultTitle.innerText, '');
                }
            }
            const resultDate = resultMetadata.querySelector('h5 > div.optional-field > div.optional-field-content');
            if (resultDate) {
                if (queryInput.value.indexOf(resultDate.innerText) === -1) {
                    resultDate.style.color = COLORS['red'];
                }
                else {
                    resultDate.style.color = COLORS['green'];
                    newQuery = newQuery.replace(resultDate.innerText, '');
                }
            }

            const resultStudio = getElementByXpath('.//div[@class="entity-name" and text()="Studio"]/following-sibling::span[@class="ml-auto"]//b', scene);
            const nodeToColor = resultStudio.firstChild || resultStudio;
            if (queryInput.value.indexOf(resultStudio.innerText) === -1) {
                nodeToColor.style.color = COLORS['red'];
            }
            else {
                nodeToColor.style.color = COLORS['green'];
                newQuery = newQuery.replace(resultStudio.innerText, '');
            }

            const resultPerformers = getElementsByXpath('.//div[@class="entity-name" and text()="Performer"]/following-sibling::span[@class="ml-auto"]//b', scene);
            let node = null;
            while (node = resultPerformers.iterateNext()) {
                const nodeToColor = node.firstChild || node;
                if (queryInput.value.indexOf(node.innerText) === -1) {
                    nodeToColor.style.color = COLORS['red'];
                }
                else {
                    nodeToColor.style.color = COLORS['green'];
                    newQuery = newQuery.replace(node.innerText, '');
                }
            }

            updateTextInput(queryInput, newQuery);


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

    function processTagger() {
        waitForElementByXpath("//button[text()='Scrape All']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;
                container.appendChild(btn);
                sortElementChildren(container);
                el.classList.add('ml-3');
            }
        });
    }

    stash.addEventListener('page:scenes', processTagger);
    stash.addEventListener('page:performer:scenes', processTagger);
    stash.addEventListener('page:studio:scenes', processTagger);
    stash.addEventListener('page:tag:scenes', processTagger);
    stash.addEventListener('page:movie:scenes', processTagger);

})();