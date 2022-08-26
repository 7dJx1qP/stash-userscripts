(function() {
    'use strict';

    console.log('Stash Match Metadata Highlight');

    const DELAY = 200;

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getElementsByXpath,
        getClosestAncestor,
        updateTextInput,
        sortElementChildren,
    } = window.stash;

    let running = false;
    const buttons = [];

    const datePattern = /\d{4}\-\d{2}\-\d{2}/g;

    function run() {
        if (!running) return;
        const button = buttons.pop();
        if (button) {
            const scene = getClosestAncestor(button, '.search-item');
            const myTitle = scene.querySelector('a.scene-link > div.TruncatedText');
            let myDate = '';

            const queryInput = scene.querySelector('input.text-input');
            let newQuery = queryInput.value;

            let dateIndex = queryInput.value.search(datePattern);
            if (dateIndex !== -1) {
                myDate = queryInput.value.substring(dateIndex, dateIndex+10);
            }

            const resultMetadata = scene.querySelector('li.search-result.selected-result.active div.scene-metadata');
            const resultTitle = resultMetadata.querySelector('h4 > div.optional-field > div.optional-field-content > a > div.TruncatedText');
            if (resultTitle) {
                if (queryInput.value.indexOf(resultTitle.innerText) === -1) {
                    resultTitle.style.color = 'red';
                }
                else {
                    resultTitle.style.color = 'green';
                    newQuery = newQuery.replace(resultTitle.innerText, '');
                }
            }
            const resultDate = resultMetadata.querySelector('h5 > div.optional-field > div.optional-field-content');
            if (resultDate) {
                if (queryInput.value.indexOf(resultDate.innerText) === -1) {
                    resultDate.style.color = 'red';
                }
                else {
                    resultDate.style.color = 'green';
                    newQuery = newQuery.replace(resultDate.innerText, '');
                }
            }

            const resultStudio = getElementByXpath('.//div[@class="entity-name" and text()="Studio"]/following-sibling::span[@class="ml-auto"]//b', scene);
            if (queryInput.value.indexOf(resultStudio.innerText) === -1) {
                resultStudio.style.color = 'red';
            }
            else {
                resultStudio.style.color = 'green';
                newQuery = newQuery.replace(resultStudio.innerText, '');
            }

            const resultPerformers = getElementsByXpath('.//div[@class="entity-name" and text()="Performer"]/following-sibling::span[@class="ml-auto"]//b', scene);
            let node = null;
            while (node = resultPerformers.iterateNext()) {
                if (queryInput.value.indexOf(node.innerText) === -1) {
                    node.style.color = 'red';
                }
                else {
                    node.style.color = 'green';
                    newQuery = newQuery.replace(node.innerText, '');
                }
            }

            updateTextInput(queryInput, newQuery);


            setTimeout(run, 50);
        }
        else {
            stop();
        }
    }

    const btnId = 'metadata-highlight';
    const startLabel = 'Highlight';
    const stopLabel = 'Stop Highlight';
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
        console.log('Highlight Started');
        buttons.length = 0;
        for (const button of document.querySelectorAll('.btn.btn-primary')) {
            if (button.innerText === 'Save') {
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
        console.log('Highlight Stopped');
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