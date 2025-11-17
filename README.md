## Thesis Playground – Multi-sensory Feedback Site

This is a small, low-pressure website for my thesis on multi-sensory entertainment
for Deaf and Hard-of-Hearing audiences.

The goal: let people quickly see progress snapshots (cards) and leave emoji
reactions or short comments **without** accounts, forms, or scheduled calls.

### Tech stack

- Static site: `HTML + CSS + vanilla JS`
- No external backend; feedback is stored **locally in the browser** using `localStorage`
- Designed to be hosted on **GitHub Pages**

### Files

- `index.html` – Home page with thesis log cards and feedback panel
- `about.html` – Context about the thesis and who it is for
- `contact.html` – Contact info and optional survey placeholder
- `styles.css` – Layout, colors, and typography
- `data.js` – Static `posts` array that defines each thesis card
- `app.js` – Renders cards, shows details, and handles emoji + comment feedback

To add or edit a thesis card, change the `posts` array in `data.js` and commit.

### Local development

Because this is a static site, you can preview it by opening `index.html`
in a browser. For a slightly nicer experience, you can use a simple local server:

```bash
cd /Users/seeunne/Desktop/ThesisSite/Thesis
python3 -m http.server 4173
```

Then visit `http://localhost:4173` in your browser.

### GitHub Pages deployment

This repository already has a GitHub remote:
`https://github.com/seeunisme/Thesis.git`.

To publish the site:

1. Commit and push the latest changes:
   ```bash
   cd /Users/seeunne/Desktop/ThesisSite/Thesis
   git add .
   git commit -m "Add thesis playground static site"
   git push origin main
   ```
2. In the GitHub UI for `seeunisme/Thesis`:
   - Go to **Settings → Pages**
   - Under **Source**, choose `Deploy from a branch`
   - Select the `main` branch and `/ (root)` folder
   - Save
3. After a short build, GitHub will show the public URL for the site.
   Visit it to confirm that:
   - The thesis cards load
   - Emoji reactions increment and persist per device
   - Comments save and reappear after refresh (on the same browser/device)

Once this is done, you’ll have a live, shareable URL for participants.