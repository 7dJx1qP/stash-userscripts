// ==UserScript==
// @name        Stash Tag Image Cropper
// @namespace   https://github.com/7dJx1qP/stash-userscripts
// @description Adds an image cropper to tag page
// @version     0.2.0
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
        insertAfter,
        reloadImg,
    } = unsafeWindow.stash;

    const css = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(css);

    let cropping = false;
    let cropper = null;

    stash.addEventListener('page:tag:scenes', function () {
        waitForElementClass('detail-container', function () {
            const cropBtnContainerId = "crop-btn-container";
            if (!document.getElementById(cropBtnContainerId)) {
                const tagId = window.location.pathname.replace('/tags/', '').split('/')[0];
                const image = getElementByXpath("//div[contains(@class, 'detail-header-image')]//img[@class='logo']");
                image.parentElement.addEventListener('click', (evt) => {
                    if (cropping) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                })
                const cropBtnContainer = document.createElement('div');
                cropBtnContainer.setAttribute("id", cropBtnContainerId);
                cropBtnContainer.classList.add('mb-2', 'text-center');
                image.parentElement.appendChild(cropBtnContainer);

                const cropInfo = document.createElement('p');

                const imageUrl = getElementByXpath("//div[contains(@class, 'detail-header-image')]//img[@class='logo']/@src").nodeValue;
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
                        initialAspectRatio: 1,
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
                        "operationName": "TagUpdate",
                        "variables": {
                          "input": {
                            "image": cropper.getCroppedCanvas().toDataURL(),
                            "id": tagId
                          }
                        },
                        "query": `mutation TagUpdate($input: TagUpdateInput!) {
                            tagUpdate(input: $input) {
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