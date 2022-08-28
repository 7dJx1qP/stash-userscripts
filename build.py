import os
import config
from pathlib import Path

def get_active_branch_name():
    head_dir = Path(".") / ".git" / "HEAD"
    with head_dir.open("r") as f: content = f.read().splitlines()

    for line in content:
        if line[0:4] == "ref:":
            return line.partition("refs/heads/")[2]

def build():
    ROOTDIR = Path(__file__).parent.resolve()
    LIBFILE = "StashUserscriptLibrary.js"
    GIT_BRANCH = get_active_branch_name()
    GITHUB_ROOT_URL = config.GITHUB_ROOT_URL.replace('%%BRANCH%%', GIT_BRANCH)
    print('git branch', GIT_BRANCH)

    localbodyfiles = []
    distbodyfiles = []
    distlibfile = os.path.join(GITHUB_ROOT_URL, 'src', LIBFILE)
    for file in os.listdir('src/header'):
        headerpath = os.path.join('src/header', file)
        bodypath = os.path.join('src/body', file)
        distpublicpath = os.path.join('dist/public', file)
        header = open(headerpath, 'r').read()
        body = open(bodypath, 'r').read()

        localbodyfiles.append("file://" + os.path.join(ROOTDIR, 'src/body', file))
        distbodyfiles.append(os.path.join(GITHUB_ROOT_URL, 'src/body', file))
        
        header = header.replace("%LIBRARYPATH%", distlibfile) \
                       .replace("%MATCHURL%", f"{config.SERVER_URL}/*") \
                       .replace("// @require     %FILEPATH%\n", "")
        distscript = header + "\n\n" + body
        with open(distpublicpath, 'w') as f:
            f.write(distscript)
            print(distpublicpath)

    localpath = 'dist/local/Stash Userscripts Development Bundle.user.js'
    locallibfile = "file://" + os.path.join(ROOTDIR, 'src', LIBFILE)
    with open(localpath, 'w') as f:
        f.write(f"""// ==UserScript==
// @name        Stash Userscripts Development Bundle
// @description Stash Userscripts Development Bundle
// @version     {config.BUNDLE_VERSION}
// @author      7dJx1qP
// @match       {config.SERVER_URL}/*
// @resource    IMPORTED_CSS https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.css
// @grant       unsafeWindow
// @grant       GM_setClipboard
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM.getValue
// @grant       GM.setValue
// @require     https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.js
// @require     https://raw.githubusercontent.com/nodeca/js-yaml/master/dist/js-yaml.js
// @require     {locallibfile}
//
// **************************************************************************************************
// *            YOU MAY REMOVE ANY OF THE @require LINES BELOW FOR SCRIPTS YOU DO NOT WANT          *
// **************************************************************************************************
//\n""")
        for localbodyfile in localbodyfiles:
            f.write(f"// @require     {localbodyfile}\n")
        f.write("\n// ==/UserScript==\n")
        print(localpath)

    distpath = 'dist/public/Stash Userscripts Bundle.user.js'
    with open(distpath, 'w') as f:
        f.write(f"""// ==UserScript==
// @name        Stash Userscripts Bundle
// @description Stash Userscripts Bundle
// @version     {config.BUNDLE_VERSION}
// @author      7dJx1qP
// @match       {config.SERVER_URL}/*
// @resource    IMPORTED_CSS https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.css
// @grant       unsafeWindow
// @grant       GM_setClipboard
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM.getValue
// @grant       GM.setValue
// @require     https://raw.githubusercontent.com/fengyuanchen/cropperjs/main/dist/cropper.min.js
// @require     https://raw.githubusercontent.com/nodeca/js-yaml/master/dist/js-yaml.js
// @require     {distlibfile}
//
// **************************************************************************************************
// *            YOU MAY REMOVE ANY OF THE @require LINES BELOW FOR SCRIPTS YOU DO NOT WANT          *
// **************************************************************************************************
//\n""")
        for distbodyfile in distbodyfiles:
            f.write(f"// @require     {distbodyfile}\n")
        f.write("\n// ==/UserScript==\n")
        print(distpath)

build()