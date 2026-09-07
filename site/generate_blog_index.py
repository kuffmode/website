#!/usr/bin/env python3
"""Generate blog-posts.json from all markdown files in content/posts/."""

import json
import re
from pathlib import Path

def extract_title_from_md(md_path):
    """Extract title from markdown frontmatter or first h1."""
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Try frontmatter first
    fm_match = re.search(r'^---\s*\ntitle:\s*"?([^"\n]+)"?\s*\n', content, re.MULTILINE)
    if fm_match:
        return fm_match.group(1).strip()

    # Fallback to first h1
    h1_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if h1_match:
        return h1_match.group(1).strip()

    return "Untitled"

def extract_date_from_filename(filename):
    """Extract date from filename like 2021-02-02_Title-slug.md."""
    match = re.match(r'^(\d{4}-\d{2}-\d{2})_', filename)
    if match:
        return match.group(1)
    return None

def main():
    posts_dir = Path('content/posts')
    posts = []

    # Find all markdown files
    md_files = sorted(posts_dir.glob('*.md'), reverse=True)  # newest first

    for md_file in md_files:
        # Skip draft files if you want (optional)
        if md_file.stem.startswith('draft_'):
            continue

        post_id = md_file.stem  # filename without extension
        title = extract_title_from_md(md_file)
        date = extract_date_from_filename(md_file.name)

        posts.append({
            'id': post_id,
            'title': title,
            'date': date
        })

    # Write to blog-posts.json
    output_path = Path('content/blog-posts.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)

    print(f'Generated {output_path} with {len(posts)} posts')
    for post in posts:
        print(f"  - {post['date']}: {post['title']}")

if __name__ == '__main__':
    main()
