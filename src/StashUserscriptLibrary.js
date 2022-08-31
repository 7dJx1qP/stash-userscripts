// Stash Userscript Library
// Exports utility functions and a Stash class that emits events whenever a GQL response is received and whenenever a page navigation change is detected
// version 0.26.3

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

        function xPathResultToArray(result) {
            let node = null;
            const nodes = [];
            while (node = result.iterateNext()) {
                nodes.push(node);
            }
            return nodes;
        }

        const reloadImg = url =>
            fetch(url, { cache: 'reload', mode: 'no-cors' })
            .then(() => document.body.querySelectorAll(`img[src='${url}']`)
            .forEach(img => img.src = url));

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
                    this.processRemoteScenes(evt.detail);
                    this.processScenes(evt.detail);
                    this.processPerformers(evt.detail);
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
                this.visiblePluginTasks = ['Userscript Functions'];
                this.settingsCallbacks = [];
                this.settingsId = 'userscript-settings';
                this.remoteScenes = {};
                this.scenes = {};
                this.performers = {};
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
                    const res = await unsafeWindow.fetch('/graphql', options);
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
            async getStashBoxes() {
                const reqData = {
                    "operationName": "Configuration",
                    "variables": {},
                    "query": `query Configuration {
                        configuration {
                          general {
                            stashBoxes {
                              endpoint
                              api_key
                              name
                            }
                          }
                        }
                      }`
                };
                return this.callGQL(reqData);
            }
            matchUrl(location, fragment) {
                const regexp = concatRegexp(new RegExp(location.origin), fragment);
                this.log.debug(regexp, location.href.match(regexp));
                return location.href.match(regexp) != null;
            }
            createSettings() {
                waitForElementId('configuration-tabs-tabpane-system', async (elementId, el) => {
                    let section;
                    if (!document.getElementById(this.settingsId)) {
                        section = document.createElement("div");
                        section.setAttribute('id', this.settingsId);
                        section.classList.add('setting-section');
                        section.innerHTML = `<h1>Userscript Settings</h1>`;
                        el.appendChild(section);

                        const serverUrlInput = await this.createSystemSettingTextbox(section, 'userscript-section-server-url', 'userscript-server-url', 'Stash Server URL', '', 'Server URL…', true);
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

                        const apiKeyInput = await this.createSystemSettingTextbox(section, 'userscript-section-server-apikey', 'userscript-server-apikey', 'Stash API Key', '', 'API Key…', true);
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
                    }
                    else {
                        section = document.getElementById(this.settingsId);
                    }

                    for (const callback of this.settingsCallbacks) {
                        callback(this.settingsId, section);
                    }

                    if (this.pluginVersion) {
                        this.dispatchEvent(new CustomEvent('stash:pluginVersion', { 'detail': this.pluginVersion }));
                    }

                });
            }
            addSystemSetting(callback) {
                const section = document.getElementById(this.settingsId);
                if (section) {
                    callback(this.settingsId, section);
                }
                this.settingsCallbacks.push(callback);
            }
            async createSystemSettingCheckbox(containerEl, settingsId, inputId, settingsHeader, settingsSubheader) {
                const section = document.createElement("div");
                section.setAttribute('id', settingsId);
                section.classList.add('card');
                section.style.display = 'none';
                section.innerHTML = `<div class="setting">
        <div>
        <h3>${settingsHeader}</h3>
        <div class="sub-heading">${settingsSubheader}</div>
        </div>
        <div>
        <div class="custom-control custom-switch">
        <input type="checkbox" id="${inputId}" class="custom-control-input">
        <label title="" for="${inputId}" class="custom-control-label"></label>
        </div>
        </div>
        </div>`;
                containerEl.appendChild(section);
                return document.getElementById(inputId);
            }
            async createSystemSettingTextbox(containerEl, settingsId, inputId, settingsHeader, settingsSubheader, placeholder, visible) {
                const section = document.createElement("div");
                section.setAttribute('id', settingsId);
                section.classList.add('card');
                section.style.display = visible ? 'flex' : 'none';
                section.innerHTML = `<div class="setting">
        <div>
        <h3>${settingsHeader}</h3>
        <div class="sub-heading">${settingsSubheader}</div>
        </div>
        <div>
        <div class="flex-grow-1 query-text-field-group">
        <input id="${inputId}" class="bg-secondary text-white border-secondary form-control" placeholder="${placeholder}">
        </div>
        </div>
        </div>`;
                containerEl.appendChild(section);
                return document.getElementById(inputId);
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
                    this.processTagger();
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

                // movie scenes page
                else if (this.matchUrl(location, /\/movies\/\d+\?/)) {
                    this.log.debug('[Navigation] Movie Page - Scenes');
                    this.processTagger();
                    this.dispatchEvent(new Event('page:movie:scenes'));
                }
                // movie page
                else if (this.matchUrl(location, /\/movies\/\d+/)) {
                    this.log.debug('[Navigation] Movie Page');
                    this.dispatchEvent(new Event('page:movie'));
                }
                // movies wall
                else if (this.matchUrl(location, /\/movies\?/)) {
                    this.log.debug('[Navigation] Wall-Movies Page');
                    this.dispatchEvent(new Event('page:movies'));
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
                    this.processTagger();
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
                    this.dispatchEvent(new Event('page:performer:details'));

                    waitForElementClass('performer-tabs', (className, targetNode) => {
                        const observerOptions = {
                            childList: true
                        }
                        const observer = new MutationObserver(mutations => {
                            let isPerformerEdit = false;
                            mutations.forEach(mutation => {
                                mutation.addedNodes.forEach(node => {
                                    if (node.id === 'performer-edit') {
                                        isPerformerEdit = true;
                                    }
                                });
                            });
                            if (isPerformerEdit) {
                                this.dispatchEvent(new Event('page:performer:edit'));
                            }
                            else {
                                this.dispatchEvent(new Event('page:performer:details'));
                            }
                        });
                        observer.observe(targetNode[0], observerOptions);
                    });
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
                    this.processTagger();
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
                    this.processTagger();
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
                    this.hidePluginTasks();
                }
                // settings page system tab
                else if (this.matchUrl(location, /\/settings\?tab=system/)) {
                    this.log.debug('[Navigation] Settings Page System Tab');
                    this.createSettings();
                    this.dispatchEvent(new Event('page:settings:system'));
                }
                // settings page (defaults to tasks tab)
                else if (this.matchUrl(location, /\/settings/)) {
                    this.log.debug('[Navigation] Settings Page Tasks Tab');
                    this.dispatchEvent(new Event('page:settings:tasks'));
                    this.hidePluginTasks();
                }

                // stats page
                if (this.matchUrl(location, /\/stats/)) {
                    this.log.debug('[Navigation] Stats Page');
                    this.dispatchEvent(new Event('page:stats'));
                }
            }
            hidePluginTasks () {
                // hide userscript functions plugin tasks
                waitForElementByXpath("//div[@id='tasks-panel']//h3[text()='Userscript Functions']/ancestor::div[contains(@class, 'setting-group')]", (elementId, el) => {
                    const tasks = el.querySelectorAll('.setting');
                    for (const task of tasks) {
                        const taskName = task.querySelector('h3').innerText;
                        task.classList.add(this.visiblePluginTasks.indexOf(taskName) === -1 ? 'd-none' : 'd-flex');
                        this.dispatchEvent(new CustomEvent('stash:plugin:task', { 'detail': { taskName, task } }));
                    }
                });
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
            processTagger() {
                waitForElementByXpath("//button[text()='Scrape All']", (xpath, el) => {
                    this.dispatchEvent(new CustomEvent('tagger', { 'detail': el }));

                    const searchItemContainer = document.querySelector('.tagger-container').lastChild;

                    const observer = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node?.classList?.contains('entity-name') && node.innerText.startsWith('Performer:')) {
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:remoteperformer', { 'detail': { node, mutation } }));
                                }
                                else if (node?.classList?.contains('entity-name') && node.innerText.startsWith('Studio:')) {
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:remotestudio', { 'detail': { node, mutation } }));
                                }
                                else if (node.tagName === 'SPAN' && node.innerText.startsWith('Matched:')) {
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:local', { 'detail': { node, mutation } }));
                                }
                                else if (node.tagName === 'UL') {
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:container', { 'detail': { node, mutation } }));
                                }
                                else if (node?.classList?.contains('col-lg-6')) {
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:subcontainer', { 'detail': { node, mutation } }));
                                }
                                else if (node.tagName === 'H5') { // scene date
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:date', { 'detail': { node, mutation } }));
                                }
                                else if (node.tagName === 'DIV' && node?.classList?.contains('d-flex') && node?.classList?.contains('flex-column')) { // scene stashid, url, details
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:detailscontainer', { 'detail': { node, mutation } }));
                                }
                                else {
                                    this.dispatchEvent(new CustomEvent('tagger:mutation:add:other', { 'detail': { node, mutation } }));
                                }
                            });
                        });
                        this.dispatchEvent(new CustomEvent('tagger:mutations:searchitems', { 'detail': mutations }));
                    });
                    observer.observe(searchItemContainer, {
                        childList: true,
                        subtree: true
                    });

                    const taggerContainerHeader = document.querySelector('.tagger-container-header');
                    const taggerContainerHeaderObserver = new MutationObserver(mutations => {
                        this.dispatchEvent(new CustomEvent('tagger:mutations:header', { 'detail': mutations }));
                    });
                    taggerContainerHeaderObserver.observe(taggerContainerHeader, {
                        childList: true,
                        subtree: true
                    });

                    for (const searchItem of document.querySelectorAll('.search-item')) {
                        this.dispatchEvent(new CustomEvent('tagger:searchitem', { 'detail': searchItem }));
                    }
                });
                waitForElementByXpath("//div[@class='tagger-container-header']/div/div[@class='row']/h4[text()='Configuration']", (xpath, el) => {
                    this.dispatchEvent(new CustomEvent('tagger:configuration', { 'detail': el }));
                });
            }
            processRemoteScenes(data) {
                if (data.data?.scrapeMultiScenes) {
                    for (const matchResults of data.data.scrapeMultiScenes) {
                        for (const scene of matchResults) {
                            this.remoteScenes[scene.remote_site_id] = scene;
                        }
                    }
                }
                else if (data.data?.scrapeSingleScene) {
                    for (const scene of data.data.scrapeSingleScene) {
                        this.remoteScenes[scene.remote_site_id] = scene;
                    }
                }
            }
            processScenes(data) {
                if (data.data.findScenes?.scenes) {
                    for (const scene of data.data.findScenes.scenes) {
                        this.scenes[scene.id] = scene;
                    }
                }
            }
            processPerformers(data) {
                if (data.data.findPerformers?.performers) {
                    for (const performer of data.data.findPerformers.performers) {
                        this.performers[performer.id] = performer;
                    }
                }
            }
            parseSearchItem(searchItem) {
                const urlNode = searchItem.querySelector('a.scene-link');
                const url = new URL(urlNode.href);
                const id = url.pathname.replace('/scenes/', '');
                const data = this.scenes[id];
                const nameNode = searchItem.querySelector('a.scene-link > div.TruncatedText');
                const name = nameNode.innerText;
                const queryInput = searchItem.querySelector('input.text-input');
                const performerNodes = searchItem.querySelectorAll('.performer-tag-container');

                return {
                    urlNode,
                    url,
                    id,
                    data,
                    nameNode,
                    name,
                    queryInput,
                    performerNodes
                }
            }
            parseSearchResultItem(searchResultItem) {
                const remoteUrlNode = searchResultItem.querySelector('.scene-details .optional-field .optional-field-content a');
                const remoteId = remoteUrlNode?.href.split('/').pop();
                const remoteUrl = remoteUrlNode?.href ? new URL(remoteUrlNode.href) : null;
                const remoteData = this.remoteScenes[remoteId];

                const sceneDetailNodes = searchResultItem.querySelectorAll('.scene-details .optional-field .optional-field-content');
                let urlNode = null;
                let detailsNode = null;
                for (const sceneDetailNode of sceneDetailNodes) {
                    if (remoteData?.url === sceneDetailNode.innerText) {
                        urlNode = sceneDetailNode;
                    }
                    else if (remoteData?.details === sceneDetailNode.textContent) {
                        detailsNode = sceneDetailNode;
                    }
                }

                const imageNode = searchResultItem.querySelector('.scene-image-container .optional-field .optional-field-content');

                const metadataNode = searchResultItem.querySelector('.scene-metadata');
                const titleNode = metadataNode.querySelector('h4 .optional-field .optional-field-content');
                const dateNode = metadataNode.querySelector('h5 .optional-field .optional-field-content');

                const entityNodes = searchResultItem.querySelectorAll('.entity-name');
                let studioNode = null;
                const performerNodes = [];
                for (const entityNode of entityNodes) {
                    if (entityNode.innerText.startsWith('Studio:')) {
                        studioNode = entityNode;
                    }
                    else if (entityNode.innerText.startsWith('Performer:')) {
                        performerNodes.push(entityNode);
                    }
                }

                const matchNodes = searchResultItem.querySelectorAll('div.col-lg-6 div.mt-2 div.row.no-gutters.my-2 span.ml-auto');
                const matches = []
                for (const matchNode of matchNodes) {
                    let matchType = null;
                    const entityNode = matchNode.parentElement.querySelector('.entity-name');

                    const matchName = matchNode.querySelector('.optional-field-content b').innerText;
                    const remoteName = entityNode.querySelector('b').innerText;

                    let data;
                    if (entityNode.innerText.startsWith('Performer:')) {
                        matchType = 'performer';
                        if (remoteData) {
                            data = remoteData.performers.find(performer => performer.name === remoteName);
                        }
                    }
                    else if (entityNode.innerText.startsWith('Studio:')) {
                        matchType = 'studio';
                        if (remoteData) {
                            data = remoteData.studio
                        }
                    }

                    matches.push({
                        matchType,
                        matchNode,
                        entityNode,
                        matchName,
                        remoteName,
                        data
                    });
                }

                return {
                    remoteUrlNode,
                    remoteId,
                    remoteUrl,
                    remoteData,
                    urlNode,
                    detailsNode,
                    imageNode,
                    titleNode,
                    dateNode,
                    studioNode,
                    performerNodes,
                    matches
                }
            }
        }
        
        return {
            stash: new Stash({ logging: false }),
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
            xPathResultToArray,
            reloadImg,
            Logger,
        };
    };

    if (!window.stash) {
        window.stash = stash();
    }
})();