from dataclasses import dataclass, field


@dataclass
class Article:
    source: str
    source_id: str
    title: str
    year: str = ""
    authors: list[str] = field(default_factory=list)
    abstract: str = ""
    journal: str = ""
    doi: str = ""
    url: str = ""
    published_at: str = ""
    keywords: list[str] = field(default_factory=list)

    @property
    def unique_key(self):
        if self.doi:
            return f"doi:{self.doi.lower()}"
        return f"{self.source}:{self.source_id}"

    def haystack(self):
        return " ".join(
            [
                self.title,
                self.abstract,
                self.journal,
                " ".join(self.authors),
                " ".join(self.keywords),
            ]
        ).casefold()
