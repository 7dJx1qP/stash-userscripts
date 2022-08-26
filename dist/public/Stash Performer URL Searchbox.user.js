// ==UserScript==
// @name        Stash Performer URL Searchbox
// @description Adds a search by performer url textbox to the performers page
// @version     0.1.2
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
// ==/UserScript==

(function () {
    'use strict';

    const {
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
    } = window.stash;

    const stash = new Stash();

    stash.addEventListener('page:performers', function () {
        waitForElementClass("btn-toolbar", function () {
            if (!document.getElementById('performer-url-search-input')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('mx-2', 'mb-2', 'd-flex');
                toolbar.appendChild(newGroup);

                const perfUrlGroup = document.createElement('div');
                perfUrlGroup.classList.add('flex-grow-1', 'query-text-field-group');
                newGroup.appendChild(perfUrlGroup);

                const perfUrlTextbox = document.createElement('input');
                perfUrlTextbox.setAttribute('id', 'performer-url-search-input');
                perfUrlTextbox.classList.add('query-text-field', 'bg-secondary', 'text-white', 'border-secondary', 'form-control');
                perfUrlTextbox.setAttribute('placeholder', 'URL…');
                perfUrlTextbox.addEventListener('change', () => {
                    const url = `${window.location.origin}/performers?c={"type":"url","value":"${perfUrlTextbox.value}","modifier":"EQUALS"}`
                    window.location = url;
                });
                perfUrlGroup.appendChild(perfUrlTextbox);
            }
        });
    });
})();