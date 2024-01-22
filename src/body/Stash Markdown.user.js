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