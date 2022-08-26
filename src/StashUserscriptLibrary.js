// Stash Userscript Library
// Exports utility functions and a Stash class that emits events whenever a GQL response is received and whenenever a page navigation change is detected
// version 0.13.0

(function () {
    'use strict';

    const stash = function () {

        const { fetch: originalFetch } = window;
        const stashListener = new EventTarget();

        unsafeWindow.fetch = async (...args) => {
            let [resource, config ] = args;
            // request interceptor here
            const response = await originalFetch(resource, config);
            // response interceptor here
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.clone().json();
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

        function insertAfter(newNode, existingNode) {
            existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
        }

        function createElementFromHTML(htmlString) {
            const div = document.createElement('div');
            div.innerHTML = htmlString.trim();

            // Change this to div.childNodes to support multiple top-level nodes.
            return div.firstChild;
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

        function sortElementChildren(node) {
            const items = node.childNodes;
            const itemsArr = [];
            for (const i in items) {
                if (items[i].nodeType == Node.ELEMENT_NODE) { // get rid of the whitespace text nodes
                    itemsArr.push(items[i]);
                }
            }

            itemsArr.sort((a, b) => {
                return a.innerHTML == b.innerHTML
                    ? 0
                    : (a.innerHTML > b.innerHTML ? 1 : -1);
            });

            for (let i = 0; i < itemsArr.length; i++) {
                node.appendChild(itemsArr[i]);
            }
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
                    if (evt.detail.data?.plugins) {
                        this.getPluginVersion(evt.detail);
                    }
                    this.dispatchEvent(new CustomEvent('stash:response', { 'detail': evt.detail }));
                });
                stashListener.addEventListener('pluginVersion', (evt) => {
                    if (this.pluginVersion !== evt.detail) {
                        this.pluginVersion = evt.detail;
                        this.dispatchEvent(new CustomEvent('stash:pluginVersion', { 'detail': evt.detail }));
                    }
                });
                this.pluginVersion = null;
                this.getPlugins().then(plugins => this.getPluginVersion(plugins));
            }
            comparePluginVersion(minPluginVersion) {
                let [currMajor, currMinor, currPatch = 0] = this.pluginVersion.split('.').map(i => parseInt(i));
                let [minMajor, minMinor, minPatch = 0] = minPluginVersion.split('.').map(i => parseInt(i));
                if (currMajor > minMajor) return 1;
                if (currMajor < minMajor) return -1;
                if (currMinor > minMinor) return 1;
                if (currMinor < minMinor) return -1;
                return 0;

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
            async getPlugins() {
                const reqData = {
                    "operationName": "Plugins",
                    "variables": {},
                    "query": `query Plugins {
  plugins {
    id
    name
    description
    url
    version
    tasks {
      name
      description
      __typename
    }
    hooks {
      name
      description
      hooks
    }
  }
}
`
                };
                return this.callGQL(reqData);
            }
            async getPluginVersion(plugins) {
                let version = null;
                for (const plugin of plugins.data.plugins) {
                    if (plugin.id === 'userscript_functions') {
                        version = plugin.version;
                    }
                }
                stashListener.dispatchEvent(new CustomEvent('pluginVersion', { 'detail': version }));
            }
            matchUrl(location, fragment) {
                const regexp = concatRegexp(new RegExp(location.origin), fragment);
                this.log.debug(regexp, location.href.match(regexp));
                return location.href.match(regexp) != null;
            }
            createSettings() {
                const settingsId = 'userscript-settings';
                waitForElementId('configuration-tabs-tabpane-system', (elementId, el) => {
                    if (!document.getElementById(settingsId)) {
                        const section = document.createElement("div");
                        section.setAttribute('id', settingsId);
                        section.classList.add('setting-section');
                        section.innerHTML = `<h1>Userscript Plugin Config</h1>
<div class="card" id="userscript-section-server-url">
  <div class="setting">
    <div>
      <h3>Server URL</h3>
    </div>
    <div>
      <div class="flex-grow-1 query-text-field-group">
        <input id="userscript-server-url" class="bg-secondary text-white border-secondary form-control" placeholder="Server URL…">
      </div>
    </div>
  </div>
</div>
<div class="card" id="userscript-section-server-apikey">
  <div class="setting">
    <div>
      <h3>API Key</h3>
    </div>
    <div>
      <div class="flex-grow-1 query-text-field-group">
        <input id="userscript-server-apikey" class="bg-secondary text-white border-secondary form-control" placeholder="API Key…">
      </div>
    </div>
  </div>
</div>`;
                        el.appendChild(section);

                        const serverUrlInput = document.getElementById('userscript-server-url');
                        serverUrlInput.addEventListener('change', () => {
                            const value = serverUrlInput.value || '';
                            if (value) {
                                this.updateConfigValueTask('STASH', 'url', value);
                                alert(`Userscripts plugin server URL set to ${value}`);
                            }
                            else {
                                this.getConfigValueTask('STASH', 'url').then(value => {
                                    serverUrlInput.value = value;
                                });
                            }
                        });
                        serverUrlInput.disabled = true;
                        this.getConfigValueTask('STASH', 'url').then(value => {
                            serverUrlInput.value = value || '';
                        });

                        const apiKeyInput = document.getElementById('userscript-server-apikey');
                        apiKeyInput.addEventListener('change', () => {
                            const value = apiKeyInput.value || '';
                            this.updateConfigValueTask('STASH', 'api_key', value);
                            if (value) {
                                alert(`Userscripts plugin server api key set to ${value}`);
                            }
                            else {
                                alert(`Userscripts plugin server api key value cleared`);
                            }
                        });
                        apiKeyInput.disabled = true;
                        this.getConfigValueTask('STASH', 'api_key').then(value => {
                            apiKeyInput.value = value || '';
                        });
                    };
                });
            }
            get serverUrl() {
                return window.location.origin;
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

                // settings page tasks tab
                if (this.matchUrl(location, /\/settings\?tab=tasks/)) {
                    this.log.debug('[Navigation] Settings Page Tasks Tab');
                    this.dispatchEvent(new Event('page:settings:tasks'));

                    // hide userscript functions plugin tasks
                    waitForElementByXpath("//div[@id='tasks-panel']//h3[text()='Userscript Functions']/ancestor::div[contains(@class, 'setting-group')]", function (elementId, el) {
                        el.style.display = 'none';
                    });
                }
                // settings page system tab
                else if (this.matchUrl(location, /\/settings\?tab=system/)) {
                    this.log.debug('[Navigation] Settings Page System Tab');
                    this.createSettings();
                    this.dispatchEvent(new Event('page:settings:system'));
                }
                else if (this.matchUrl(location, /\/settings/)) {
                    this.log.debug('[Navigation] Settings Page');
                    this.dispatchEvent(new Event('page:settings'));
                }

                // stats page
                if (this.matchUrl(location, /\/stats/)) {
                    this.log.debug('[Navigation] Stats Page');
                    this.dispatchEvent(new Event('page:stats'));
                }
            }
            async updateConfigValueTask(sectionKey, propName, value) {
                return this.runPluginTask("userscript_functions", "Update Config Value", [{"key":"section_key", "value":{"str": sectionKey}}, {"key":"prop_name", "value":{"str": propName}}, {"key":"value", "value":{"str": value}}]);
            }
            async getConfigValueTask(sectionKey, propName) {
                const reqTime = Date.now();

                await this.runPluginTask("userscript_functions", "Get Config Value", [{"key":"section_key", "value":{"str": sectionKey}}, {"key":"prop_name", "value":{"str": propName}}]);

                const reqData = {
                    "variables": {},
                    "query": `query Logs {
          logs {
            time
            level
            message
          }
        }`
                };

                // poll logs until plugin task output appears
                await new Promise(r => setTimeout(r, 500));
                let retries = 0;
                while (true) {
                    const delay = 2 ** retries * 100;
                    await new Promise(r => setTimeout(r, delay));
                    retries++;
        
                    const prefix = `[Plugin / Userscript Functions] get_config_value: [${sectionKey}][${propName}] =`
                    const logs = await this.callGQL(reqData);
                    for (const log of logs.data.logs) {
                        const logTime = Date.parse(log.time);
                        if (logTime > reqTime && log.message.startsWith(prefix)) {
                            return log.message.replace(prefix, '').trim();
                        }
                    }

                    if (retries >= 5) {
                        throw 'Get config value failed.';
                    }
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
            insertAfter,
            createElementFromHTML,
            setNativeValue,
            updateTextInput,
            sortElementChildren,
            Logger,
        };
    };

    if (!window.stash) {
        window.stash = stash();
    }
})();