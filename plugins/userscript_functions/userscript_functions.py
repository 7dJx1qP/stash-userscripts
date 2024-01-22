import config_manager
import json
import log
import os
import pathlib
import sys
import subprocess
from favorite_performers_sync import set_stashbox_favorite_performers, set_stashbox_favorite_performer
from studiodownloader import update_studio_from_stashbox
from audit_performer_urls import audit_performer_urls
try:
    from stashlib.stash_database import StashDatabase
    from stashlib.stash_interface import StashInterface
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install pystashlib)", file=sys.stderr)
    sys.exit()

json_input = json.loads(sys.stdin.read())
name = json_input['args']['name']

configpath = os.path.join(pathlib.Path(__file__).parent.resolve(), 'config.ini')

def get_database_config():
    client = StashInterface(json_input["server_connection"])
    result = client.callGraphQL("""query Configuration { configuration { general { databasePath, blobsPath, blobsStorage } } }""")
    database_path = result["configuration"]["general"]["databasePath"]
    blobs_path = result["configuration"]["general"]["blobsPath"]
    blobs_storage = result["configuration"]["general"]["blobsStorage"]
    log.debug(f"databasePath: {database_path}")
    return database_path, blobs_path, blobs_storage

if name == 'explorer':
    path = json_input['args']['path']
    log.debug(f"{name}: {path}")
    subprocess.Popen(f'explorer "{path}"')
elif name == 'mediaplayer':
    mediaplayer_path = config_manager.get_config_value(configpath, 'MEDIAPLAYER', 'path')
    path = json_input['args']['path']
    log.debug(f"mediaplayer_path: {mediaplayer_path}")
    log.debug(f"{name}: {path}")
    subprocess.Popen([mediaplayer_path, path])
elif name == 'update_studio':
    studio_id = json_input['args']['studio_id']
    endpoint = json_input['args']['endpoint']
    remote_site_id = json_input['args']['remote_site_id']
    log.debug(f"{name}: {studio_id} {endpoint} {remote_site_id}")
    update_studio_from_stashbox(studio_id, endpoint, remote_site_id)
    log.debug(f"{name}: Done.")
elif name == 'audit_performer_urls':
    try:
        db = StashDatabase(*get_database_config())
    except Exception as e:
        log.error(str(e))
        sys.exit(0)
    audit_performer_urls(db)
    db.close()
elif name == 'update_config_value':
    log.debug(f"configpath: {configpath}")
    section_key = json_input['args']['section_key']
    prop_name = json_input['args']['prop_name']
    value = json_input['args']['value']
    if not section_key or not prop_name:
        log.error(f"{name}: Missing args")
        sys.exit(0)
    log.debug(f"{name}: [{section_key}][{prop_name}] = {value}")
    config_manager.update_config_value(configpath, section_key, prop_name, value)
elif name == 'get_config_value':
    log.debug(f"configpath: {configpath}")
    section_key = json_input['args']['section_key']
    prop_name = json_input['args']['prop_name']
    if not section_key or not prop_name:
        log.error(f"{name}: Missing args")
        sys.exit(0)
    value = config_manager.get_config_value(configpath, section_key, prop_name)
    log.debug(f"{name}: [{section_key}][{prop_name}] = {value}")
elif name == 'favorite_performers_sync':
    endpoint = json_input['args']['endpoint']
    try:
        db = StashDatabase(*get_database_config())
    except Exception as e:
        log.error(str(e))
        sys.exit(0)
    set_stashbox_favorite_performers(db, endpoint)
    db.close()
elif name == 'favorite_performer_sync':
    endpoint = json_input['args']['endpoint']
    stash_id = json_input['args']['stash_id']
    favorite = json_input['args']['favorite']
    log.debug(f"Favorite performer sync: endpoint={endpoint}, stash_id={stash_id}, favorite={favorite}")
    set_stashbox_favorite_performer(endpoint, stash_id, favorite)