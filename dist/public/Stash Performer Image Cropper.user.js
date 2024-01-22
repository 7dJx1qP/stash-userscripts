// ==UserScript==
// @name        Stash Performer Image Cropper
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds an image cropper to performer page
// @version     0.3.0
// @author      7dJx1qP
// @match       http://localhost:9999/*
// @resource    IMPORTED_CSS https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.css
// @grant       unsafeWindow
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/develop/src\StashUserscriptLibrary.js
// @require     https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.js
// ==/UserScript==

/* global Cropper */

(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        reloadImg,
    } = unsafeWindow.stash;

    const css = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(css);
    GM_addStyle(".cropper-view-box img { transition: none; }");
    GM_addStyle(".detail-header-image { flex-direction: column; }");

    let cropping = false;
    let cropper = null;

    stash.addEventListener('page:performer', function () {
        waitForElementClass('detail-container', function () {
            const cropBtnContainerId = "crop-btn-container";
            if (!document.getElementById(cropBtnContainerId)) {
                const performerId = window.location.pathname.replace('/performers/', '').split('/')[0];
                const image = getElementByXpath("//div[contains(@class, 'detail-header-image')]//img[@class='performer']");
                image.parentElement.addEventListener('click', (evt) => {
                    if (cropping) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                })
                const cropBtnContainer = document.createElement('div');
                cropBtnContainer.setAttribute("id", cropBtnContainerId);
                image.parentElement.parentElement.appendChild(cropBtnContainer);
    
                const cropInfo = document.createElement('p');

                const imageUrl = getElementByXpath("//div[contains(@class, 'detail-header-image')]//img[@class='performer']/@src").nodeValue;
                const cropStart = document.createElement('button');
                cropStart.setAttribute("id", "crop-start");
                cropStart.classList.add('btn', 'btn-primary');
                cropStart.innerText = 'Crop Image';
                cropStart.addEventListener('click', evt => {
                    cropping = true;
                    cropStart.style.display = 'none';
                    cropCancel.style.display = 'inline-block';
    
                    cropper = new Cropper(image, {
                        viewMode: 1,
                        initialAspectRatio: 2 /3,
                        movable: false,
                        rotatable: false,
                        scalable: false,
                        zoomable: false,
                        zoomOnTouch: false,
                        zoomOnWheel: false,
                        ready() {
                            cropAccept.style.display = 'inline-block';
                        },
                        crop(e) {
                            cropInfo.innerText = `X: ${Math.round(e.detail.x)}, Y: ${Math.round(e.detail.y)}, Width: ${Math.round(e.detail.width)}px, Height: ${Math.round(e.detail.height)}px`;
                        }
                    });
                });
                cropBtnContainer.appendChild(cropStart);
                
                const cropAccept = document.createElement('button');
                cropAccept.setAttribute("id", "crop-accept");
                cropAccept.classList.add('btn', 'btn-success', 'mr-2');
                cropAccept.innerText = 'OK';
                cropAccept.addEventListener('click', async evt => {
                    cropping = false;
                    cropStart.style.display = 'inline-block';
                    cropAccept.style.display = 'none';
                    cropCancel.style.display = 'none';
                    cropInfo.innerText = '';
    
                    const reqData = {
                        "operationName": "PerformerUpdate",
                        "variables": {
                          "input": {
                            "image": cropper.getCroppedCanvas().toDataURL(),
                            "id": performerId
                          }
                        },
                        "query": `mutation PerformerUpdate($input: PerformerUpdateInput!) {
                            performerUpdate(input: $input) {
                              id
                            }
                          }`
                    }
                    await stash.callGQL(reqData);
                    reloadImg(image.src);
                    cropper.destroy();
                });
                cropBtnContainer.appendChild(cropAccept);
                
                const cropCancel = document.createElement('button');
                cropCancel.setAttribute("id", "crop-accept");
                cropCancel.classList.add('btn', 'btn-danger');
                cropCancel.innerText = 'Cancel';
                cropCancel.addEventListener('click', evt => {
                    cropping = false;
                    cropStart.style.display = 'inline-block';
                    cropAccept.style.display = 'none';
                    cropCancel.style.display = 'none';
                    cropInfo.innerText = '';
    
                    cropper.destroy();
                });
                cropBtnContainer.appendChild(cropCancel);
                cropAccept.style.display = 'none';
                cropCancel.style.display = 'none';

                cropBtnContainer.appendChild(cropInfo);
            }
        });
    });
})();