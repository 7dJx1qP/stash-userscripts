(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getClosestAncestor,
        updateTextInput,
    } = unsafeWindow.stash;

    function createStatElement(container, title, heading) {
        const statEl = document.createElement('div');
        statEl.classList.add('stats-element');
        container.appendChild(statEl);

        const statTitle = document.createElement('p');
        statTitle.classList.add('title');
        statTitle.innerText = title;
        statEl.appendChild(statTitle);

        const statHeading = document.createElement('p');
        statHeading.classList.add('heading');
        statHeading.innerText = heading;
        statEl.appendChild(statHeading);
    }

    async function createSceneStashIDPct(row) {
        const reqData = {
            "variables": {
                "scene_filter": {
                    "stash_id": {
                        "value": "",
                        "modifier": "NOT_NULL"
                    }
                }
            },
            "query": "query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {\n  findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {\n    count\n  }\n}"
        };
        const stashIdCount = (await stash.callGQL(reqData)).data.findScenes.count;

        const reqData2 = {
            "variables": {
                "scene_filter": {}
            },
            "query": "query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {\n  findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findScenes.count;

        createStatElement(row, (stashIdCount / totalCount * 100).toFixed(2) + '%', 'Scene StashIDs');
    }

    async function createSceneHDPct(row) {
        const reqData = {
            "variables": {
                "scene_filter": {
                    "resolution": {
                        "value": "WEB_HD",
                        "modifier": "GREATER_THAN"
                    }
                }
            },
            "query": "query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {\n  findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {\n    count\n  }\n}"
        };
        const sceneHDCount = (await stash.callGQL(reqData)).data.findScenes.count;

        const reqData2 = {
            "variables": {
                "scene_filter": {}
            },
            "query": "query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {\n  findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findScenes.count;

        createStatElement(row, (sceneHDCount / totalCount * 100).toFixed(2) + '%', 'Scene HD')
    }

    async function createPerformerStashIDPct(row) {
        const reqData = {
            "variables": {
                "performer_filter": {
                    "stash_id": {
                        "value": "",
                        "modifier": "NOT_NULL"
                    }
                }
            },
            "query": "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}"
        };
        const stashIdCount = (await stash.callGQL(reqData)).data.findPerformers.count;

        const reqData2 = {
            "variables": {
                "performer_filter": {}
            },
            "query": "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findPerformers.count;

        createStatElement(row, (stashIdCount / totalCount * 100).toFixed(2) + '%', 'Performer StashIDs');
    }

    async function createPerformerImagePct(row) {
        const reqData = {
            "variables": {
                "performer_filter": {
                    is_missing: "image"
                }
            },
            "query": "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}"
        };
        const missingImageCount = (await stash.callGQL(reqData)).data.findPerformers.count;

        const reqData2 = {
            "variables": {
                "performer_filter": {}
            },
            "query": "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findPerformers.count;

        createStatElement(row, ((totalCount - missingImageCount) / totalCount * 100).toFixed(2) + '%', 'Performer Images');
    }

    async function createMovieCoverPct(row) {
        const reqData = {
            "variables": {
                "movie_filter": {
                    is_missing: "front_image"
                }
            },
            "query": "query FindMovies($filter: FindFilterType, $movie_filter: MovieFilterType) {\n  findMovies(filter: $filter, movie_filter: $movie_filter) {\n    count\n  }\n}"
        };
        const imageCount = (await stash.callGQL(reqData)).data.findMovies.count;
        const reqData2 = {
            "variables": {
                "movie_filter": {}
            },
            "query": "query FindMovies($filter: FindFilterType, $movie_filter: MovieFilterType) {\n  findMovies(filter: $filter, movie_filter: $movie_filter) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findMovies.count;
        createStatElement(row, ((totalCount - imageCount) / totalCount * 100).toFixed(2), 'Movie Covers')
    }

    async function createTagImagePct(row) {
        const reqData = {
            "variables": {
                "tag_filter": {
                    "is_missing": "image"
                }
            },
            "query": "query FindTags($filter: FindFilterType, $tag_filter: TagFilterType) {\n  findTags(filter: $filter, tag_filter: $tag_filter) {\n    count\n  }\n}"
        };
        const imageCount = (await stash.callGQL(reqData)).data.findTags.count;
        const reqData2 = {
            "variables": {
                "tag_filter": {}
            },
            "query": "query FindTags($filter: FindFilterType, $tag_filter: TagFilterType) {\n  findTags(filter: $filter, tag_filter: $tag_filter) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findTags.count;

        createStatElement(row, ((totalCount - imageCount) / totalCount * 100).toFixed(2), 'Tag Images')
    }

    async function createStudioStashIDPct(row) {
        const reqData = {
            "variables": {
                "studio_filter": {
                    "stash_id": {
                        "value": "",
                        "modifier": "NOT_NULL"
                    }
                }
            },
            "query": "query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {\n  findStudios(filter: $filter, studio_filter: $studio_filter) {\n    count\n  }\n}"
        };
        const stashIdCount = (await stash.callGQL(reqData)).data.findStudios.count;

        const reqData2 = {
            "variables": {
                "scene_filter": {}
            },
            "query": "query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {\n  findStudios(filter: $filter, studio_filter: $studio_filter) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findStudios.count;

        createStatElement(row, (stashIdCount / totalCount * 100).toFixed(2) + '%', 'Studio StashIDs');
    }

    async function createStudiohImagePct(row) {
        const reqData = {
            "variables": {
                "studio_filter": {
                    "is_missing": "image"
                }
            },
            "query": "query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {\n  findStudios(filter: $filter, studio_filter: $studio_filter) {\n    count\n  }\n}"
        };
        const missingImageCount = (await stash.callGQL(reqData)).data.findStudios.count;

        const reqData2 = {
            "variables": {
                "scene_filter": {}
            },
            "query": "query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {\n  findStudios(filter: $filter, studio_filter: $studio_filter) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData2)).data.findStudios.count;

        createStatElement(row, ((totalCount - missingImageCount) / totalCount * 100).toFixed(2) + '%', 'Studio Images');
    }

    async function createPerformerFavorites(row) {
        const reqData = {
            "variables": {
                "performer_filter": {
                    "filter_favorites": true
                }
            },
            "query": "query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType) {\n  findPerformers(filter: $filter, performer_filter: $performer_filter) {\n    count\n  }\n}"
        };
        const perfCount = (await stash.callGQL(reqData)).data.findPerformers.count;

        createStatElement(row, perfCount, 'Favorite Performers');
    }

    async function createMarkersStat(row) {
        const reqData = {
            "variables": {
                "scene_marker_filter": {}
            },
            "query": "query FindSceneMarkers($filter: FindFilterType, $scene_marker_filter: SceneMarkerFilterType) {\n  findSceneMarkers(filter: $filter, scene_marker_filter: $scene_marker_filter) {\n    count\n  }\n}"
        };
        const totalCount = (await stash.callGQL(reqData)).data.findSceneMarkers.count;

        createStatElement(row, totalCount, 'Markers');
    }

    stash.addEventListener('page:stats', function () {
        waitForElementByXpath("//div[contains(@class, 'container-fluid')]/div[@class='mt-5']", function (xpath, el) {
            if (!document.getElementById('custom-stats-row')) {
                const changelog = el.querySelector('div.changelog');
                const row = document.createElement('div');
                row.setAttribute('id', 'custom-stats-row');
                row.classList.add('col', 'col-sm-8', 'm-sm-auto', 'row', 'stats');
                el.insertBefore(row, changelog);

                createSceneStashIDPct(row);
                createStudioStashIDPct(row);
                createPerformerStashIDPct(row);
                createPerformerFavorites(row);
                createMarkersStat(row);
                const row2 = document.createElement('div');
                row2.setAttribute('id', 'custom-stats-row');
                row2.classList.add('col', 'col-sm-8', 'm-sm-auto', 'row', 'stats');
                el.insertBefore(row2, changelog);
                createTagImagePct(row2);
                createMovieCoverPct(row2);
                createPerformerImagePct(row2);
                createStudiohImagePct(row2);
                createSceneHDPct(row2);

            }
        });
    });

})();