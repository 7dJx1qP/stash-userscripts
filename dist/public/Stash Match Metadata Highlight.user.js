// ==UserScript==
// @name        Stash Match Metadata Highlight
// @description Highlight mismatching data in scene tagger matches
// @version     0.1.1
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('Stash Match Metadata Highlight');

    const DELAY = 200;

    const {
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getElementsByXpath,
        getClosestAncestor,
        updateTextInput,
    } = window.stash;

    const stash = new Stash();

    let running = false;
    const buttons = [];

    const datePattern = /\d{4}\-\d{2}\-\d{2}/g;

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const scene = getClosestAncestor(button, '.search-item');
            const myTitle = scene.querySelector('a.scene-link > div.TruncatedText');
            console.log('myTitle', myTitle);
            let myDate = '';

            const queryInput = scene.querySelector('input.text-input');
            let newQuery = queryInput.value;

            let dateIndex = queryInput.value.search(datePattern);
            if (dateIndex !== -1) {
                myDate = queryInput.value.substring(dateIndex, dateIndex+10);
            }
            console.log('myDate', myDate, newQuery);

            const resultMetadata = scene.querySelector('li.search-result.selected-result.active div.scene-metadata');
            console.log(resultMetadata, 'resultMetadata');
            const resultTitle = resultMetadata.querySelector('h4 > div.optional-field > div.optional-field-content > a > div.TruncatedText');
            console.log('result title', resultTitle);
            if (resultTitle) {
                if (queryInput.value.indexOf(resultTitle.innerText) === -1) {
                    resultTitle.style.color = 'red';
                }
                else {
                    resultTitle.style.color = 'green';
                    newQuery = newQuery.replace(resultTitle.innerText, '');
                }
            }
            const resultDate = resultMetadata.querySelector('h5 > div.optional-field > div.optional-field-content');
            console.log('result date', resultDate);
            if (resultDate) {
                if (queryInput.value.indexOf(resultDate.innerText) === -1) {
                    resultDate.style.color = 'red';
                }
                else {
                    resultDate.style.color = 'green';
                    newQuery = newQuery.replace(resultDate.innerText, '');
                }
            }

            const resultStudio = getElementByXpath('.//div[@class="entity-name" and text()="Studio"]/following-sibling::span[@class="ml-auto"]//b', scene);
            console.log('studio', resultStudio, resultStudio.innerText);
            if (queryInput.value.indexOf(resultStudio.innerText) === -1) {
                resultStudio.style.color = 'red';
            }
            else {
                resultStudio.style.color = 'green';
                newQuery = newQuery.replace(resultStudio.innerText, '');
            }

            const resultPerformers = getElementsByXpath('.//div[@class="entity-name" and text()="Performer"]/following-sibling::span[@class="ml-auto"]//b', scene);
            let node = null;
            while (node = resultPerformers.iterateNext()) {
                console.log('performer', node, node.innerText);
                if (queryInput.value.indexOf(node.innerText) === -1) {
                    node.style.color = 'red';
                }
                else {
                    node.style.color = 'green';
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
        console.log('Highlight Started');
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
        console.log('Highlight Stopped');
    }

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[text()='Scrape All']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                console.log('ready', el);
                const container = el.parentElement;
                console.log(container);

                container.appendChild(btn);
            }
        });
    });

})();