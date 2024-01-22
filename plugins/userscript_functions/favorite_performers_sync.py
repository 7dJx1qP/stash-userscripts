import math
import sys
import graphql
import log

try:
    import requests
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install requests)", file=sys.stderr)
    sys.exit()

try:
    from stashlib.stash_database import StashDatabase
    from stashlib.stash_models import PerformersRow
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install pystashlib)", file=sys.stderr)
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
    boxapi_key = None
    for x in result["configuration"]["general"]["stashBoxes"]:
        # log.debug(x)
        if x["endpoint"] == endpoint:
            boxapi_key = x["api_key"]
    if not boxapi_key:
        log.error(f"Stashbox apikey for {endpoint} not found.")
        sys.exit(0)
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

def get_stashbox_performer_favorite(endpoint, stash_id):
    query = """
query FullPerformer($id: ID!) {
  findPerformer(id: $id) {
    id
    is_favorite
  }
}
    """

    variables = {
        "id": stash_id
    }

    return stashbox_call_graphql(endpoint, query, variables)

def update_stashbox_performer_favorite(endpoint, stash_id, favorite):
    query = """
mutation FavoritePerformer($id: ID!, $favorite: Boolean!) {
  favoritePerformer(id: $id, favorite: $favorite)
}
"""

    variables = {
        "id": stash_id,
        "favorite": favorite
    }

    return stashbox_call_graphql(endpoint, query, variables)

def get_favorite_performers_from_stashbox(endpoint):
    query = """
query Performers($input: PerformerQueryInput!) {
  queryPerformers(input: $input) {
    count
    performers {
      id
      is_favorite
    }
  }
}
"""

    per_page = 100

    variables = {
        "input": {
            "names": "",
            "is_favorite": True,
            "page": 1,
            "per_page": per_page,
            "sort": "NAME",
            "direction": "ASC"
        }
    }

    performers = set()

    total_count = None
    request_count = 0
    max_request_count = 1

    performercounts = {}

    while request_count < max_request_count:
        result = stashbox_call_graphql(endpoint, query, variables)
        request_count += 1
        variables["input"]["page"] += 1
        if not result:
            break
        query_performers = result.get("queryPerformers")
        if not query_performers:
            break
        if total_count is None:
            total_count = query_performers.get("count")
            max_request_count = math.ceil(total_count / per_page)

        log.info(f'Received page {variables["input"]["page"] - 1} of {max_request_count}')
        for performer in query_performers.get("performers"):
            performer_id = performer['id']
            if performer_id not in performercounts:
                performercounts[performer_id] = 1
            else:
                performercounts[performer_id] += 1
        performers.update([performer["id"] for performer in query_performers.get("performers")])
    return performers, performercounts

def set_stashbox_favorite_performers(db: StashDatabase, endpoint):
    stash_ids = set([row["stash_id"] for row in db.fetchall("""SELECT DISTINCT b.stash_id
FROM performers a
JOIN performer_stash_ids b
ON a.id = b.performer_id
WHERE a.favorite = 1""")])
    log.info(f'Stashbox endpoint {endpoint}')
    log.info(f'Stash {len(stash_ids)} favorite performers')
    log.info(f'Fetching Stashbox favorite performers...')
    stashbox_stash_ids, performercounts = get_favorite_performers_from_stashbox(endpoint)
    log.info(f'Stashbox {len(stashbox_stash_ids)} favorite performers')

    favorites_to_add = stash_ids - stashbox_stash_ids
    favorites_to_remove = stashbox_stash_ids - stash_ids
    log.info(f'{len(favorites_to_add)} favorites to add')
    log.info(f'{len(favorites_to_remove)} favorites to remove')

    for stash_id in favorites_to_add:
        update_stashbox_performer_favorite(endpoint, stash_id, True)
    log.info('Add done.')

    for stash_id in favorites_to_remove:
        update_stashbox_performer_favorite(endpoint, stash_id, False)
    log.info('Remove done.')

    for performer_id, count in performercounts.items():
        if count > 1:
            log.info(f'Fixing duplicate stashbox favorite {performer_id} count={count}')
            update_stashbox_performer_favorite(endpoint, performer_id, False)
            update_stashbox_performer_favorite(endpoint, performer_id, True)
    log.info('Fixed duplicates.')

def set_stashbox_favorite_performer(endpoint, stash_id, favorite):
    result = get_stashbox_performer_favorite(endpoint, stash_id)
    if not result:
        return
    if favorite != result["findPerformer"]["is_favorite"]:
        update_stashbox_performer_favorite(endpoint, stash_id, favorite)
        log.info(f'Updated Stashbox performer {stash_id} favorite={favorite}')
    else:
        log.info(f'Stashbox performer {stash_id} already in sync favorite={favorite}')