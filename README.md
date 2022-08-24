# Stash Userscripts

## [INSTALL USERSCRIPT - ALL SCRIPTS IN ONE BUNDLE](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Userscripts%20Bundle.user.js)

Installation requires a browser extension such as [Violentmonkey](https://violentmonkey.github.io/) / [Tampermonkey](https://www.tampermonkey.net/) / [Greasemonkey](https://www.greasespot.net/).

| Script Name  | Description | Install |
| ------------- | ------------- | ------------- |
| Stash Batch Query Edit | In Scene Tagger, adds button to batch update all query fields with just Date + Studio + Performers. TODO: More configuration options  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Batch%20Query%20Edit.user.js)  |
| Stash Batch Result Toggle  | In Scene Tagger, adds button to toggle all stashdb scene match result fields. Saves clicks when you only want to save a few metadata fields. Instead of turning off every field, you batch toggle them off, then toggle on the ones you want  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Batch%20Result%20Toggle.user.js)  |
| Stash Batch Save  | In Scene Tagger, adds button to batch save all scenes. Opens a confirmation popup with clicked  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Batch%20Save.user.js)  |
| Stash Batch Search  | In Scene Tagger, adds button to batch search all scenes  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Batch%20Search.user.js)  |
| Stash Match Metadata Highlight  | In Scene Tagger, adds button to compare local scene metadata with stashdb matches. Highlights stashdb match results matching fields green and mismatching fields red  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Match%20Metadata%20Highlight.user.js)  |
| Stash New Performer Filter Button  | Adds button to performers page to switch to a filter by new performers tagger view  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20New%20Performer%20Filter%20Button.user.js)  |
| Stash Open VLC  | Open filepath link on scene page 'File Info' tab in VLC when clicked  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Open%20VLC.user.js)  |
| Stash Performer Audit Task Button  | WIP  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Performer%20Audit%20Task%20Button.user.js)  |
| Stash Performer URL Searchbox  | Adds a performer URL search textbox to performers page for quicker searching by performer URL |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Performer%20URL%20Searchbox.user.js)  |
| Stash Performer YAML Details Linkify  | WIP  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Performer%20YAML%20Details%20Linkify.user.js)  |
| Stash StashID Input  | Adds input textboxes to performer detail and studio detail pages for stashid entry. Also displays studio stashids on studio page without having to click edit to view |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20StashID%20Input.user.js)  |
| Stash Stats  | Adds new stats to the stats page: marker count, favorite performer count, studios with stashid %, performers with stashid %, scenes with stashid %  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Stats.user.js)  |
| Stash Studio Image And Parent On Create | In Scene Tagger, sets studio image and parent studio from StashDB when a studio is created  |  [INSTALL USERSCRIPT](https://github.com/7dJx1qP/stash-userscripts/raw/master/dist/public/Stash%20Studio%20Image%20And%20Parent%20On%20Create.user.js)  |

Performers page

![Performers page](images/performers-page.png?raw=true "Performers page")

Stats page

![Stats page](images/stats-page.png?raw=true "Stats page")

Scenes page tagger view

![Scenes page tagger view](images/scenes-tagger.png?raw=true "Scenes page tagger view")

Studio page

![Studio page](images/studio-page.png?raw=true "Studio page")

Performer page

![Performer page](images/performer-page.png?raw=true "Performer page")

## Installation

Download raw userscript files from `dist\public` or install from raw github urls

Pick and choose which userscript to install or install just `Stash Userscripts Bundle.user.js` to get all of them

## Settings

### Server URL

If you access stash over a network or use a different localhost port, you can set your server url from the Settings -> System tab.

![Settings page system tab](images/system-settings.png?raw=true "Settings page system tab")

## Requirements

These userscripts require the `userscript_functions` stash plugin in the `plugins` folder:
* Stash Open VLC
  * Set `VLC_PATH` to your vlc.exe path in the file `userscript_functions\config.py`
* Stash Studio Image And Parent On Create
* Stash Performer YAML Details Linkify

These userscripts rely on unreleased plugins not yet ready for public use and should be ignored for now. I only include them now for source control purposes:
* Stash Performer YAML Details Linkify
  * This assumes performer details contain a YAML document with urls and paths which is how I track my performer folders and multiple performer urls. There's an accompanying unreleased plugin for initializing all performer details this way as a standalone task and on performer creation.
* Stash Performer Audit Task Button
  * This runs an unreleased plugin task that checks for performers with duplicate IAFD urls

## Developing

Update `config.py` and set `ROOTDIR` to your `stash-userscripts` path

Each userscript source is split into two files:
* `src/header` - Folder with userscript metadata blocks
* `src/body` - Folder with main script code

`py build.py` - Combines source files and generates a userscript bundle to `dist\local` for local development and individual userscripts and a bundle to `dist\public` for release.
* `dist\local` - A userscript bundle with `@require` headers that load the script code from local files (`src/body`)
* `dist\public` - Userscripts with `@require` headers that load the script code from this github repo