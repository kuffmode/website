#!/usr/bin/env python3
"""
Fetches publications from Google Scholar and updates the Publications section
in site/content/cv.md with Vancouver-style citations.

A JSON cache (site/content/publications.json) is maintained to:
  - avoid re-fetching publications already present in the cache
  - serve as a fallback if Scholar is unreachable (common on CI runners)

Usage:
  python update-publications.py              # fetch from Scholar + update cv.md
  python update-publications.py --from-cache # rebuild cv.md from cache only
"""

import json
import os
import re
import sys
import time

# ── configuration ──────────────────────────────────────────────────────────────

SCHOLAR_USER_ID = "652pLAUAAAAJ"
AUTHOR_SURNAME  = "Fakhar"
REQUEST_DELAY   = 2.0   # seconds between individual Scholar fill requests

BASE       = os.path.dirname(__file__)
CV_PATH    = os.path.join(BASE, "site", "content", "cv.md")
CACHE_PATH = os.path.join(BASE, "site", "content", "publications.json")

SCHOLAR_CITATION_URL = (
    "https://scholar.google.com/citations"
    "?view_op=view_citation&user={user}&citation_for_view={pub_id}"
)

# ── name parsing ───────────────────────────────────────────────────────────────

def _make_initials(parts: list) -> str:
    """
    Collapse a list of name tokens into initials.
    Handles already-packed tokens like "CC" or "KP" and single-letter tokens.
    """
    result = ""
    for p in parts:
        p = p.strip(".")
        if not p or not p[0].isalpha():
            continue
        # Already packed uppercase initials, e.g. "CC", "KP"
        if p.isalpha() and p.isupper() and len(p) <= 4:
            result += p
        else:
            result += p[0].upper()
    return result


def _parse_name(name: str):
    """Return (surname, initials) for any common author-name format."""
    name = name.strip()
    if not name:
        return "", ""

    # "Surname, First [Middle]" → split on first comma
    if "," in name:
        surname, rest = name.split(",", 1)
        initials = _make_initials(rest.strip().split())
        return surname.strip(), initials

    parts = name.split()
    if len(parts) == 1:
        return parts[0], ""

    # Detect "Surname Initials" format, e.g. "Hilgetag CC", "Fakhar K"
    last = parts[-1].rstrip(".")
    if last.isalpha() and last.isupper() and len(last) <= 4:
        return parts[0], last

    # "First [Middle…] Surname" format
    surname  = parts[-1]
    initials = _make_initials(parts[:-1])
    return surname, initials


def format_author(name: str) -> str:
    """Convert any raw author name to Vancouver 'Surname Initials' format."""
    surname, initials = _parse_name(name)
    return f"{surname} {initials}".strip()


def maybe_bold(formatted: str) -> str:
    """Bold the entry if it contains the target author's surname."""
    if re.search(rf"\b{re.escape(AUTHOR_SURNAME)}\b", formatted, re.IGNORECASE):
        return f"**{formatted}**"
    return formatted


# ── citation builder ───────────────────────────────────────────────────────────

def make_citation(pub: dict, index: int) -> str:
    """Build a numbered Vancouver-style Markdown citation from a cached record."""
    bib = pub.get("bib", {})

    # Authors — scholarly uses " and " as separator between names
    raw_authors = bib.get("author", "")
    if raw_authors:
        author_parts = re.split(r"\s+and\s+", raw_authors)
        authors_str = ", ".join(
            maybe_bold(format_author(a)) for a in author_parts
        )
    else:
        authors_str = ""

    title      = bib.get("title", "").strip()
    venue      = (bib.get("venue") or bib.get("journal") or
                  bib.get("booktitle") or "").strip()
    year       = str(bib.get("pub_year") or "").strip()
    volume     = str(bib.get("volume")   or "").strip()
    number     = str(bib.get("number")   or "").strip()
    pages      = str(bib.get("pages")    or "").strip()

    scholar_url = pub.get("scholar_url", "")
    title_md    = f"[{title}]({scholar_url})" if scholar_url else title

    # Assemble: "N. Authors. Title. *Venue*. Year;vol(issue):pages."
    parts = []
    if authors_str:
        parts.append(authors_str + ".")
    if title_md:
        parts.append(title_md + ".")
    if venue:
        parts.append(f"*{venue}*.")

    year_part = year
    if volume:
        year_part += f";{volume}"
        if number:
            year_part += f"({number})"
        if pages:
            year_part += f":{pages}"
    if year_part:
        parts.append(year_part + ".")

    return f"{index}. " + " ".join(parts)


# ── Scholar fetch ──────────────────────────────────────────────────────────────

def _pub_to_record(pub: dict) -> dict:
    """Convert a scholarly publication object to our cache record schema."""
    bib = pub.get("bib", {})
    author_pub_id = pub.get("author_pub_id", "")
    scholar_url = (
        SCHOLAR_CITATION_URL.format(
            user=SCHOLAR_USER_ID, pub_id=author_pub_id
        )
        if author_pub_id
        else ""
    )
    return {
        "bib": {
            "title":     bib.get("title", ""),
            "author":    bib.get("author", ""),
            "pub_year":  bib.get("pub_year", ""),
            "venue":     bib.get("venue", ""),
            "journal":   bib.get("journal", ""),
            "booktitle": bib.get("booktitle", ""),
            "volume":    bib.get("volume", ""),
            "number":    bib.get("number", ""),
            "pages":     bib.get("pages", ""),
        },
        "scholar_url":   scholar_url,
        "num_citations": pub.get("num_citations", 0),
    }


def fetch_from_scholar(cache_by_title: dict) -> list:
    try:
        from scholarly import scholarly as _s
    except ImportError:
        raise ImportError(
            "scholarly not installed. Run:  pip install scholarly"
        )

    print(f"Querying Google Scholar (user {SCHOLAR_USER_ID})…")
    author = _s.search_author_id(SCHOLAR_USER_ID)
    author = _s.fill(author, sections=["publications"])
    pubs   = author.get("publications", [])
    print(f"  Found {len(pubs)} publications on profile.")

    results = []
    for pub in pubs:
        title     = pub.get("bib", {}).get("title", "")
        cache_key = title.lower().strip()

        if cache_key and cache_key in cache_by_title:
            cached = cache_by_title[cache_key]
            if cached.get("scholar_url"):
                print(f"  [cached] {title}")
                results.append(cached)
                continue
            # Cache hit but no URL yet — fall through to fill the record
            print(f"  [fill]   {title}")

        print(f"  [fetch]  {title}")
        try:
            time.sleep(REQUEST_DELAY)
            pub = _s.fill(pub)
        except Exception as exc:
            print(f"    Warning: could not fill '{title}': {exc}")

        results.append(_pub_to_record(pub))

    # Sort by year descending, then citation count descending
    results.sort(
        key=lambda p: (
            int(p["bib"].get("pub_year") or 0),
            p.get("num_citations", 0),
        ),
        reverse=True,
    )
    return results


# ── cache I/O ──────────────────────────────────────────────────────────────────

def load_cache():
    """Return (list_of_records, dict_keyed_by_lowercase_title)."""
    if not os.path.exists(CACHE_PATH):
        return [], {}
    with open(CACHE_PATH, encoding="utf-8") as f:
        data = json.load(f)
    by_title = {
        p["bib"].get("title", "").lower().strip(): p
        for p in data
    }
    return data, by_title


def save_cache(pubs: list):
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(pubs, f, indent=2, ensure_ascii=False)
        f.write("\n")


# ── cv.md update ───────────────────────────────────────────────────────────────

def update_cv(citations: list):
    with open(CV_PATH, encoding="utf-8") as f:
        content = f.read()

    body = "\n".join(citations)

    # Match "## Publications", preserve any subtitle lines (non-heading, non-blank
    # lines immediately after it), then replace everything up to the next ## or EOF.
    pattern = re.compile(
        r"(## Publications[ \t]*\n(?:(?!## |\n)\S[^\n]*\n)*)",
        re.DOTALL,
    )
    m = pattern.search(content)
    if not m:
        raise ValueError("Could not find '## Publications' heading in cv.md")

    header = m.group(1)  # heading + subtitle line(s)
    # Replace from end of header to next ## heading or EOF
    body_pattern = re.compile(
        r"(?<=" + re.escape(header) + r").*?(?=\n## |\Z)", re.DOTALL
    )
    new_content = body_pattern.sub("\n" + body + "\n", content, count=1)

    with open(CV_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)


# ── main ───────────────────────────────────────────────────────────────────────

def main():
    cache_list, cache_by_title = load_cache()
    use_cache_only = "--from-cache" in sys.argv

    if use_cache_only:
        print(f"--from-cache: using {len(cache_list)} cached publications.")
        pubs = cache_list
        if not pubs:
            print("Cache is empty. Run without --from-cache first.")
            sys.exit(1)
    else:
        try:
            pubs = fetch_from_scholar(cache_by_title)
            save_cache(pubs)
            print(f"  Cache written → {CACHE_PATH}")
        except Exception as exc:
            print(f"Scholar fetch failed: {exc}")
            if cache_list:
                print(f"  Falling back to {len(cache_list)} cached publications.")
                pubs = cache_list
            else:
                print("  No cache available. Exiting.")
                sys.exit(1)

    if not pubs:
        print("No publications found — cv.md not modified.")
        return

    citations = [make_citation(p, i + 1) for i, p in enumerate(pubs)]
    update_cv(citations)
    print(f"Updated Publications section in cv.md ({len(citations)} entries).")


if __name__ == "__main__":
    main()
