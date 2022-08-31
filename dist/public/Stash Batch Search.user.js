// ==UserScript==
// @name        Stash Batch Search
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds a batch search button to scenes and performers tagger
// @version     0.3.2
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
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
        sortElementChildren,
    } = window.stash;

    let running = false;
    const buttons = [];

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            if (!button.disabled) {
                button.click();
            }
            else {
                buttons.push(button);
            }
            setTimeout(run, DELAY);
        }
        else {
            stop();
        }
    }

    const btnId = 'batch-search';
    const startLabel = 'Search All';
    const stopLabel = 'Stop Search';
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

    stash.addEventListener('page:performers', function () {
        waitForElementByXpath("//button[text()='Batch Update Performers']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;

                container.appendChild(btn);
            }
        });
    });

    stash.addEventListener('tagger:mutations:header', evt => {
        const el = getElementByXpath("//button[text()='Scrape All']");
        if (el && !document.getElementById(btnId)) {
            const container = el.parentElement;
            container.appendChild(btn);
            sortElementChildren(container);
            el.classList.add('ml-3');
        }
    });

})();