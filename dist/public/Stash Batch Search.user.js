// ==UserScript==
// @name        Stash Batch Search
// @description Adds a batch search button to scenes and performers tagger
// @version     0.1
// @author      7dJx1qP
// @match       *localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('Stash Batch Search');

    const DELAY = 200;

    const {
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
    } = window.stash;

    const stash = new Stash();

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
        console.log('Search Started');
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
        console.log('Search Stopped');
    }

    stash.addEventListener('page:performers', function () {
        waitForElementByXpath("//button[text()='Batch Update Performers']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                console.log('ready', el);
                const container = el.parentElement;
                console.log(container);

                container.appendChild(btn);
            }
        });
    });

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