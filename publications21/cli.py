from argparse import ArgumentParser

from .config import DEFAULT_CRITERIA, DEFAULT_SOURCES, ensure_dirs, save_json
from .reports import export_markdown, write_ai_prompt
from .runner import run_once, watch
from .store import Store


DEFAULT_CRITERIA_PAYLOAD = {
    "topic": "inteligencia artificial na educação",
    "queries": [
        "artificial intelligence education",
        "AI learning assessment",
        "generative AI higher education"
    ],
    "include_any": ["artificial intelligence", "AI", "machine learning", "generative AI"],
    "include_all": ["education"],
    "exclude_any": ["editorial", "letter to editor", "correction"],
    "min_year": 2020,
    "poll_interval_minutes": 60
}


DEFAULT_SOURCES_PAYLOAD = {
    "per_source_limit": 25,
    "sources": [
        {"name": "openalex", "enabled": True, "api_key": ""},
        {"name": "crossref", "enabled": True, "api_key": ""},
        {"name": "europe_pmc", "enabled": True, "api_key": ""},
        {"name": "arxiv", "enabled": True, "api_key": ""}
    ]
}


def init_config(force=False):
    ensure_dirs()
    if force or not DEFAULT_CRITERIA.exists():
        save_json(DEFAULT_CRITERIA, DEFAULT_CRITERIA_PAYLOAD)
    if force or not DEFAULT_SOURCES.exists():
        save_json(DEFAULT_SOURCES, DEFAULT_SOURCES_PAYLOAD)
    return DEFAULT_CRITERIA, DEFAULT_SOURCES


def main():
    parser = ArgumentParser(prog="publications21")
    sub = parser.add_subparsers(dest="command", required=True)

    init_parser = sub.add_parser("init", help="cria arquivos de configuracao")
    init_parser.add_argument("--force", action="store_true")

    run_parser = sub.add_parser("run-once", help="executa uma rodada de busca")
    run_parser.add_argument("--limit", type=int)

    watch_parser = sub.add_parser("watch", help="busca continuamente em segundo plano")
    watch_parser.add_argument("--interval", type=int, help="intervalo em minutos")
    watch_parser.add_argument("--limit", type=int)

    sub.add_parser("stats", help="mostra estatisticas locais")

    report_parser = sub.add_parser("report", help="exporta lista em markdown")
    report_parser.add_argument("--limit", type=int, default=100)
    report_parser.add_argument("--all", action="store_true", help="inclui artigos excluidos")

    ai_parser = sub.add_parser("ai-prompt", help="gera prompt para texto com IA")
    ai_parser.add_argument("--limit", type=int, default=50)

    args = parser.parse_args()

    if args.command == "init":
        criteria, sources = init_config(force=args.force)
        print(f"Configuracao criada: {criteria}")
        print(f"Fontes criadas: {sources}")
        return

    init_config(force=False)

    if args.command == "run-once":
        print(run_once(limit=args.limit))
    elif args.command == "watch":
        watch(interval_minutes=args.interval, limit=args.limit)
    elif args.command == "stats":
        store = Store()
        try:
            print(store.stats())
        finally:
            store.close()
    elif args.command == "report":
        path = export_markdown(limit=args.limit, matched_only=not args.all)
        print(f"Relatorio criado: {path}")
    elif args.command == "ai-prompt":
        path = write_ai_prompt(limit=args.limit)
        print(f"Prompt criado: {path}")


if __name__ == "__main__":
    main()
