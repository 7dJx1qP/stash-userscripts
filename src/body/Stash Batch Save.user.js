(function() {
    'use strict';

    console.log('Stash Batch Save');

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getClosestAncestor,
        sortElementChildren,
    } = window.stash;

    let running = false;
    const buttons = [];
    let sceneId = null;

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const scene = getClosestAncestor(button, '.search-item');
            const sceneLink = scene.querySelector('a.scene-link');
            const sceneURL = new URL(sceneLink.href);
            sceneId = sceneURL.pathname.replace('/scenes/', '');
            if (!button.disabled) {
                button.click();
            }
            else {
                buttons.push(button);
            }
        }
        else {
            stop();
        }
    }

    function processSceneUpdate(evt) {
        if (running && evt.detail.data?.sceneUpdate?.id === sceneId) {
            run();
        }
    }

    const btnId = 'batch-save';
    const startLabel = 'Save All';
    const stopLabel = 'Stop Save';
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
        if (!confirm("Are you sure you want to batch save?")) return;
        btn.innerHTML = stopLabel;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        running = true;
        console.log('Save Started');
        buttons.length = 0;
        for (const button of document.querySelectorAll('.btn.btn-primary')) {
            if (button.innerText === 'Save') {
                buttons.push(button);
            }
        }
        stash.addEventListener('stash:response', processSceneUpdate);
        run();
    }

    function stop() {
        btn.innerHTML = startLabel;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        running = false;
        sceneId = null;
        stash.removeEventListener('stash:response', processSceneUpdate);
        console.log('Save Stopped');
    }

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[text()='Scrape All']", function (xpath, el) {
            if (!document.getElementById(btnId)) {
                const container = el.parentElement;
                container.appendChild(btn);
                sortElementChildren(container);
                el.classList.add('ml-3');
            }
        });
    });
})();