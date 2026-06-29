#!/usr/bin/env python3
"""
Merges inbox/new_article.json into data/articles.js
Run by GitHub Actions automatically when new_article.json is pushed to inbox/
"""

import json, re, sys
from datetime import datetime

def inject_article(articles_js, article):
    insert_pos = articles_js.rfind("\n];")
    if insert_pos == -1:
        raise ValueError("Could not find end of ARTICLES_DATA array")

    tags_js = json.dumps(article["tags"])
    cc_safe = article.get("cc", "").replace("`", "\\`").replace("${", "\\${")
    mcq_data = article.get("mcq", [])
    mcq_js = json.dumps(mcq_data, ensure_ascii=False) if mcq_data else "[]"

    obj = f"""
,{{readOrder:{article['readOrder']},stage:"{article['stage']}",id:{article['id']},addedOn:"{article['addedOn']}",tags:{tags_js},src:"{article['src']}",p:"{article['p']}",title:"{article['title']}",url:"{article['url']}",iq:"{article['iq']}",kt:"{article['kt']}"
,cc:`{cc_safe}`
,ccDate:"{article['ccDate']}"
,mcq:{mcq_js}
}}"""

    return articles_js[:insert_pos] + obj + articles_js[insert_pos:]

def validate(article):
    required = ["id", "readOrder", "stage", "title", "url", "src", "p",
                "tags", "addedOn", "iq", "kt", "cc", "ccDate"]
    missing = [k for k in required if k not in article]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

def main():
    print("Reading inbox/new_article.json...")
    with open("inbox/new_article.json", "r", encoding="utf-8") as f:
        article = json.load(f)

    # Strip type field if present
    article.pop("type", None)

    validate(article)
    print(f"Validated: [{article['id']}] {article['title']}")

    print("Reading data/articles.js...")
    with open("data/articles.js", "r", encoding="utf-8") as f:
        articles_js = f.read()

    # Check for duplicate id
    if re.search(rf'\bid:{article["id"]},', articles_js):
        print(f"ERROR: Article id:{article['id']} already exists. Aborting.")
        sys.exit(1)

    print("Injecting article...")
    updated = inject_article(articles_js, article)

    print("Writing data/articles.js...")
    with open("data/articles.js", "w", encoding="utf-8") as f:
        f.write(updated)

    print(f"Done. Article [{article['id']}] '{article['title']}' added.")

if __name__ == "__main__":
    main()
