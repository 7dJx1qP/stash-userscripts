// ==UserScript==
// @name        Stash Random Marker Refresh
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Automatically refresh random markers page
// @version     0.1.0
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       unsafeWindow
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
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
        reloadImg,
    } = unsafeWindow.stash;

    let markersQueue = [];

    function processMarkersRequest(evt) {
        console.log('evt', evt);
    }

    stash.addEventListener('stash:request', processMarkersRequest);

    const searchParams = new URLSearchParams(window.location.search);
    let page = parseInt(searchParams.get("page") || 1);
    let perPage = parseInt(searchParams.get("perPage") || 20);
    let sort = searchParams.get("sortby") || "updated_at";
    let direction = (searchParams.get("sortdir") || "ASC").toUpperCase();

    async function getMarkers(page, perPage, sort, direction) {
        const reqData = {
            "variables": {
                "filter": {
                    "q": "",
                    "page": page,
                    "per_page": perPage,
                    "sort": sort,
                    "direction": direction
                }
            },
            "query": `query FindSceneMarkers($filter: FindFilterType, $scene_marker_filter: SceneMarkerFilterType) {
                findSceneMarkers(filter: $filter, scene_marker_filter: $scene_marker_filter) {
                  count
                  scene_markers {
                    stream
                    screenshot
                  }
                }
              }`
        };
        return (await stash.callGQL(reqData)).data.findSceneMarkers.scene_markers;
    }

    async function checkMarkers() {
        if (markersQueue.length <= perPage) {
            page++;
            markersQueue = markersQueue.concat(await getMarkers(page, perPage, sort, direction));
        }
        console.log(markersQueue);
    }

    stash.addEventListener('page:markers', function () {
        console.log('markers');
        waitForElementClass('wall-item-anchor', async function (className, els) {
            console.log(els);
            /*els[0].querySelector('video').removeAttribute('loop');
            els[0].querySelector('video').addEventListener('ended', () => {
                console.log('ended', els[0].querySelector('video').currentTime);
                const shuffleIcon = document.querySelector('[data-icon="shuffle"]');
                const shuffleBtn = shuffleIcon.parentElement;
                console.log(shuffleBtn);
                shuffleBtn.click();
            });
            console.log(els[0].querySelector('video'));*/
            let counter = 0;
            for (let i = 0; i < els.length; i++) {
                const el = els[i];
                const video = el.querySelector('video');
                const marker = {
                    'stream': video.src,
                    'screenshot': video.getAttribute('poster')
                }
                markersQueue.push(marker);
                video.removeAttribute('loop');
                video.addEventListener('ended', evt => {
                    counter++;
                    const marker = markersQueue[i + 5];
                    evt.target.src = marker.stream;
                    evt.target.setAttribute('poster', marker.screenshot);
                    if (counter % 20 == 0) {
                        markersQueue = markersQueue.slice(5);
                    }
                    checkMarkers();
                });
            }
        });
    });
})();