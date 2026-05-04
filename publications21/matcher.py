from datetime import datetime
import re


def normalize_terms(values):
    return [str(value).casefold().strip() for value in values or [] if str(value).strip()]


def contains_term(haystack, term):
    if not term:
        return False
    if len(term) <= 3 and term.replace("-", "").isalpha():
        return re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", haystack) is not None
    return term in haystack


def evaluate(article, criteria):
    haystack = article.haystack()
    include_any = normalize_terms(criteria.get("include_any"))
    include_all = normalize_terms(criteria.get("include_all"))
    exclude_any = normalize_terms(criteria.get("exclude_any"))
    min_year = criteria.get("min_year")

    reasons = []
    exclusion_reasons = []
    score = 0

    if include_all:
        missing = [term for term in include_all if not contains_term(haystack, term)]
        if missing:
            exclusion_reasons.append("Termos obrigatorios ausentes: " + ", ".join(missing))
        else:
            score += 30
            reasons.append("Contem todos os termos obrigatorios.")

    hits = [term for term in include_any if contains_term(haystack, term)]
    if include_any and not hits:
        exclusion_reasons.append("Nao contem termos de inclusao.")
    if hits:
        score += 10 * len(hits)
        reasons.append("Termos de inclusao encontrados: " + ", ".join(hits[:8]))

    blocked = [term for term in exclude_any if contains_term(haystack, term)]
    if blocked:
        exclusion_reasons.append("Termos de exclusao encontrados: " + ", ".join(blocked[:8]))

    year = str(article.year or "")
    if min_year and year.isdigit() and int(year) < int(min_year):
        exclusion_reasons.append(f"Ano anterior ao minimo configurado ({min_year}).")
    if year.isdigit() and int(year) > datetime.now().year + 1:
        exclusion_reasons.append("Ano de publicacao parece invalido.")

    if article.abstract:
        score += 10
        reasons.append("Resumo disponivel para leitura automatizada.")
    if article.doi:
        score += 5
        reasons.append("Possui DOI.")

    matched = not exclusion_reasons and (not include_any or bool(hits))
    if not reasons and matched:
        reasons.append("Registro compativel com os filtros configurados.")

    return {
        "matched": matched,
        "score": score,
        "reasons": reasons,
        "exclusion_reasons": exclusion_reasons,
    }


def local_summary(article, match):
    abstract = " ".join((article.abstract or "").split())
    if len(abstract) > 700:
        abstract = abstract[:697].rsplit(" ", 1)[0] + "..."

    reason = " ".join(match.get("reasons") or ["A publicacao passou pelos criterios configurados."])
    if abstract:
        return f"{reason} Leitura preliminar: {abstract}"
    return f"{reason} A fonte nao retornou resumo; revise titulo, autores e link antes de incluir no texto final."
