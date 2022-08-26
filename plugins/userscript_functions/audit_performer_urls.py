import log
import os
import pathlib
import re
import sys
from urllib.parse import unquote
try:
    from stashlib.stash_database import StashDatabase
    from stashlib.stash_models import PerformersRow
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): pip install pystashlib)", file=sys.stderr)
    sys.exit()

def to_iafd_fragment(url):
    performer_prefix = 'https://www.iafd.com/person.rme/perfid='
    decoded_url = unquote(url)
    fragment = decoded_url.removeprefix(performer_prefix)
    return '/'.join(fragment.split('/')[:-1])

def audit_performer_urls(db: StashDatabase):
    """Check for valid iafd url format and duplicate urls"""

    regexpath = os.path.join(pathlib.Path(__file__).parent.resolve(), 'performer_url_regexes.txt')
    patterns = [re.compile(s.strip()) for s in open(regexpath, 'r').readlines()]

    rows = db.fetchall("""SELECT * FROM performers WHERE url IS NOT NULL AND url <> ''""")
    performers = [PerformersRow().from_sqliterow(row) for row in rows]
    log.info(f'Checking {str(len(rows))} performers with urls...')
    site_performer_fragments = {}
    for performer in performers:
        if 'iafd.com' in performer.url and not performer.url.startswith('https://www.iafd.com/person.rme/perfid='):
            log.info(f'malformed url {performer.id} {performer.name} {performer.url}')
        site_id = 'OTHER'
        url = performer.url.lower().strip()
        performer_id = url
        for pattern in patterns:
            m = pattern.search(url)
            if m:
                site_id = m.group(1)
                performer_id = m.group(2)
                break
        if site_id not in site_performer_fragments:
            site_performer_fragments[site_id] = {}
        if performer_id not in site_performer_fragments[site_id]:
            site_performer_fragments[site_id][performer_id] = performer
        else:
            log.info(f'Duplicate performer url: {performer.id} {performer.name}, {site_performer_fragments[site_id][performer_id].id} {site_performer_fragments[site_id][performer_id].name}')
    log.info('Done.')