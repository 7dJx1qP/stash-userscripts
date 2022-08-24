import log
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

    rows = db.fetchall("""SELECT * FROM performers WHERE url IS NOT NULL AND url <> ''""")
    performers = [PerformersRow().from_sqliterow(row) for row in rows]
    log.info(f'Checking {str(len(rows))} performers with urls...')
    performer_fragments = {}
    for performer in performers:
        if 'iafd.com' in performer.url:
            if not performer.url.startswith('https://www.iafd.com/person.rme/perfid='):
                log.info(f'malformed url {performer.id} {performer.name} {performer.url}')
            else:
                fragment = to_iafd_fragment(performer.url)
                if fragment not in performer_fragments:
                    performer_fragments[fragment] = performer
                else:
                    log.info(f'dupe performer {performer.id} {performer.name} {performer_fragments[fragment].id} {performer_fragments[fragment].name}')
        else:
            fragment = performer.url
            if fragment not in performer_fragments:
                performer_fragments[fragment] = performer
            else:
                log.info(f'dupe performer {performer.id} {performer.name} {performer_fragments[fragment].id} {performer_fragments[fragment].name}')
    log.info('Done.')