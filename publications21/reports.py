from datetime import datetime
from pathlib import Path
import json

from .config import REPORTS_DIR, ensure_dirs
from .store import Store


def article_to_markdown(row):
    authors = ", ".join(json.loads(row["authors_json"] or "[]")[:8])
    reasons = json.loads(row["reasons_json"] or "[]")
    exclusions = json.loads(row["exclusion_reasons_json"] or "[]")
    parts = [
        f"### {row['title']}",
        "",
        f"- Fonte: {row['source']}",
        f"- Ano: {row['year'] or 'n/d'}",
        f"- Autores: {authors or 'n/d'}",
        f"- Periodico/repositório: {row['journal'] or 'n/d'}",
        f"- DOI: {row['doi'] or 'n/d'}",
        f"- Link: {row['url'] or 'n/d'}",
        f"- Pontuacao: {row['score']}",
        "",
        "**Por que encaixa:**",
        " ".join(reasons) if reasons else "Sem justificativa registrada.",
    ]
    if exclusions:
        parts.extend(["", "**Alertas de exclusao:**", " ".join(exclusions)])
    if row["abstract"]:
        parts.extend(["", "**Resumo da fonte:**", row["abstract"]])
    return "\n".join(parts)


def export_markdown(limit=100, matched_only=True):
    ensure_dirs()
    store = Store()
    try:
        rows = store.list_articles(matched_only=matched_only, limit=limit)
    finally:
        store.close()

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = REPORTS_DIR / f"publications-{stamp}.md"
    body = [
        "# Publications 2.1 - Lista de publicacoes",
        "",
        f"Gerado em {datetime.now().isoformat(timespec='seconds')}",
        f"Total no relatorio: {len(rows)}",
        "",
    ]
    for row in rows:
        body.append(article_to_markdown(row))
        body.append("\n---\n")
    path.write_text("\n".join(body), encoding="utf-8")
    return path


def build_ai_prompt(limit=50):
    store = Store()
    try:
        rows = store.list_articles(matched_only=True, limit=limit)
    finally:
        store.close()

    articles = []
    for row in rows:
        articles.append(
            {
                "title": row["title"],
                "year": row["year"],
                "authors": json.loads(row["authors_json"] or "[]"),
                "journal": row["journal"],
                "doi": row["doi"],
                "url": row["url"],
                "score": row["score"],
                "reasons": json.loads(row["reasons_json"] or "[]"),
                "abstract": row["abstract"],
            }
        )

    return (
        "Escreva um texto academico em portugues com base nos artigos abaixo. "
        "Organize por eixos tematicos, destaque convergencias, divergencias, lacunas "
        "e cite os artigos pelo primeiro autor e ano quando possivel. Nao invente dados.\n\n"
        + json.dumps(articles, ensure_ascii=False, indent=2)
    )


def write_ai_prompt(limit=50):
    ensure_dirs()
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = REPORTS_DIR / f"ai-prompt-{stamp}.txt"
    path.write_text(build_ai_prompt(limit=limit), encoding="utf-8")
    return path
