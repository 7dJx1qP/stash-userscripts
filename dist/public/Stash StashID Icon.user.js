// ==UserScript==
// @name        Stash StashID Icon
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds checkmark icon to performer and studio cards that have a stashid
// @version     0.1.1
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @grant       GM_addStyle
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// ==/UserScript==

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
        createElementFromHTML,
    } = unsafeWindow.stash;

    GM_addStyle(`
    .peformer-stashid-icon {
        position: absolute;
        top: 10px;
        right: 5px;
    }
    .favorite ~ .peformer-stashid-icon {
        right: 42px;
    }
    .studio-stashid-icon {
        position: absolute;
        top: 10px;
        right: 5px;
    }
    .col-3.d-xl-none .studio-stashid-icon {
        position: relative;
        top: 0;
        right: 0;
    }
    `);

    function createCheckmarkElement() {
        return createElementFromHTML(`<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-check" class="svg-inline--fa fa-circle-check fa-icon undefined" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="
    color: #0f9960;
    height: 24px;
    margin-left: 4px;
    vertical-align: text-top;
"><path fill="currentColor" d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"></path></svg>`);
    }

    function addPerformerStashIDIcons(performerDatas) {
        for (const performerCard of document.querySelectorAll('.performer-card')) {
            const performerLink = performerCard.querySelector('.thumbnail-section > a');
            const performerUrl = performerLink.href;
            const performerId = performerUrl.split('/').pop();
            const performerData = performerDatas[performerId];
            if (performerData?.stash_ids.length) {
                const el = createElementFromHTML(`<div class="peformer-stashid-icon" title="Has StashID">`);
                el.appendChild(createCheckmarkElement());

                performerLink.appendChild(el);
            }
        }
    }

    function addStudioStashIDIcons(studioDatas) {
        for (const studioCard of document.querySelectorAll('.studio-card')) {
            const studioLink = studioCard.querySelector('.thumbnail-section > a');
            const studioUrl = studioLink.href;
            const studioId = studioUrl.split('/').pop();
            const studioData = studioDatas[studioId];
            if (studioData?.stash_ids.length) {
                const el = createElementFromHTML(`<div class="studio-stashid-icon" title="Has StashID">`);
                el.appendChild(createCheckmarkElement());

                studioCard.appendChild(el);
            }
        }
    }

    function addSceneStudioStashIDIcons(studioData) {
        for (const studioCard of document.querySelectorAll('.studio-logo')) {
            if (studioData?.stash_ids.length) {
                const el = createElementFromHTML(`<div class="studio-stashid-icon" title="Has StashID">`);
                el.appendChild(createCheckmarkElement());

                studioCard.parentElement.appendChild(el);
            }
        }
    }

    stash.addEventListener('page:scene', function () {
        waitForElementClass("performer-card", function () {
            const sceneId = window.location.pathname.split('/').pop();
            const performerDatas = {};
            for (const performerData of stash.scenes[sceneId].performers) {
                performerDatas[performerData.id] = performerData;
            }
            addPerformerStashIDIcons(performerDatas);
            if (stash.scenes[sceneId].studio) {
                addSceneStudioStashIDIcons(stash.scenes[sceneId].studio);
            }
        });
    });

    stash.addEventListener('page:performers', function () {
        waitForElementClass("performer-card", function () {
            addPerformerStashIDIcons(stash.performers);
        });
    });

    stash.addEventListener('page:studios', function () {
        waitForElementClass("studio-card", function () {
            addStudioStashIDIcons(stash.studios);
        });
    });

    stash.addEventListener('page:studio:performers', function () {
        waitForElementClass("performer-card", function () {
            addPerformerStashIDIcons(stash.performers);
        });
    });
})();