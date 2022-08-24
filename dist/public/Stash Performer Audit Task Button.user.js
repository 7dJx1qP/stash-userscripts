// ==UserScript==
// @name        Stash Performer Audit Task Button
// @description Adds a button to the performers page to run the audit plugin task
// @version     0.1
// @author      7dJx1qP
// @match       *localhost:9999/*
// @grant       none
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/blob/master/src\StashUserscriptLibrary.js

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
            if (!document.getElementById('audit-task')) {
                const toolbar = document.querySelector(".btn-toolbar");

                const newGroup = document.createElement('div');
                newGroup.classList.add('mx-2', 'mb-2', 'd-flex');
                toolbar.appendChild(newGroup);

                const auditButton = document.createElement("button");
                auditButton.setAttribute("id", "audit-task");
                auditButton.classList.add('btn', 'btn-secondary', 'mr-2');
                auditButton.innerHTML = 'Audit URLs';
                auditButton.onclick = () => {
                    stash.runPluginTask("my_stash_manager", "Audit performer urls");
                };
                newGroup.appendChild(auditButton);
            }
        });
    });
})();