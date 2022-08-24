# Stash Userscripts

| Script Name  | Description |
| ------------- | ------------- |
| Stash Batch Query Edit | In Scene Tagger, adds button to batch update all query fields with just Date + Studio + Performers. TODO: More configuration options  |
| Stash Batch Result Toggle  | In Scene Tagger, adds button to toggle all stashdb scene match result fields. Saves clicks when you only want to save a few metadata fields. Instead of turning off every field, you batch toggle them off, then toggle on the ones you want  |
| Stash Batch Save  | In Scene Tagger, adds button to batch save all scenes. Opens a confirmation popup with clicked  |
| Stash Batch Search  | In Scene Tagger, adds button to batch search all scenes  |
| Stash Match Metadata Highlight  | In Scene Tagger, adds button to compare local scene metadata with stashdb matches. Highlights stashdb match results matching fields green and mismatching fields red  |
| Stash New Performer Filter Button  | Adds button to performers page to switch to a filter by new performers tagger view  |
| Stash Open VLC  | Open filepath link on scene page 'File Info' tab in VLC when clicked  |
| Stash Performer Audit Task Button  | WIP  |
| Stash Performer URL Searchbox  | Adds a performer URL search textbox to performers page for quicker searching by performer URL |
| Stash Performer YAML Details Linkify  | WIP  |
| Stash StashID Input  | Adds input textboxes to performer detail and studio detail pages for stashid entry |
| Stash Stats  | Adds new stats to the stats page: marker count, favorite performer count, studios with stashid %, performers with stashid %, scenes with stashid %  |
| Stash Studio Image And Parent On Create | In Scene Tagger, sets studio image and parent studio from StashDB when a studio is created  |

Performers page

![Performers page](images/performers-page.png?raw=true "Performers page")

Stats page

![Stats page](images/stats-page.png?raw=true "Stats page")

Scenes page tagger view

![Scenes page tagger view](images/scenes-tagger.png?raw=true "Scenes page tagger view")

## Installation

Download raw userscript files from `dist\public` or install from raw github urls

Pick and choose which userscript to install or install just `Stash Userscripts Bundle.user.js` to get all of them

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