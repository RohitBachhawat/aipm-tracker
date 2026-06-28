# Setup Guide (one time only)

## Step 1 — Create the GitHub repo

1. Go to github.com → New repository
2. Name it `aipm-tracker`
3. Set to Public
4. Click Create (don't add any files yet)

## Step 2 — Upload the project files

In your terminal:
```bash
cd aipm-v2           # the folder from the zip
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/aipm-tracker.git
git push -u origin main
```

## Step 3 — Enable GitHub Pages

Repo → Settings → Pages → Source: Deploy from branch → Branch: main → / (root) → Save

Your app is live at: `https://YOUR_USERNAME.github.io/aipm-tracker`

## Step 4 — Configure push.py (one time)

Create a GitHub token:
- github.com → Settings (top right avatar) → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
- Name: "aipm-tracker"
- Repository access: Only select repositories → aipm-tracker
- Permissions: Contents → Read and write
- Click Generate token → Copy it immediately

Open `push.py` and fill in lines 14-15:
```python
GITHUB_TOKEN = "github_pat_xxxxxxxxxxxx"   # paste your token here
GITHUB_REPO  = "yourname/aipm-tracker"     # your actual username
```

## Step 5 — Test it

```bash
python3 push.py --dry-run  # should print usage message
```

---

# Adding a new article (every time)

1. Tell Claude: "Add this article: [URL]"  
   Or for paywalled: paste the article text and say "Add this article"

2. Claude gives you a file: `new_article.json`

3. Run:
   ```bash
   python3 push.py new_article.json
   ```

4. Done. Site updates in ~60 seconds.

That's the entire workflow. Nothing else to do.

---

# Adding a case study (EXDB)

Same flow — tell Claude the case study details, get a file, run push.py.
The file will have `"type": "exdb"` and push.py handles it automatically.
