// ==UserScript==
// @name        Stash Markdown
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds markdown parsing to tag description fields
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
        waitForElementByXpath("//span[contains(@class, 'detail-item-value') and contains(@class, 'description')]", function (xpath, el) {
            el.style.display = 'block';
            el.style.whiteSpace = 'initial';
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
})();