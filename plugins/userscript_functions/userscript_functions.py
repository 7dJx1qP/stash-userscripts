import config
import json
import log
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

if name == 'explorer':
    path = json_input['args']['path']
    log.debug(f"{name}: {path}\n")
    subprocess.Popen(f'explorer "{path}"')
elif name == 'vlc':
    path = json_input['args']['path']
    log.debug(f"{name}: {path}\n")
    subprocess.Popen([config.VLC_PATH, path])
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