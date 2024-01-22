# Stash Userscripts

## [INSTALL USERSCRIPT - ALL SCRIPTS IN ONE BUNDLE](dist/public/Stash%20Userscripts%20Bundle.user.js?raw=1)

Installation requires a browser extension such as [Violentmonkey](https://violentmonkey.github.io/) / [Tampermonkey](https://www.tampermonkey.net/) / [Greasemonkey](https://www.greasespot.net/).

> You may remove any unwanted userscripts from the bundle by removing the line that starts with `// @require` that corresponds to the userscript you wish to remove.

**By default the userscripts only work for `http://localhost:9999`**

> If you access Stash from a different address, you will need to modify the userscript when you install it.
>
> Find the line `// @match       http://localhost:9999/*` and replace `http://localhost:9999/*` with your Stash address.

Pick and choose which userscript to install in the table below or install just `Stash Userscripts Bundle.user.js` to get all of them.

| Script Name  | Description | [Plugin Required](#userscript-functions-plugin) | Install |
| ------------- | ------------- | ------------- | ------------- |
| Stash Batch Query Edit | In Scene Tagger, adds button to batch update all query fields with a configurable combination of Date, Studio, Performers, and Title  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Query%20Edit.user.js?raw=1)  |
| Stash Batch Result Toggle  | In Scene Tagger, adds button to toggle all stashdb scene match result fields. Saves clicks when you only want to save a few metadata fields. Instead of turning off every field, you batch toggle them off, then toggle on the ones you want  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Result%20Toggle.user.js?raw=1)  |
| Stash Batch Save  | In Scene Tagger, adds button to batch save all scenes. Opens a confirmation popup with clicked  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Save.user.js?raw=1)  |
| Stash Batch Search  | In Scene Tagger, adds button to batch search all scenes  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Batch%20Search.user.js?raw=1)  |
| Stash Markdown  | Adds markdown parsing to tag description fields  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Markdown.user.js?raw=1)  |
| Stash New Performer Filter Button  | Adds button to performers page to switch to a filter by new performers tagger view  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20New%20Performer%20Filter%20Button.user.js?raw=1)  |
| Stash Open Media Player  | Open filepath link on scene page 'File Info' tab in an external media player when clicked  |:heavy_check_mark:|  [INSTALL USERSCRIPT](dist/public/Stash%20Open%20Media%20Player.user.js?raw=1)  |
| Stash Performer Audit Task Button  |  Adds a button to the performers page to check for duplicate performer urls. Task output shown in stash logs  |:heavy_check_mark:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20Audit%20Task%20Button.user.js?raw=1)  |
| Stash Performer Image Cropper  |  Adds ability to crop performer image from performer page  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20Image%20Cropper.user.js?raw=1)  |
| Stash Performer Markers Tab  |  Adds a Markers link to performer pages  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20Markers%20Tab.user.js?raw=1)  |
| Stash Performer Tagger Additions  |  Adds performer birthdate and url to tagger view. Makes clicking performer name open stash profile in new tab instead of current tab  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20Tagger%20Additions.user.js?raw=1)  |
| Stash Performer URL Searchbox  | Adds a performer URL search textbox to performers page for quicker searching by performer URL |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Performer%20URL%20Searchbox.user.js?raw=1)  |
| Stash Scene Tagger Additions  |  Adds scene duration, filepath, and url to tagger view in the collapsible scene details sections. Adds shift-click to collapsible scene details buttons to open/close all. |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Scene%20Tagger%20Additions.user.js?raw=1)  |
| Stash Scene Tagger Colorizer  | In Scene Tagger, colorize scrape results. Matching fields are green, missing fields are yellow, and mismatching fields are red  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Scene%20Tagger%20Colorizer.user.js?raw=1)  |
| Stash Scene Tagger Draft Submit  | Adds button to Scene Tagger to submit draft to stashdb |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Scene%20Tagger%20Draft%20Submit.user.js?raw=1)  |
| Stash Set Stashbox Favorite Performers  | Sync Stashbox favorite performers whenever a stash performer is favorited or unfavorited. Also adds button to performers page to sync all |:heavy_check_mark:|  [INSTALL USERSCRIPT](dist/public/Stash%20Set%20Stashbox%20Favorite%20Performers.user.js?raw=1)  |
| Stash StashID Icon  | Adds checkmark icon to performer and studio cards that have a stashid |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20StashID%20Icon.user.js?raw=1)  |
| Stash StashID Input  | Adds input textboxes to performer detail and studio detail pages for stashid entry. Also displays studio stashids on studio page without having to click edit to view |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20StashID%20Input.user.js?raw=1)  |
| Stash Stats  | Adds new stats to the stats page: marker count, favorite performer count, studios with stashid %, performers with stashid %, scenes with stashid %  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Stats.user.js?raw=1)  |
| Stash Tag Image Cropper  |  Adds ability to crop tag image from tag page  |:x:|  [INSTALL USERSCRIPT](dist/public/Stash%20Tag%20Image%20Cropper.user.js?raw=1)  |

# Screenshots

## Stash Batch Query Edit

![Config](images/Stash%20Batch%20Query%20Edit/config.png?raw=true "Config")

![Scenes tagger](images/Stash%20Batch%20Query%20Edit/scenes-tagger.png?raw=true "Scenes tagger")

## Stash Batch Result Toggle

![Config](images/Stash%20Batch%20Result%20Toggle/config.png?raw=true "Config")

![Scenes tagger](images/Stash%20Batch%20Result%20Toggle/scenes-tagger.png?raw=true "Scenes tagger")

## Stash Batch Save

![Scenes tagger](images/Stash%20Batch%20Save/scenes-tagger.png?raw=true "Scenes tagger")

## Stash Batch Search

![Scenes tagger](images/Stash%20Batch%20Search/scenes-tagger.png?raw=true "Scenes tagger")

## Stash Markdown

![Tag description](images/Stash%20Markdown/tag-description.png?raw=true "Tag description")

## Stash New Performer Filter Button

![Performers page](images/Stash%20New%20Performer%20Filter%20Button/performers-page.png?raw=true "Performers page")

## Stash Open Media Player

![System settings](images/Stash%20Open%20Media%20Player/system-settings.png?raw=true "System settings")

## Stash Performer Audit Task Button

![Plugin tasks](images/Stash%20Performer%20Audit%20Task%20Button/plugin-tasks.png?raw=true "Plugin tasks")

![System settings](images/Stash%20Performer%20Audit%20Task%20Button/system-settings.png?raw=true "System settings")

![Performers page](images/Stash%20Performer%20Audit%20Task%20Button/performers-page.png?raw=true "Performers page")

## Stash Performer Image Cropper

![Cropper](images/Stash%20Performer%20Image%20Cropper/performer-image-cropper.png?raw=true "Cropper")

## Stash Performer Markers Tab

![Performer page](images/Stash%20Performer%20Markers%20Tab/performer-page.png?raw=true "Performer page")

## Stash Performer Tagger Additions

![Performer tagger](images/Stash%20Performer%20Tagger%20Additions/performer-tagger.png?raw=true "Performer tagger")

## Stash Performer URL Searchbox

![Performers page](images/Stash%20Performer%20URL%20Searchbox/performers-page.png?raw=true "Performers page")

## Stash Scene Tagger Additions

![Config](images/Stash%20Scene%20Tagger%20Additions/config.png?raw=true "Config")

![Scenes tagger](images/Stash%20Scene%20Tagger%20Additions/scenes-tagger.png?raw=true "Scenes tagger")

## Stash Scene Tagger Colorizer

![Config](images/Stash%20Scene%20Tagger%20Colorizer/config.png?raw=true "Config")

![Scenes tagger](images/Stash%20Scene%20Tagger%20Colorizer/scenes-tagger.png?raw=true "Scenes tagger")

## Stash Scene Tagger Draft Submit

![Scenes tagger](images/Stash%20Scene%20Tagger%20Draft%20Submit/scenes-tagger.png?raw=true "Scenes tagger")

## Stash Set Stashbox Favorite Performers

![Plugin tasks](images/Stash%20Set%20Stashbox%20Favorite%20Performers/plugin-tasks.png?raw=true "Plugin tasks")

![System settings](images/Stash%20Set%20Stashbox%20Favorite%20Performers/system-settings.png?raw=true "System settings")

![Performers page](images/Stash%20Set%20Stashbox%20Favorite%20Performers/performers-page.png?raw=true "Performers page")

## Stash StashID Icon

![Performer page](images/Stash%20StashID%20Icon/performer-page.png?raw=true "Performer page")

![Studio page](images/Stash%20StashID%20Icon/studio-page.png?raw=true "Studio page")

![Studio page](images/Stash%20StashID%20Icon/scene-page.png?raw=true "Scene page")

## Stash StashID Input

![Performer page](images/Stash%20StashID%20Input/performer-page.png?raw=true "Performer page")

![Studio page](images/Stash%20StashID%20Input/studio-page.png?raw=true "Studio page")

## Stash Stats

![Stats page](images/Stash%20Stats/stats-page.png?raw=true "Stats page")

## Stash Tag Image Cropper

![Cropper](images/Stash%20Tag%20Image%20Cropper/tag-image-cropper.png?raw=true "Cropper")

# Userscript Functions Plugin

This additional stash plugin is required by some userscripts for their functionality

### Requirements

* Python 3.9+
* Requests (https://pypi.org/project/requests/)
* PyStashLib (https://pypi.org/project/pystashlib/)

### Installation

Copy the whole folder [`userscript_functions`](https://github.com/7dJx1qP/stash-userscripts/tree/master/plugins/userscript_functions) to your stash `plugins` folder.

`pip install requests pystashlib`

Plugin settings can be updated from within the Stash settings under the System tab. The stash url and api key settings are automatically set for you when the system settings page is loaded.

![System settings](images/Userscript%20Functions%20Plugin/system-settings.png?raw=true "System settings")

* The stash url is determined by the userscript based on the current page url you use to access stash.

* The stash api key value is fully managed by the userscript. If you generate or clear your api key, the userscript will update the plugin `config.ini` api key value.

Plugin tasks:

![Plugin tasks](images/Userscript%20Functions%20Plugin/plugin-tasks.png?raw=true "Plugin tasks")

## Developing

Each userscript source is split into two files:
* `src/header` - Folder with userscript metadata blocks
* `src/body` - Folder with main script code

Execute `py build.py` to combine source files and generate:
* a userscript bundle to `dist\local` for local development
* individual userscripts and a bundle to `dist\public` for release

Build output directories:
* `dist\local` - A userscript bundle with `@require` headers that load the script code from local files (`src/body`)
* `dist\public` - Userscripts with `@require` headers that load the script code from this github repo