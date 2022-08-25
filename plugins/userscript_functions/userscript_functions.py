import config_manager
import json
import log
import os
import pathlib
import sys
import subprocess
from studiodownloader import update_studio_from_stashbox
from audit_performer_urls import audit_performer_urls
try:
    from stashlib.stash_database import StashDatabase
    from stashlib.stash_interface import StashInterface
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install pystashlib)", file=sys.stderr)
    sys.exit()

def read_json_input():
    json_input = sys.stdin.read()
    return json.loads(json_input)

json_input = read_json_input()
name = json_input['args']['name']

configpath = os.path.join(pathlib.Path(__file__).parent.resolve(), 'config.ini')

if name == 'explorer':
    path = json_input['args']['path']
    log.debug(f"{name}: {path}\n")
    subprocess.Popen(f'explorer "{path}"')
elif name == 'mediaplayer':
    mediaplayer_path = config_manager.get_config_value(configpath, 'MEDIAPLAYER', 'path')
    path = json_input['args']['path']
    log.debug(f"mediaplayer_path: {mediaplayer_path}\n")
    log.debug(f"{name}: {path}\n")
    subprocess.Popen([mediaplayer_path, path])
elif name == 'update_studio':
    studio_id = json_input['args']['studio_id']
    endpoint = json_input['args']['endpoint']
    remote_site_id = json_input['args']['remote_site_id']
    log.debug(f"{name}: {studio_id} {endpoint} {remote_site_id}\n")
    update_studio_from_stashbox(studio_id, endpoint, remote_site_id)
elif name == 'audit_performer_urls':
    client = StashInterface(json_input["server_connection"])
    result = client.callGraphQL("""query Configuration {
  configuration {
    general {
      databasePath
    }
  }
}""")
    database_path = result["configuration"]["general"]["databasePath"]
    log.debug(f"databasePath: {database_path}\n")
    try:
        db = StashDatabase(database_path)
    except Exception as e:
        log.error(str(e))
        sys.exit(0)
    audit_performer_urls(db)
elif name == 'update_config_value':
    log.debug(f"configpath: {configpath}\n")
    section_key = json_input['args']['section_key']
    prop_name = json_input['args']['prop_name']
    value = json_input['args']['value']
    if not section_key or not prop_name:
        log.error(f"{name}: Missing args\n")
        sys.exit(0)
    log.debug(f"{name}: [{section_key}][{prop_name}] = {value}\n")
    config_manager.update_config_value(configpath, section_key, prop_name, value)
elif name == 'get_config_value':
    log.debug(f"configpath: {configpath}\n")
    section_key = json_input['args']['section_key']
    prop_name = json_input['args']['prop_name']
    if not section_key or not prop_name:
        log.error(f"{name}: Missing args\n")
        sys.exit(0)
    value = config_manager.get_config_value(configpath, section_key, prop_name)
    log.debug(f"{name}: [{section_key}][{prop_name}] = {value}\n")