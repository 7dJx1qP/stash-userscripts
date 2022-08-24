# Stash Userscripts

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