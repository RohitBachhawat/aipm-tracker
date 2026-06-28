# AI PM Reading Tracker

## Structure

```
index.html          ← app shell — never touch this
data/
  articles.js       ← ALL article data lives here (metadata + compact content + dates)
  exdb.js           ← case studies (only edit when adding new case studies)
```

## Adding a new article — one file, one edit

Just tell Claude: "Add this article: [URL]" or paste the article text for paywalled content.

Claude will give you **one object** to append at the end of `data/articles.js`, right before the final `];`

It looks like this:
```js
,{
  readOrder: 104,
  stage: "Tier 2 · Should Know",
  id: 104,
  addedOn: "27 Jun 2026",
  tags: ["RAG", "Evals"],
  src: "eugeneyan",
  p: "essential",
  title: "Your Article Title",
  url: "https://...",
  iq: "Interview question this maps to",
  kt: "Key takeaway in 2-3 sentences",
  cc: `<div class="sec">...compact content html...</div>`,
  ccDate: "2026-06-27"
}
```

Paste it, push to GitHub, done. That's the entire workflow.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## GitHub Pages setup (one time)

Repo → Settings → Pages → Source: main branch → / (root) → Save

Live at: `yourname.github.io/aipm-tracker`
