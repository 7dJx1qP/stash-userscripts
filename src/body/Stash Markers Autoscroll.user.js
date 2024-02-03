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

    let markers = [];
    let markersFilter;
    let sceneMarkerFilter;
    let markerResponseCache = {};

    let markerFetchInterval;

    const cloneJSON = obj => JSON.parse(JSON.stringify(obj));

    // intercept the page's initial markers request so the same query filter can be used for our requests
    // we will get more markers by making the same request but increment the page count each time
    stash.addEventListener('stash:request', evt => {
        if (evt.detail?.body) {
            const body = JSON.parse(evt.detail.body);
            if (body.operationName === "FindSceneMarkers") {
                markersFilter = body.variables.filter;
                sceneMarkerFilter = body.variables.scene_marker_filter;
                clearInterval(markerFetchInterval);
            }
        }
    });

    stash.addEventListener('stash:response', async evt => {
        if (evt?.detail?.data?.findSceneMarkers?.__typename === 'FindSceneMarkersResultType') {
            const data = evt.detail.data.findSceneMarkers;
            maxMarkers = data.count;
            maxPage = Math.ceil(maxMarkers / markersFilter.per_page);
            markers = data.scene_markers;
            for (let i = 0; i < markers.length; i++) {
                markerIndex[i] = i;
            }
            markerResponseCache[window.location.search] = {
                markersFilter: cloneJSON(markersFilter),
                sceneMarkerFilter: cloneJSON(sceneMarkerFilter),
                data
            };
            await fetchMarkers(); // buffer next page of markers
            markerFetchInterval = setInterval(fetchMarkers, 10000); // get next page of markers every 20 seconds
        }
    });

    var _wr = function(type) {
        var orig = history[type];
        return function() {
            var rv = orig.apply(this, arguments);
            var e = new Event(type);
            e.arguments = arguments;
            window.dispatchEvent(e);
            return rv;
        };
    };
    history.pushState = _wr('replaceState');
    history.replaceState = _wr('replaceState');

    window.addEventListener('replaceState', async function () {
        if (markerResponseCache.hasOwnProperty(window.location.search)) {
            markersFilter = cloneJSON(markerResponseCache[window.location.search].markersFilter);
            sceneMarkerFilter = cloneJSON(markerResponseCache[window.location.search].sceneMarkerFilter);
            clearInterval(markerFetchInterval);

            const data = markerResponseCache[window.location.search].data;
            maxMarkers = data.count;
            maxPage = Math.ceil(maxMarkers / markersFilter.per_page);
            markers = data.scene_markers;
            for (let i = 0; i < markers.length; i++) {
                markerIndex[i] = i;
            }
            await fetchMarkers(); // buffer next page of markers
            markerFetchInterval = setInterval(fetchMarkers, 10000); // get next page of markers every 20 seconds
        }
    });

    function fmtMSS(s) {
        return(s - (s %= 60)) / 60 + (9 < s ? ':': ':0') + s
    }

    let maxPage = 1;
    let maxMarkers = 1;
    let scrollSize = 1;
    let markerIndex = [];
    let playbackRate = 1;
    let videoEls = [];

    async function getMarkers() {
        const reqData = {
            "variables": {
                "filter": markersFilter,
                "scene_marker_filter": sceneMarkerFilter
            },
            "query": `query FindSceneMarkers($filter: FindFilterType, $scene_marker_filter: SceneMarkerFilterType) {
                findSceneMarkers(filter: $filter, scene_marker_filter: $scene_marker_filter) {
                  count
                  scene_markers {
                    id
                    seconds
                    stream
                    screenshot
                    scene {
                      id
                    }
                    primary_tag {
                      name
                    }
                    title
                    tags {
                      name
                    }
                  }
                }
              }`
        };
        const data = (await stash.callGQL(reqData)).data.findSceneMarkers;
        maxMarkers = data.count;
        maxPage = Math.ceil(maxMarkers / markersFilter.per_page);
        return data.scene_markers.filter(marker => marker.stream);
    }

    async function fetchMarkers() {
        markersFilter.page++;
        if (markersFilter.page > maxPage) {
            markersFilter.page = 1;
        }
        markers = markers.concat(await getMarkers());
    }

    stash.addEventListener('page:markers', function () {
        waitForElementClass("btn-toolbar", function () {
            if (!document.getElementById('scroll-size-input')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('ml-2', 'mb-2', 'd-none', 'd-sm-inline-flex');
                toolbar.appendChild(newGroup);

                const scrollSizeInput = document.createElement('input');
                scrollSizeInput.type = 'number';
                scrollSizeInput.setAttribute('id', 'scroll-size-input');
                scrollSizeInput.classList.add('ml-1', 'btn-secondary', 'form-control');
                scrollSizeInput.setAttribute('min', '0');
                scrollSizeInput.setAttribute('max', markersFilter.per_page);
                scrollSizeInput.value = scrollSize;
                scrollSizeInput.addEventListener('change', () => {
                    scrollSize = parseInt(scrollSizeInput.value);
                });
                newGroup.appendChild(scrollSizeInput);
            }
            if (!document.getElementById('playback-rate-input')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('ml-2', 'mb-2', 'd-none', 'd-sm-inline-flex');
                toolbar.appendChild(newGroup);

                const playbackRateInput = document.createElement('input');
                playbackRateInput.type = 'range';
                playbackRateInput.setAttribute('id', 'playback-rate-input');
                playbackRateInput.classList.add('zoom-slider', 'ml-1', 'form-control-range');
                playbackRateInput.setAttribute('min', '0.25');
                playbackRateInput.setAttribute('max', '2');
                playbackRateInput.setAttribute('step', '0.25');
                playbackRateInput.value = playbackRate;
                playbackRateInput.addEventListener('change', () => {
                    playbackRate = parseFloat(playbackRateInput.value);
                    for (const videoEl of videoEls) {
                        videoEl.playbackRate = playbackRate;
                    }
                });
                newGroup.appendChild(playbackRateInput);
            }
        });

        waitForElementClass('wall-item-anchor', async function (className, els) {
            //await fetchMarkers(); // load initial markers page
            //await fetchMarkers(); // buffer next page of markers
            for (let i = 0; i < els.length; i++) {
                const el = els[i];
                const video = el.querySelector('video');
                video.removeAttribute('loop');
                video.playbackRate = playbackRate;
                videoEls.push(video);
                markerIndex[i] = i;
                video.parentElement.addEventListener('click', evt => {
                    // suppress click, so clicking marker goes to scene specified by anchor link
                    // otherwise it goes to scene specified by original marker
                    evt.stopPropagation();
                });
                video.addEventListener('ended', async evt => {
                    markerIndex[i] += scrollSize;
                    markerIndex[i] %= maxMarkers; // loops back to beginning if past end
                    const marker = markers[markerIndex[i]];
                    evt.target.src = marker.stream;
                    evt.target.playbackRate = playbackRate;
                    evt.target.setAttribute('poster', marker.screenshot);
                    evt.target.play();
                    evt.target.parentElement.setAttribute('href', `/scenes/${marker.scene.id}?t=${marker.seconds}`);

                    // update marker title and tags
                    evt.target.nextSibling.innerHTML = '';

                    const markerTitle = document.createElement('div');
                    markerTitle.innerText = `${marker.title} - ${fmtMSS(marker.seconds)}`;
                    evt.target.nextSibling.appendChild(markerTitle);

                    const markerPrimaryTag = document.createElement('span');
                    markerPrimaryTag.classList.add('wall-tag');
                    markerPrimaryTag.innerText = marker.primary_tag.name;
                    evt.target.nextSibling.appendChild(markerPrimaryTag);

                    for (const tag of marker.tags) {
                        const markerTag = document.createElement('span');
                        markerTag.classList.add('wall-tag');
                        markerTag.innerText = tag.name;
                        evt.target.nextSibling.appendChild(markerTag);
                    }
                });
            }
        });
    });
})();