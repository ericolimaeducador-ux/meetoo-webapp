from datetime import datetime
import time

from .config import load_criteria, load_sources
from .matcher import evaluate, local_summary
from .sources import SEARCHERS
from .store import Store


def active_queries(criteria):
    topic = criteria.get("topic", "").strip()
    queries = [query.strip() for query in criteria.get("queries", []) if query.strip()]
    if topic and topic not in queries:
        queries.insert(0, topic)
    return queries


def run_once(criteria_path=None, sources_path=None, limit=None):
    criteria = load_criteria(criteria_path) if criteria_path else load_criteria()
    sources = load_sources(sources_path) if sources_path else load_sources()
    per_source_limit = int(limit or sources.get("per_source_limit", 25))
    store = Store()
    saved = 0
    found = 0

    try:
        for source in sources.get("sources", []):
            name = source.get("name")
            if not source.get("enabled", True):
                continue
            searcher = SEARCHERS.get(name)
            if not searcher:
                continue

            for query in active_queries(criteria):
                run_id = store.start_run(query, name)
                source_found = 0
                source_saved = 0
                error = ""
                try:
                    for article in searcher(query, per_source_limit):
                        if not article.title:
                            continue
                        source_found += 1
                        found += 1
                        match = evaluate(article, criteria)
                        match["local_summary"] = local_summary(article, match)
                        store.upsert_article(article, match)
                        source_saved += 1
                        saved += 1
                except Exception as exc:
                    error = str(exc)
                finally:
                    store.finish_run(run_id, source_found, source_saved, error)
    finally:
        stats = store.stats()
        store.close()

    return {"found": found, "saved": saved, "stats": stats}


def watch(interval_minutes=None, criteria_path=None, sources_path=None, limit=None):
    criteria = load_criteria(criteria_path) if criteria_path else load_criteria()
    interval = int(interval_minutes or criteria.get("poll_interval_minutes", 60))
    print(f"Publications 2.1 monitor iniciado em {datetime.now().isoformat(timespec='seconds')}")
    print(f"Intervalo: {interval} minuto(s). Pressione Ctrl+C para parar.")
    while True:
        result = run_once(criteria_path=criteria_path, sources_path=sources_path, limit=limit)
        print(
            f"{datetime.now().isoformat(timespec='seconds')} "
            f"found={result['found']} saved={result['saved']} matched={result['stats']['matched']}"
        )
        time.sleep(max(1, interval) * 60)
