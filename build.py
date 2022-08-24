import os
import config

def build():
    LIBFILE = "StashUserscriptLibrary.js"

    localbodyfiles = []
    distbodyfiles = []
    distlibfile = os.path.join(config.GITHUB_ROOT_URL, 'src', LIBFILE)
    for file in os.listdir('src/header'):
        headerpath = os.path.join('src/header', file)
        bodypath = os.path.join('src/body', file)
        distpublicpath = os.path.join('dist/public', file)
        header = open(headerpath, 'r').read()
        body = open(bodypath, 'r').read()

        localbodyfiles.append("file://" + os.path.join(config.ROOTDIR, 'src/body', file))
        distbodyfiles.append(os.path.join(config.GITHUB_ROOT_URL, 'src/body', file))
        
        distscript = header.replace("%LIBRARYPATH%", distlibfile).replace("// @require     %FILEPATH%\n// ==/UserScript==", '\n' + body)
        with open(distpublicpath, 'w') as f:
            f.write(distscript)
            print(distpublicpath)

    localpath = 'dist/local/Stash Userscripts Development Bundle.user.js'
    locallibfile = "file://" + os.path.join(config.ROOTDIR, 'src', LIBFILE)
    with open(localpath, 'w') as f:
        f.write(f"""// ==UserScript==
// @name        Stash Userscripts Development Bundle
// @description Stash Userscripts Development Bundle
// @version     {config.BUNDLE_VERSION}
// @author      7dJx1qP
// @match       *localhost:9999/*
// @grant       none
// @require     {locallibfile}\n""")
        for localbodyfile in localbodyfiles:
            f.write(f"// @require     {localbodyfile}\n")
        f.write("// ==/UserScript==\n")
        print(localpath)

    distpath = 'dist/public/Stash Userscripts Bundle.user.js'
    with open(distpath, 'w') as f:
        f.write(f"""// ==UserScript==
// @name        Stash Userscripts Bundle
// @description Stash Userscripts Bundle
// @version     {config.BUNDLE_VERSION}
// @author      7dJx1qP
// @match       *localhost:9999/*
// @grant       none
// @require     {distlibfile}\n""")
        for distbodyfile in distbodyfiles:
            f.write(f"// @require     {distbodyfile}\n")
        f.write("// ==/UserScript==\n")
        print(distpath)

build()