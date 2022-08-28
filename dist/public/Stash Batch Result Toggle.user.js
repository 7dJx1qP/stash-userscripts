// ==UserScript==
// @name        Stash Batch Result Toggle
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Batch toggle scene tagger search result fields
// @version     0.2.3
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
        getClosestAncestor,
        updateTextInput,
        sortElementChildren,
    } = window.stash;

    let running = false;
    const buttons = [];

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const scene = getClosestAncestor(button, '.search-item');
            const sceneName = scene.querySelector('a.scene-link > div.TruncatedText');

            const optionalButtons = scene.querySelectorAll('div.optional-field > button.include-exclude-button');
            for (const optionalButton of optionalButtons) {
                optionalButton.click();
            }
            const stashIdButton = scene.querySelector('div.col-lg-6 > div.flex-column > div.scene-details > div.optional-field > button.include-exclude-button');
            stashIdButton.click();

            setTimeout(run, DELAY);
        }
        else {
            stop();
        }
    }

    const btnId = 'batch-result-toggle';
    const startLabel = 'Result Toggle All';
    const stopLabel = 'Stop Result Toggle';
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
        run();
    }

    function stop() {
        btn.innerHTML = startLabel;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        running = false;
    }

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[text()='Scrape All']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;
                container.appendChild(btn);
                sortElementChildren(container);
                el.classList.add('ml-3');
            }
        });
    });

})();