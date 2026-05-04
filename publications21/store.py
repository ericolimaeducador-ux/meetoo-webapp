from pathlib import Path
import json
import sqlite3

from .config import DEFAULT_DB, ensure_dirs


SCHEMA = """
create table if not exists articles (
  id integer primary key autoincrement,
  unique_key text not null unique,
  source text not null,
  source_id text not null,
  title text not null,
  year text,
  authors_json text not null,
  abstract text,
  journal text,
  doi text,
  url text,
  published_at text,
  keywords_json text not null,
  matched integer not null default 0,
  score integer not null default 0,
  reasons_json text not null,
  exclusion_reasons_json text not null,
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table if not exists runs (
  id integer primary key autoincrement,
  started_at text not null default current_timestamp,
  finished_at text,
  query text not null,
  source text not null,
  found_count integer not null default 0,
  saved_count integer not null default 0,
  error text
);
"""


class Store:
    def __init__(self, path=DEFAULT_DB):
        ensure_dirs()
        self.path = Path(path)
        self.connection = sqlite3.connect(self.path)
        self.connection.row_factory = sqlite3.Row
        self.connection.executescript(SCHEMA)
        self.connection.commit()

    def close(self):
        self.connection.close()

    def upsert_article(self, article, match):
        payload = {
            "unique_key": article.unique_key,
            "source": article.source,
            "source_id": article.source_id,
            "title": article.title,
            "year": article.year,
            "authors_json": json.dumps(article.authors, ensure_ascii=False),
            "abstract": article.abstract,
            "journal": article.journal,
            "doi": article.doi,
            "url": article.url,
            "published_at": article.published_at,
            "keywords_json": json.dumps(article.keywords, ensure_ascii=False),
            "matched": 1 if match["matched"] else 0,
            "score": match["score"],
            "reasons_json": json.dumps(match["reasons"], ensure_ascii=False),
            "exclusion_reasons_json": json.dumps(match["exclusion_reasons"], ensure_ascii=False),
        }
        self.connection.execute(
            """
            insert into articles (
              unique_key, source, source_id, title, year, authors_json, abstract,
              journal, doi, url, published_at, keywords_json, matched, score,
              reasons_json, exclusion_reasons_json
            ) values (
              :unique_key, :source, :source_id, :title, :year, :authors_json, :abstract,
              :journal, :doi, :url, :published_at, :keywords_json, :matched, :score,
              :reasons_json, :exclusion_reasons_json
            )
            on conflict(unique_key) do update set
              source=excluded.source,
              source_id=excluded.source_id,
              title=excluded.title,
              year=excluded.year,
              authors_json=excluded.authors_json,
              abstract=excluded.abstract,
              journal=excluded.journal,
              doi=excluded.doi,
              url=excluded.url,
              published_at=excluded.published_at,
              keywords_json=excluded.keywords_json,
              matched=excluded.matched,
              score=excluded.score,
              reasons_json=excluded.reasons_json,
              exclusion_reasons_json=excluded.exclusion_reasons_json,
              updated_at=current_timestamp
            """,
            payload,
        )
        self.connection.commit()

    def start_run(self, query, source):
        cursor = self.connection.execute(
            "insert into runs (query, source) values (?, ?)",
            (query, source),
        )
        self.connection.commit()
        return cursor.lastrowid

    def finish_run(self, run_id, found_count, saved_count, error=""):
        self.connection.execute(
            """
            update runs
            set finished_at=current_timestamp, found_count=?, saved_count=?, error=?
            where id=?
            """,
            (found_count, saved_count, error, run_id),
        )
        self.connection.commit()

    def list_articles(self, matched_only=True, limit=100):
        where = "where matched = 1" if matched_only else ""
        cursor = self.connection.execute(
            f"""
            select * from articles
            {where}
            order by score desc, coalesce(year, '') desc, updated_at desc
            limit ?
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]

    def stats(self):
        total = self.connection.execute("select count(*) from articles").fetchone()[0]
        matched = self.connection.execute("select count(*) from articles where matched = 1").fetchone()[0]
        runs = self.connection.execute("select count(*) from runs").fetchone()[0]
        return {"total": total, "matched": matched, "runs": runs, "db": str(self.path)}
