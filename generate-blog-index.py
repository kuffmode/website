#!/usr/bin/env python3
"""
Scans site/content/posts/*.md and regenerates site/content/blog-posts.json.
Run this whenever you add or rename a post.
"""

import json
import os
import re

POSTS_DIR = os.path.join(os.path.dirname(__file__), "site", "content", "posts")
OUTPUT = os.path.join(os.path.dirname(__file__), "site", "content", "blog-posts.json")

FRONTMATTER = re.compile(r"^---\r?\n(.*?)\r?\n---", re.DOTALL)


def parse_frontmatter(text):
    m = FRONTMATTER.match(text)
    if not m:
        return {}
    meta = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        meta[key.strip()] = val.strip().strip("\"'")
    return meta


posts = []
for fname in sorted(os.listdir(POSTS_DIR)):
    if not fname.endswith(".md"):
        continue
    slug = fname[:-3]
    path = os.path.join(POSTS_DIR, fname)
    with open(path, encoding="utf-8") as f:
        meta = parse_frontmatter(f.read())
    title = meta.get("title", slug)
    # Optional: use a 'date' frontmatter field (YYYY-MM-DD) for ordering.
    date = meta.get("date", "")
    posts.append({"id": slug, "title": title, "_date": date, "_mtime": os.path.getmtime(path)})

# Sort: by 'date' field if present, otherwise by file modification time — newest first.
posts.sort(key=lambda p: p["_date"] if p["_date"] else str(p["_mtime"]), reverse=True)

output = [{"id": p["id"], "title": p["title"]} for p in posts]

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Wrote {len(output)} post(s) to {OUTPUT}")
for p in output:
    print(f"  {p['id']}: {p['title']}")
