// Stash Userscript Library
// Exports utility functions and a Stash class that emits events whenever a GQL response is received and whenenever a page navigation change is detected
// version 0.7.0

(function () {
    'use strict';

    const stash = function () {

        const { fetch: originalFetch } = window;
        const stashListener = new EventTarget();

        window.fetch = async (...args) => {
            // console.log('fetch request', args);
            let [resource, config ] = args;
            // request interceptor here
            const response = await originalFetch(resource, config);
            // response interceptor here
            const contentType = response.headers.get("content-type");
            // console.log('fetch response', response, contentType);
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.clone().json();
                // console.log('fetch data', data);
                stashListener.dispatchEvent(new CustomEvent('response', { 'detail': data }));
            }
            return response;
        };

        class Logger {
            constructor(enabled) {
                this.enabled = enabled;
            }
            debug() {
                if (!this.enabled) return;
                console.debug(...arguments);
            }
        }

        function waitForElementId(elementId, callBack, time) {
            time = (typeof time !== 'undefined') ? time : 100;
            window.setTimeout(() => {
                const element = document.getElementById(elementId);
                if (element) {
                    callBack(elementId, element);
                } else {
                    waitForElementId(elementId, callBack);
                }
            }, time);
        }

        function waitForElementClass(elementId, callBack, time) {
            time = (typeof time !== 'undefined') ? time : 100;
            window.setTimeout(() => {
                const element = document.getElementsByClassName(elementId);
                if (element.length > 0) {
                    callBack(elementId, element);
                } else {
                    waitForElementClass(elementId, callBack);
                }
            }, time);
        }

        function waitForElementByXpath(xpath, callBack, time) {
            time = (typeof time !== 'undefined') ? time : 100;
            window.setTimeout(() => {
                const element = getElementByXpath(xpath);
                if (element) {
                    callBack(xpath, element);
                } else {
                    waitForElementByXpath(xpath, callBack);
                }
            }, time);
        }

        function getElementByXpath(xpath, contextNode) {
            return document.evaluate(xpath, contextNode || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }

        function getElementsByXpath(xpath, contextNode) {
            return document.evaluate(xpath, contextNode || document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        }

        function getClosestAncestor(el, selector, stopSelector) {
            let retval = null;
            while (el) {
                if (el.matches(selector)) {
                    retval = el;
                    break
                } else if (stopSelector && el.matches(stopSelector)) {
                    break
                }
                el = el.parentElement;
            }
            return retval;
        }

        function setNativeValue(element, value) {
            const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
            const prototype = Object.getPrototypeOf(element);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

            if (valueSetter && valueSetter !== prototypeValueSetter) {
                prototypeValueSetter.call(element, value);
            } else {
                valueSetter.call(element, value);
            }
        }

        function updateTextInput(element, value) {
            setNativeValue(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        function concatRegexp(reg, exp) {
            let flags = reg.flags + exp.flags;
            flags = Array.from(new Set(flags.split(''))).join();
            return new RegExp(reg.source + exp.source, flags);
        }

        class Stash extends EventTarget {
            constructor({ pageUrlCheckInterval = 50, logging = false } = {}) {
                super();
                this.log = new Logger(logging);
                this._pageUrlCheckInterval = pageUrlCheckInterval;
                this.fireOnHashChangesToo = true;
                this.pageURLCheckTimer = setInterval(() => {
                    // Loop every 500ms
                    if (this.lastPathStr !== location.pathname || this.lastQueryStr !== location.search || (this.fireOnHashChangesToo && this.lastHashStr !== location.hash)) {
                        this.lastPathStr = location.pathname;
                        this.lastQueryStr = location.search;
                        this.lastHashStr = location.hash;
                        this.gmMain();
                    }
                }, this._pageUrlCheckInterval);
                stashListener.addEventListener('response', (evt) => {
                    this.dispatchEvent(new CustomEvent('stash:response', { 'detail': evt.detail }));
                });
            }
            async runPluginTask(pluginId, taskName, args = []) {
                const reqData = {
                    "operationName": "RunPluginTask",
                    "variables": {
                        "plugin_id": pluginId,
                        "task_name": taskName,
                        "args": args
                    },
                    "query": "mutation RunPluginTask($plugin_id: ID!, $task_name: String!, $args: [PluginArgInput!]) {\n  runPluginTask(plugin_id: $plugin_id, task_name: $task_name, args: $args)\n}\n"
                };
                return this.callGQL(reqData);
            }
            async callGQL(reqData) {
                const options = {
                    method: 'POST',
                    body: JSON.stringify(reqData),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }

                try {
                    const res = await fetch('/graphql', options);
                    this.log.debug(res);
                    return res.json();
                }
                catch (err) {
                    console.error(err);
                }
            }
            matchUrl(location, fragment) {
                const regexp = concatRegexp(new RegExp(location.origin), fragment);
                this.log.debug(regexp, location.href.match(regexp));
                return location.href.match(regexp) != null;
            }
            gmMain() {
                const location = window.location;
                this.log.debug(URL, window.location);

                // marker wall
                if (this.matchUrl(location, /\/scenes\/markers/)) {
                    this.log.debug('[Navigation] Wall-Markers Page');
                    this.dispatchEvent(new Event('page:markers'));
                }
                // scene page
                else if (this.matchUrl(location, /\/scenes\/\d+/)) {
                    this.log.debug('[Navigation] Scene Page');
                    this.dispatchEvent(new Event('page:scene'));
                }
                // scenes wall
                else if (this.matchUrl(location, /\/scenes\?/)) {
                    this.log.debug('[Navigation] Wall-Scene Page');
                    this.dispatchEvent(new Event('page:scenes'));
                }

                // images wall
                if (this.matchUrl(location, /\/images\?/)) {
                    this.log.debug('[Navigation] Wall-Images Page');
                    this.dispatchEvent(new Event('page:images'));
                }
                // image page
                if (this.matchUrl(location, /\/images\/\d+/)) {
                    this.log.debug('[Navigation] Image Page');
                    this.dispatchEvent(new Event('page:image'));
                }

                // movies wall
                if (this.matchUrl(location, /\/movies\?/)) {
                    this.log.debug('[Navigation] Wall-Movies Page');
                    this.dispatchEvent(new Event('page:movies'));
                }
                // movie page
                if (this.matchUrl(location, /\/movies\/\d+/)) {
                    this.log.debug('[Navigation] Movie Page');
                    this.dispatchEvent(new Event('page:movie'));
                }

                // galleries wall
                if (this.matchUrl(location, /\/galleries\?/)) {
                    this.log.debug('[Navigation] Wall-Galleries Page');
                    this.dispatchEvent(new Event('page:galleries'));
                }
                // gallery page
                if (this.matchUrl(location, /\/galleries\/\d+/)) {
                    this.log.debug('[Navigation] Gallery Page');
                    this.dispatchEvent(new Event('page:gallery'));
                }

                // performer scenes page
                if (this.matchUrl(location, /\/performers\/\d+\/scenes/)) {
                    this.log.debug('[Navigation] Performer Page - Scenes');
                    this.dispatchEvent(new Event('page:performer:scenes'));
                }
                // performer galleries page
                else if (this.matchUrl(location, /\/performers\/\d+\/galleries/)) {
                    this.log.debug('[Navigation] Performer Page - Galleries');
                    this.dispatchEvent(new Event('page:performer:galleries'));
                }
                // performer movies page
                else if (this.matchUrl(location, /\/performers\/\d+\/movies/)) {
                    this.log.debug('[Navigation] Performer Page - Movies');
                    this.dispatchEvent(new Event('page:performer:movies'));
                }
                // performer page
                else if (this.matchUrl(location, /\/performers\/\d+/)) {
                    this.log.debug('[Navigation] Performers Page');
                    this.dispatchEvent(new Event('page:performer'));
                }
                // performers wall
                else if (this.matchUrl(location, /\/performers\?/)) {
                    this.log.debug('[Navigation] Wall-Performers Page');
                    this.dispatchEvent(new Event('page:performers'));
                }

                // studio galleries page
                if (this.matchUrl(location, /\/studios\/\d+\/galleries/)) {
                    this.log.debug('[Navigation] Studio Page - Galleries');
                    this.dispatchEvent(new Event('page:studio:galleries'));
                }
                // studio images page
                else if (this.matchUrl(location, /\/studios\/\d+\/images/)) {
                    this.log.debug('[Navigation] Studio Page - Images');
                    this.dispatchEvent(new Event('page:studio:images'));
                }
                // studio performers page
                else if (this.matchUrl(location, /\/studios\/\d+\/performers/)) {
                    this.log.debug('[Navigation] Studio Page - Performers');
                    this.dispatchEvent(new Event('page:studio:performers'));
                }
                // studio movies page
                else if (this.matchUrl(location, /\/studios\/\d+\/movies/)) {
                    this.log.debug('[Navigation] Studio Page - Movies');
                    this.dispatchEvent(new Event('page:studio:movies'));
                }
                // studio childstudios page
                else if (this.matchUrl(location, /\/studios\/\d+\/childstudios/)) {
                    this.log.debug('[Navigation] Studio Page - Child Studios');
                    this.dispatchEvent(new Event('page:studio:childstudios'));
                }
                // studio scenes page
                else if (this.matchUrl(location, /\/studios\/\d+\?/)) {
                    this.log.debug('[Navigation] Studio Page - Scenes');
                    this.dispatchEvent(new Event('page:studio:scenes'));
                }
                // studio page
                else if (this.matchUrl(location, /\/studios\/\d+/)) {
                    this.log.debug('[Navigation] Studio Page');
                    this.dispatchEvent(new Event('page:studio'));
                }
                // studios wall
                else if (this.matchUrl(location, /\/studios\?/)) {
                    this.log.debug('[Navigation] Wall-Studios Page');
                    this.dispatchEvent(new Event('page:studios'));
                }

                // tag galleries page
                if (this.matchUrl(location, /\/tags\/\d+\/galleries/)) {
                    this.log.debug('[Navigation] Tag Page - Galleries');
                    this.dispatchEvent(new Event('page:tag:galleries'));
                }
                // tag images page
                else if (this.matchUrl(location, /\/tags\/\d+\/images/)) {
                    this.log.debug('[Navigation] Tag Page - Images');
                    this.dispatchEvent(new Event('page:tag:images'));
                }
                // tag markers page
                else if (this.matchUrl(location, /\/tags\/\d+\/markers/)) {
                    this.log.debug('[Navigation] Tag Page - Markers');
                    this.dispatchEvent(new Event('page:tag:markers'));
                }
                // tag performers page
                else if (this.matchUrl(location, /\/tags\/\d+\/performers/)) {
                    this.log.debug('[Navigation] Tag Page - Performers');
                    this.dispatchEvent(new Event('page:tag:performers'));
                }
                // tag scenes page
                else if (this.matchUrl(location, /\/tags\/\d+\?/)) {
                    this.log.debug('[Navigation] Tag Page - Scenes');
                    this.dispatchEvent(new Event('page:tag:scenes'));
                }
                // tag page
                else if (this.matchUrl(location, /\/tags\/\d+/)) {
                    this.log.debug('[Navigation] Tag Page');
                    this.dispatchEvent(new Event('page:tag'));
                }
                // tags wall
                else if (this.matchUrl(location, /\/tags\?/)) {
                    this.log.debug('[Navigation] Wall-Tags Page');
                    this.dispatchEvent(new Event('page:tags'));
                }

                // settings page
                if (this.matchUrl(location, /\/settings/)) {
                    this.log.debug('[Navigation] Settings Page');
                    this.dispatchEvent(new Event('page:settings'));
                }

                // stats page
                if (this.matchUrl(location, /\/stats/)) {
                    this.log.debug('[Navigation] Stats Page');
                    this.dispatchEvent(new Event('page:stats'));
                }
            }
        }
        
        return {
            Stash,
            waitForElementId,
            waitForElementClass,
            waitForElementByXpath,
            getElementByXpath,
            getElementsByXpath,
            getClosestAncestor,
            setNativeValue,
            updateTextInput,
            Logger,
        };
    };

    if (!window.stash) {
        window.stash = stash();
    }
})();