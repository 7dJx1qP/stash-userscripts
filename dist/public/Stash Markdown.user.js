// ==UserScript==
// @name        Stash Markdown
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds markdown parsing to tag description, studio and performer detail fields
// @version     0.2.0
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/marked/4.2.2/marked.min.js
// ==/UserScript==

/* global marked */

(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        insertAfter,
        reloadImg,
    } = unsafeWindow.stash;

    function processMarkdown(el) {
        el.innerHTML = marked.parse(el.innerHTML);
    }

    stash.addEventListener('page:tag:any', function () {
        waitForElementByXpath("//div[contains(@class, 'logo-container')]/p", function (xpath, el) {
            processMarkdown(el);
        });
    });

    stash.addEventListener('page:tags', function () {
        waitForElementByXpath("//div[contains(@class, 'tag-description')]", function (xpath, el) {
            for (const node of document.querySelectorAll('.tag-description')) {
                processMarkdown(node);
            }
        });
    });

    stash.addEventListener('page:performer:details', function () {
        waitForElementByXpath("//dt[text()='Details']/following-sibling::dd[1]", function (xpath, el) {
            processMarkdown(el);
        });
    })

    function studioPageHandler() {
        waitForElementByXpath("//dl[contains(@class, 'details-list')]/dd[2]", function (xpath, el) {
            processMarkdown(el);
        });
    }

    // Studio details is visible regardless of chosen tab.
    stash.addEventListener('page:studio:galleries', studioPageHandler);
    stash.addEventListener('page:studio:images', studioPageHandler);
    stash.addEventListener('page:studio:performers', studioPageHandler);
    stash.addEventListener('page:studio:movies', studioPageHandler);
    stash.addEventListener('page:studio:childstudios', studioPageHandler);
    stash.addEventListener('page:studio:scenes', studioPageHandler);
    stash.addEventListener('page:studio', studioPageHandler);
})();
