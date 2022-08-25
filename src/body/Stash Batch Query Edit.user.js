(function() {
    'use strict';

    console.log('Stash Batch Query Edit');

    const scenes = {};

    const processScenes = function (data) {
        if (data.data.findScenes?.scenes) {
            for (const scene of data.data.findScenes.scenes) {
                scenes[scene.id] = scene;
            }
        }
    }

    const DELAY = 200;

    const {
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getClosestAncestor,
        updateTextInput,
    } = window.stash;

    const stash = new Stash();

    let running = false;
    const buttons = [];

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const scene = getClosestAncestor(button, '.search-item');
            const sceneLink = scene.querySelector('a.scene-link');
            const sceneURL = new URL(sceneLink.href);
            const sceneId = sceneURL.pathname.replace('/scenes/', '');
            const sceneData = scenes[sceneId];
            const sceneName = scene.querySelector('a.scene-link > div.TruncatedText');

            const queryInput = scene.querySelector('input.text-input');

            const queryData = [];
            if (sceneData.date) queryData.push(sceneData.date);
            if (sceneData.studio) queryData.push(sceneData.studio.name);
            if (sceneData.performers) {
                for (const performer of sceneData.performers) {
                    queryData.push(performer.name);
                }
            }

            const queryValue = queryData.join(' ');
            updateTextInput(queryInput, queryValue);

            setTimeout(run, 50);
        }
        else {
            stop();
        }
    }

    const btnId = 'batch-query-edit';
    const startLabel = 'Query Edit All';
    const stopLabel = 'Stop Query Edit';
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
        console.log('Query Edit Started');
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
        console.log('Query Edit Stopped');
    }

    stash.addEventListener('stash:response', function (evt) {
        processScenes(evt.detail);
    });

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[text()='Scrape All']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;

                container.appendChild(btn);
            }
        });
    });

})();