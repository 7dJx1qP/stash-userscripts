"""Based on https://github.com/scruffynerf/CommunityScrapers/tree/studiodownloader
"""

import sys
import graphql
import log

try:
    import requests
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install requests python-dateutil)", file=sys.stderr)
    sys.exit()

def call_graphql(query, variables=None):
    return graphql.callGraphQL(query, variables)

def get_api_key(endpoint):
    query = """
query getstashbox {
    configuration {
        general {
            stashBoxes {
                name
                endpoint
                api_key
            }
        }
    }
}
"""

    result = call_graphql(query)
    # log.debug(result)
    for x in result["configuration"]["general"]["stashBoxes"]:
        # log.debug(x)
        if x["endpoint"] == endpoint:
            boxapi_key = x["api_key"]
    return boxapi_key

def stashbox_call_graphql(endpoint, query, variables=None):
    boxapi_key = get_api_key(endpoint)
    # this is basically the same code as call_graphql except it calls out to the stashbox.

    headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1",
        "ApiKey": boxapi_key
    }
    json = {
        'query': query
    }
    if variables is not None:
        json['variables'] = variables
    try:
        response = requests.post(endpoint, json=json, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get("error"):
                for error in result["error"]["errors"]:
                    raise Exception("GraphQL error: {}".format(error))
            if result.get("data"):
                return result.get("data")
        elif response.status_code == 401:
            log.error(
                "[ERROR][GraphQL] HTTP Error 401, Unauthorised. You need to add a Stash box instance and API Key in your Stash config")
            return None
        else:
            raise ConnectionError(
                "GraphQL query failed:{} - {}".format(response.status_code, response.content))
    except Exception as err:
        log.error(err)
        return None

def get_id(obj):
    ids = []
    for item in obj:
        ids.append(item['id'])
    return ids

def get_studio_from_stashbox(endpoint, studio_stashid):
    query = """
query getStudio($id : ID!) {
    findStudio(id: $id) {
        name
        id
        images {
            url
        }
        parent {
            name
            id
        }
    }
}
"""

    variables = {
        "id": studio_stashid
    }
    result = stashbox_call_graphql(endpoint, query, variables)
    #log.debug(result["findStudio"])
    if result:
       return result.get("findStudio")
    return

def update_studio(studio, studio_data):
    query = """
mutation studioimageadd($input: StudioUpdateInput!) {
    studioUpdate(input: $input) {
        image_path
        parent_studio {
            id
        }
    }
}
"""

    parent_id = None
    if studio_data["parent"]:
        parent_stash_id = studio_data["parent"]["id"]
        log.debug(f'parent_stash_id: {parent_stash_id}')
        parent_studio = get_studio_by_stash_id(parent_stash_id)
        if parent_studio:
            parent_id = parent_studio["id"]
    log.debug(f'parent_id: {parent_id}')

    variables = {
        "input": {
            "id": studio["id"],
            "image": studio_data["images"][0]["url"],
            "parent_id": parent_id
        }
    }
    call_graphql(query, variables)

def get_studio(studio_id):
    query = """
query FindStudio($id: ID!) {
    findStudio(id: $id) {
        ...StudioData
    }
}

fragment StudioData on Studio {
    id
    name
    updated_at
    created_at
    stash_ids {
        endpoint
        stash_id
    }
}
"""

    variables = { "id": studio_id }
    result = call_graphql(query, variables)
    if result:
        # log.debug(result)
        return result["findStudio"]

def get_studio_by_stash_id(stash_id):
    query = """
query FindStudios($studio_filter: StudioFilterType) {
    findStudios(studio_filter: $studio_filter) {
        count
        studios {
            id
        }
    }
}
"""

    variables = {
        "studio_filter": {
            "stash_id": {
                "value": stash_id,
                "modifier": "EQUALS"
            }
        }
    }
    result = call_graphql(query, variables)
    return result['findStudios']['studios'][0]

def update_studio_from_stashbox(studio_id, endpoint, remote_site_id):
    studio = get_studio(studio_id)
    log.debug(studio)
    if not studio:
        return
    studioboxdata = get_studio_from_stashbox(endpoint, remote_site_id)
    log.debug(studioboxdata)
    if studioboxdata:
        result = update_studio(studio, studioboxdata)