from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import html
import json
import os
import uuid


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATA_FILE = DATA_DIR / "publications.json"
PORT = int(os.environ.get("PORT", "8010"))


def ensure_data_file():
    DATA_DIR.mkdir(exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]\n", encoding="utf-8")


def load_publications():
    ensure_data_file()
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_publications(publications):
    ensure_data_file()
    DATA_FILE.write_text(
        json.dumps(publications, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def text(value):
    return html.escape(str(value or "").strip())


def normalize(value):
    return str(value or "").strip()


def render_page(publications, query="", message=""):
    filtered = publications
    if query:
        needle = query.casefold()
        filtered = [
            item
            for item in publications
            if needle in " ".join(
                [
                    item.get("title", ""),
                    item.get("author", ""),
                    item.get("channel", ""),
                    item.get("status", ""),
                    item.get("notes", ""),
                ]
            ).casefold()
        ]

    rows = "\n".join(render_publication(item) for item in filtered)
    empty = ""
    if not rows:
        empty = '<p class="empty">Nenhuma publicacao encontrada.</p>'

    return f"""<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Publications</title>
    <style>
      :root {{
        color-scheme: light;
        --bg: #f5f5f2;
        --panel: #ffffff;
        --text: #1d2527;
        --muted: #617072;
        --line: #d9dedb;
        --accent: #0f766e;
        --accent-dark: #115e59;
        --danger: #b42318;
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: var(--bg);
        color: var(--text);
      }}
      header {{
        background: #173534;
        color: white;
        padding: 28px max(20px, calc((100vw - 1120px) / 2));
      }}
      header h1 {{
        margin: 0 0 6px;
        font-size: 32px;
        letter-spacing: 0;
      }}
      header p {{ margin: 0; color: #c7d8d5; }}
      main {{
        width: min(1120px, calc(100vw - 32px));
        margin: 24px auto 48px;
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 20px;
      }}
      section {{
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 18px;
      }}
      h2 {{
        margin: 0 0 14px;
        font-size: 18px;
      }}
      label {{
        display: block;
        margin: 12px 0 6px;
        font-weight: 700;
        font-size: 13px;
      }}
      input, select, textarea {{
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px 11px;
        font: inherit;
        background: white;
      }}
      textarea {{ min-height: 90px; resize: vertical; }}
      button, .button {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 6px;
        padding: 10px 14px;
        background: var(--accent);
        color: white;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
      }}
      button:hover, .button:hover {{ background: var(--accent-dark); }}
      .button-danger {{ background: var(--danger); }}
      .toolbar {{
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        margin-bottom: 14px;
      }}
      .message {{
        margin: 0 0 14px;
        padding: 10px 12px;
        background: #e6f4f1;
        border: 1px solid #b8ded6;
        border-radius: 6px;
        color: #134e4a;
      }}
      .publication {{
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 12px;
      }}
      .publication h3 {{
        margin: 0 0 6px;
        font-size: 18px;
      }}
      .meta {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 10px 0;
      }}
      .pill {{
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 4px 8px;
        color: var(--muted);
        font-size: 12px;
      }}
      .notes {{ color: var(--muted); line-height: 1.45; }}
      .actions {{
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }}
      .empty {{ color: var(--muted); }}
      @media (max-width: 820px) {{
        main {{ grid-template-columns: 1fr; }}
        .toolbar {{ grid-template-columns: 1fr; }}
      }}
    </style>
  </head>
  <body>
    <header>
      <h1>Publications</h1>
      <p>Controle local de ideias, artigos, posts e materiais publicados.</p>
    </header>
    <main>
      <section>
        <h2>Nova publicacao</h2>
        <form method="post" action="/add">
          <label for="title">Titulo</label>
          <input id="title" name="title" required maxlength="160">

          <label for="author">Autor</label>
          <input id="author" name="author" maxlength="120">

          <label for="channel">Canal</label>
          <input id="channel" name="channel" placeholder="Blog, LinkedIn, revista..." maxlength="120">

          <label for="status">Status</label>
          <select id="status" name="status">
            <option>Ideia</option>
            <option>Rascunho</option>
            <option>Em revisao</option>
            <option>Publicado</option>
          </select>

          <label for="date">Data</label>
          <input id="date" name="date" type="date">

          <label for="notes">Notas</label>
          <textarea id="notes" name="notes" maxlength="1000"></textarea>

          <p><button type="submit">Salvar</button></p>
        </form>
      </section>

      <section>
        <h2>Lista</h2>
        {f'<p class="message">{text(message)}</p>' if message else ''}
        <form class="toolbar" method="get" action="/">
          <input name="q" value="{text(query)}" placeholder="Buscar por titulo, autor, canal ou status">
          <button type="submit">Buscar</button>
        </form>
        {empty}
        {rows}
      </section>
    </main>
  </body>
</html>"""


def render_publication(item):
    title = text(item.get("title"))
    author = text(item.get("author") or "Sem autor")
    channel = text(item.get("channel") or "Sem canal")
    status = text(item.get("status") or "Ideia")
    date = text(item.get("date") or "Sem data")
    notes = text(item.get("notes"))
    item_id = text(item.get("id"))

    return f"""<article class="publication">
  <h3>{title}</h3>
  <div class="meta">
    <span class="pill">{author}</span>
    <span class="pill">{channel}</span>
    <span class="pill">{status}</span>
    <span class="pill">{date}</span>
  </div>
  {f'<p class="notes">{notes}</p>' if notes else ''}
  <form class="actions" method="post" action="/delete">
    <input type="hidden" name="id" value="{item_id}">
    <button class="button-danger" type="submit">Excluir</button>
  </form>
</article>"""


class AppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path not in ("/", "/index.html"):
            self.send_error(404)
            return

        params = parse_qs(parsed.query)
        query = params.get("q", [""])[0]
        message = params.get("message", [""])[0]
        self.respond_html(render_page(load_publications(), query=query, message=message))

    def do_POST(self):
        if self.path == "/add":
            self.add_publication()
            return
        if self.path == "/delete":
            self.delete_publication()
            return
        self.send_error(404)

    def add_publication(self):
        data = self.read_form()
        title = normalize(data.get("title", [""])[0])
        if not title:
            self.redirect("/?message=Titulo%20obrigatorio")
            return

        publications = load_publications()
        publications.insert(
            0,
            {
                "id": str(uuid.uuid4()),
                "title": title,
                "author": normalize(data.get("author", [""])[0]),
                "channel": normalize(data.get("channel", [""])[0]),
                "status": normalize(data.get("status", ["Ideia"])[0]) or "Ideia",
                "date": normalize(data.get("date", [""])[0]),
                "notes": normalize(data.get("notes", [""])[0]),
            },
        )
        save_publications(publications)
        self.redirect("/?message=Publicacao%20salva")

    def delete_publication(self):
        data = self.read_form()
        item_id = normalize(data.get("id", [""])[0])
        publications = [item for item in load_publications() if item.get("id") != item_id]
        save_publications(publications)
        self.redirect("/?message=Publicacao%20excluida")

    def read_form(self):
        length = int(self.headers.get("content-length", "0"))
        raw = self.rfile.read(length).decode("utf-8")
        return parse_qs(raw)

    def respond_html(self, body):
        encoded = body.encode("utf-8")
        self.send_response(200)
        self.send_header("content-type", "text/html; charset=utf-8")
        self.send_header("content-length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def redirect(self, location):
        self.send_response(303)
        self.send_header("location", location)
        self.end_headers()

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


def main():
    ensure_data_file()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), AppHandler)
    print(f"Publications running at http://127.0.0.1:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
