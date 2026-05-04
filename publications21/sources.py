from .http import get_json
from .models import Article
import html
import re


def compact_text(value):
    if isinstance(value, list):
        value = " ".join(str(item) for item in value)
    value = re.sub(r"<[^>]+>", " ", str(value or ""))
    return " ".join(html.unescape(value).split())


def author_names_crossref(authors):
    names = []
    for author in authors or []:
        full = " ".join(part for part in [author.get("given"), author.get("family")] if part)
        if full:
            names.append(full)
    return names


def search_openalex(query, limit):
    data = get_json(
        "https://api.openalex.org/works",
        {
            "search": query,
            "per-page": min(limit, 200),
            "sort": "publication_date:desc",
        },
    )
    for item in data.get("results", []):
        authors = [
            entry.get("author", {}).get("display_name", "")
            for entry in item.get("authorships", [])
            if entry.get("author", {}).get("display_name")
        ]
        abstract = inverted_abstract(item.get("abstract_inverted_index") or {})
        yield Article(
            source="openalex",
            source_id=str(item.get("id") or ""),
            title=compact_text(item.get("title")),
            year=str(item.get("publication_year") or ""),
            authors=authors,
            abstract=abstract,
            journal=compact_text((item.get("primary_location") or {}).get("source", {}).get("display_name")),
            doi=str(item.get("doi") or "").replace("https://doi.org/", ""),
            url=str((item.get("primary_location") or {}).get("landing_page_url") or item.get("id") or ""),
            published_at=str(item.get("publication_date") or ""),
            keywords=[kw.get("display_name", "") for kw in item.get("keywords", []) if kw.get("display_name")],
        )


def inverted_abstract(index):
    if not index:
        return ""
    pairs = []
    for word, positions in index.items():
        for position in positions:
            pairs.append((position, word))
    return " ".join(word for _, word in sorted(pairs))


def search_crossref(query, limit):
    data = get_json(
        "https://api.crossref.org/works",
        {
            "query": query,
            "rows": min(limit, 100),
            "sort": "published",
            "order": "desc",
        },
    )
    for item in data.get("message", {}).get("items", []):
        published = item.get("published-print") or item.get("published-online") or item.get("created") or {}
        date_parts = published.get("date-parts") or [[]]
        year = str(date_parts[0][0]) if date_parts and date_parts[0] else ""
        doi = str(item.get("DOI") or "")
        yield Article(
            source="crossref",
            source_id=doi or str(item.get("URL") or ""),
            title=compact_text(item.get("title")),
            year=year,
            authors=author_names_crossref(item.get("author")),
            abstract=compact_text(item.get("abstract")),
            journal=compact_text(item.get("container-title")),
            doi=doi,
            url=str(item.get("URL") or ""),
            published_at="-".join(str(part) for part in (date_parts[0] if date_parts else [])),
            keywords=item.get("subject") or [],
        )


def search_europe_pmc(query, limit):
    data = get_json(
        "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
        {
            "query": query,
            "format": "json",
            "pageSize": min(limit, 100),
            "sort": "FIRST_PDATE_D desc",
        },
    )
    for item in data.get("resultList", {}).get("result", []):
        yield Article(
            source="europe_pmc",
            source_id=str(item.get("id") or item.get("doi") or ""),
            title=compact_text(item.get("title")),
            year=str(item.get("pubYear") or ""),
            authors=[name.strip() for name in str(item.get("authorString") or "").split(",") if name.strip()],
            abstract=compact_text(item.get("abstractText")),
            journal=compact_text(item.get("journalTitle")),
            doi=str(item.get("doi") or ""),
            url=str(item.get("fullTextUrlList", {}).get("fullTextUrl", [{}])[0].get("url") or item.get("doi") or ""),
            published_at=str(item.get("firstPublicationDate") or ""),
            keywords=[],
        )


def search_arxiv(query, limit):
    # ArXiv returns Atom XML; ElementTree keeps this source dependency-free.
    from urllib.parse import urlencode
    from urllib.request import Request, urlopen
    from xml.etree import ElementTree

    params = urlencode({
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": min(limit, 100),
        "sortBy": "submittedDate",
        "sortOrder": "descending",
    })
    request = Request(
        f"https://export.arxiv.org/api/query?{params}",
        headers={"User-Agent": "Publications/2.1 local research assistant"},
    )
    with urlopen(request, timeout=30) as response:
        root = ElementTree.fromstring(response.read())
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for entry in root.findall("a:entry", ns):
        source_id = compact_text(entry.findtext("a:id", default="", namespaces=ns))
        published = compact_text(entry.findtext("a:published", default="", namespaces=ns))
        yield Article(
            source="arxiv",
            source_id=source_id,
            title=compact_text(entry.findtext("a:title", default="", namespaces=ns)),
            year=published[:4],
            authors=[
                compact_text(author.findtext("a:name", default="", namespaces=ns))
                for author in entry.findall("a:author", ns)
            ],
            abstract=compact_text(entry.findtext("a:summary", default="", namespaces=ns)),
            journal="arXiv",
            doi="",
            url=source_id,
            published_at=published,
            keywords=[
                category.attrib.get("term", "")
                for category in entry.findall("a:category", ns)
                if category.attrib.get("term")
            ],
        )


SEARCHERS = {
    "openalex": search_openalex,
    "crossref": search_crossref,
    "europe_pmc": search_europe_pmc,
    "arxiv": search_arxiv,
}
