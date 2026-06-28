#!/usr/bin/env python3
"""
AIPM Tracker — Article Push Script
Usage: python3 push.py new_article.json
       python3 push.py new_article.json --dry-run   (preview only, no push)
"""

import json, sys, re, base64, urllib.request, urllib.error, os
from datetime import datetime

# ── CONFIG ─────────────────────────────────────────────────────────────────────
# Fill these in once, then never touch this file again.
GITHUB_TOKEN = "YOUR_GITHUB_TOKEN_HERE"   # github.com → Settings → Developer settings → Personal access tokens → Fine-grained → repo contents read+write
GITHUB_REPO  = "YOUR_USERNAME/aipm-tracker"  # e.g. "decori/aipm-tracker"
BRANCH       = "main"
# ──────────────────────────────────────────────────────────────────────────────

DRY_RUN = "--dry-run" in sys.argv

def gh_get(path):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}?ref={BRANCH}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def gh_put(path, content_str, sha, message):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"
    body = json.dumps({
        "message": message,
        "content": base64.b64encode(content_str.encode()).decode(),
        "sha": sha,
        "branch": BRANCH
    }).encode()
    req = urllib.request.Request(url, data=body, method="PUT", headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def fetch_file(path):
    """Fetch file from GitHub, return (decoded_content, sha)"""
    data = gh_get(path)
    decoded = base64.b64decode(data["content"]).decode("utf-8")
    return decoded, data["sha"]

def inject_article(articles_js, article):
    """Append new article object into ARTICLES_DATA array in articles.js"""
    # Find where the array ends: last }  followed by newline];
    insert_pos = articles_js.rfind("\n];")
    if insert_pos == -1:
        raise ValueError("Could not find end of ARTICLES_DATA array in articles.js")

    # Build the JS object string
    tags_js     = json.dumps(article["tags"])
    mcq_js      = ""
    if article.get("mcq"):
        mcq_lines = json.dumps(article["mcq"], ensure_ascii=False)
        mcq_js    = f"\n,mcq:{mcq_lines}"

    # Escape backticks in cc content
    cc_safe = article.get("cc", "").replace("`", "\\`").replace("${", "\\${")

    obj = f"""
,{{readOrder:{article['readOrder']},stage:"{article['stage']}",id:{article['id']},addedOn:"{article['addedOn']}",tags:{tags_js},src:"{article['src']}",p:"{article['p']}",title:"{article['title']}",url:"{article['url']}",iq:"{article['iq']}",kt:"{article['kt']}"
,cc:`{cc_safe}`
,ccDate:"{article['ccDate']}"{mcq_js}
}}"""

    return articles_js[:insert_pos] + obj + articles_js[insert_pos:]

def inject_exdb(exdb_js, entry):
    """Append new case study into EXDB_DATA array in exdb.js"""
    insert_pos = exdb_js.rfind("\n];")
    if insert_pos == -1:
        raise ValueError("Could not find end of EXDB_DATA array in exdb.js")
    obj = "\n," + json.dumps(entry, ensure_ascii=False, indent=2)
    return exdb_js[:insert_pos] + obj + exdb_js[insert_pos:]

def validate(article):
    required = ["id","readOrder","stage","title","url","src","p","tags","addedOn","iq","kt","cc","ccDate"]
    missing = [k for k in required if k not in article]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

def main():
    if len(sys.argv) < 2 or sys.argv[1].startswith("--"):
        print("Usage: python3 push.py new_article.json [--dry-run]")
        sys.exit(1)

    input_file = sys.argv[1]
    print(f"\n📂 Reading {input_file}...")

    with open(input_file, "r", encoding="utf-8") as f:
        payload = json.load(f)

    # Payload can be a single article or {"type":"article",...} or {"type":"exdb",...}
    content_type = payload.get("type", "article")

    if content_type == "article":
        article = payload
        validate(article)
        print(f"✅ Article validated: [{article['id']}] {article['title']}")

        if DRY_RUN:
            print("\n🔍 DRY RUN — showing what would be added:\n")
            print(f"  id:        {article['id']}")
            print(f"  readOrder: {article['readOrder']}")
            print(f"  title:     {article['title']}")
            print(f"  stage:     {article['stage']}")
            print(f"  tags:      {article['tags']}")
            print(f"  cc length: {len(article.get('cc',''))} chars")
            print(f"  mcq:       {len(article.get('mcq',[]))} questions")
            print("\n✅ Dry run complete. Run without --dry-run to push.")
            return

        print("\n📡 Fetching articles.js from GitHub...")
        articles_js, articles_sha = fetch_file("data/articles.js")

        # Check for duplicate id
        if re.search(rf'\bid:{article["id"]},', articles_js):
            print(f"❌ Article id:{article['id']} already exists in articles.js. Aborting.")
            sys.exit(1)

        print("✏️  Injecting new article...")
        updated_articles = inject_article(articles_js, article)

        print("🚀 Pushing to GitHub...")
        gh_put(
            "data/articles.js",
            updated_articles,
            articles_sha,
            f"add article {article['id']}: {article['title']}"
        )
        print(f"✅ Done! Article [{article['id']}] '{article['title']}' is live.")
        print(f"🌐 Your site will update in ~60 seconds.")

    elif content_type == "exdb":
        entry = payload.get("entry", {})
        if not entry.get("slug"):
            raise ValueError("exdb entry must have a 'slug' field")
        print(f"✅ Case study validated: {entry['slug']}")

        if DRY_RUN:
            print(f"\n🔍 DRY RUN — exdb entry: {entry['slug']}")
            return

        print("\n📡 Fetching exdb.js from GitHub...")
        exdb_js, exdb_sha = fetch_file("data/exdb.js")

        if entry["slug"] in exdb_js:
            print(f"❌ Slug '{entry['slug']}' already exists in exdb.js. Aborting.")
            sys.exit(1)

        print("✏️  Injecting case study...")
        updated_exdb = inject_exdb(exdb_js, entry)

        print("🚀 Pushing to GitHub...")
        gh_put(
            "data/exdb.js",
            updated_exdb,
            exdb_sha,
            f"add case study: {entry['slug']}"
        )
        print(f"✅ Done! Case study '{entry['slug']}' is live.")

    else:
        print(f"❌ Unknown type: '{content_type}'. Must be 'article' or 'exdb'.")
        sys.exit(1)

if __name__ == "__main__":
    main()
