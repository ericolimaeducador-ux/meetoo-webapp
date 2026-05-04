from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json
import time


USER_AGENT = "Publications/2.1 local research assistant"


def get_json(url, params=None, timeout=30, retries=2):
    query = urlencode(params or {}, doseq=True)
    full_url = f"{url}?{query}" if query else url
    last_error = None

    for attempt in range(retries + 1):
        try:
            request = Request(full_url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=timeout) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return json.loads(response.read().decode(charset))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))

    raise RuntimeError(f"Request failed: {full_url} ({last_error})")
