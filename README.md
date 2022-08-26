# Stash Userscripts

## [INSTALL USERSCRIPT - ALL SCRIPTS IN ONE BUNDLE](dist/public/Stash%20Userscripts%20Bundle.user.js?raw=1)

Installation requires a browser extension such as [Violentmonkey](https://violentmonkey.github.io/) / [Tampermonkey](https://www.tampermonkey.net/) / [Greasemonkey](https://www.greasespot.net/).

Pick and choose which userscript to install or install just `Stash Userscripts Bundle.user.js` to get all of them

| Script Name  | Description | [Plugin Required](#userscript-functions-plugin) | Install |
| ------------- | ------------- | ------------- | ------------- |
| Stash Batch Query Edit | In Scene Tagger, adds button to batch update all query fields with a configurable combination of Date, Studio, Performers, and Title  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Query%20Edit.user.js?raw=1)  |
| Stash Batch Result Toggle  | In Scene Tagger, adds button to toggle all stashdb scene match result fields. Saves clicks when you only want to save a few metadata fields. Instead of turning off every field, you batch toggle them off, then toggle on the ones you want  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Result%20Toggle.user.js?raw=1)  |
| Stash Batch Save  | In Scene Tagger, adds button to batch save all scenes. Opens a confirmation popup with clicked  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Save.user.js?raw=1)  |
| Stash Batch Search  | In Scene Tagger, adds button to batch search all scenes  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Search.user.js?raw=1)  |
| Stash Match Metadata Highlight  | In Scene Tagger, adds button to compare local scene metadata with stashdb matches. Highlights stashdb match results matching fields green and mismatching fields red  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Match%20Metadata%20Highlight.user.js?raw=1)  |
| Stash New Performer Filter Button  | Adds button to performers page to switch to a filter by new performers tagger view  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20New%20Performer%20Filter%20Button.user.js?raw=1)  |
| Stash Open Media Player  | Open filepath link on scene page 'File Info' tab in an external media player when clicked  |:heavy_check_mark:|  [INSTALL USERSCRIPT](dist/public/Stash%20Open%20Media%20Player.user.js?raw=1)  |
| Stash Performer Audit Task Button  |  Adds a button to the performers page to check for duplicate performer urls. Task output shown in stash logs  |:heavy_check_mark:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20Audit%20Task%20Button.user.js?raw=1)  |
| Stash Performer Image Cropper  |  Adds ability to crop performer image from performer page  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20Image%20Cropper.user.js?raw=1)  |
| Stash Performer Tagger Additions  |  Adds performer birthdate and url to tagger view. Makes clicking performer name open stash profile in new tab instead of current tab  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20Tagger%20Additions.user.js?raw=1)  |
| Stash Performer URL Searchbox  | Adds a performer URL search textbox to performers page for quicker searching by performer URL |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20URL%20Searchbox.user.js?raw=1)  |
| Stash Performer YAML Details Linkify  | WIP  |:heavy_check_mark:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20YAML%20Details%20Linkify.user.js?raw=1)  |
| Stash StashID Input  | Adds input textboxes to performer detail and studio detail pages for stashid entry. Also displays studio stashids on studio page without having to click edit to view |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20StashID%20Input.user.js?raw=1)  |
| Stash Stats  | Adds new stats to the stats page: marker count, favorite performer count, studios with stashid %, performers with stashid %, scenes with stashid %  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Stats.user.js?raw=1)  |
| Stash Studio Image And Parent On Create | In Scene Tagger, sets studio image and parent studio from StashDB when a studio is created  |:heavy_check_mark:|  [INSTALL USERSCRIPT](dist/public/Stash%20Studio%20Image%20And%20Parent%20On%20Create.user.js?raw=1)  |

Performers page

![Performers page](images/performers-page.png?raw=true "Performers page")

Stats page

![Stats page](images/stats-page.png?raw=true "Stats page")

Scenes page tagger view

![Scenes page tagger view](images/scenes-tagger.png?raw=true "Scenes page tagger view")

Scenes page tagger view configuration settings

![Scenes page tagger view configuration settings](images/query-edit-config.png?raw=true "Scenes page tagger view configuration settings")

Studio page

![Studio page](images/studio-page.png?raw=true "Studio page")

Performer page

![Performer page](images/performer-page.png?raw=true "Performer page")

Performer page, performer image cropper

![Performer page, performer image cropper](images/performer-image-cropper.png?raw=true "Performer page, performer image cropper")

Performers page tagger view

![Performers page tagger view](images/performer-tagger.png?raw=true "Performers page tagger view")

## Userscript Functions Plugin

This additional stash plugin is required by some userscripts for their functionality

### Requirements

* Python 3.9+
* Requests (https://pypi.org/project/requests/)
* PyStashLib (https://pypi.org/project/pystashlib/)

### Installation

Copy the whole folder [`userscript_functions`](https://github.com/7dJx1qP/stash-userscripts/tree/master/plugins/userscript_functions) to your stash `plugins` folder.

Update `config.ini` in the `userscript_functions` folder with your stash URL.

`pip install requests pystashlib`

Plugin settings aside from the server URL and server api key can be updated from within the Stash settings under the System tab:

![Settings page system tab](images/system-settings.png?raw=true "Settings page system tab")

## WIP

These userscripts rely on unreleased plugins not yet ready for public use and should be ignored for now. I only include them now for source control purposes:
* Stash Performer YAML Details Linkify
  * This assumes performer details contain a YAML document with urls and paths which is how I track my performer folders and multiple performer urls. There's an accompanying unreleased plugin for initializing all performer details this way as a standalone task and on performer creation.

## Developing

Update `config.py` and set `ROOTDIR` to your `stash-userscripts` path

Each userscript source is split into two files:
* `src/header` - Folder with userscript metadata blocks
* `src/body` - Folder with main script code

`py build.py` - Combines source files and generates a userscript bundle to `dist\local` for local development and individual userscripts and a bundle to `dist\public` for release.
* `dist\local` - A userscript bundle with `@require` headers that load the script code from local files (`src/body`)
* `dist\public` - Userscripts with `@require` headers that load the script code from this github repo