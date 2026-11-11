# Galaxy Eleven – beginner's guide (everything free)

You do NOT need to write code. You only click, copy and paste. Allow about 30 minutes.

## What you need (all free accounts)
1. **football-data.org** – supplies matches and scores
2. **GitHub** – stores your site's files
3. **Cloudflare** – puts the site on the internet

## Step 1: Get your data key
1. Go to football-data.org and click "Register" (free plan).
2. Confirm your email. Your **API token** appears in your account page. Copy it somewhere safe.

## Step 2: Put the files on GitHub
1. Unzip `galaxy-eleven.zip` on your computer. You get a folder with `functions`, `public` and this README.
2. Make a free account at github.com, click "New repository", name it `galaxy-eleven`, keep it Public (or Private), click "Create".
3. On the new repository page click "uploading an existing file". Drag in the `functions` and `public` folders and the README, wait for the upload, then click "Commit changes".

## Step 3: Publish on Cloudflare
1. Make a free account at cloudflare.com. In the left menu open "Workers & Pages", then "Create", then the "Pages" tab, then "Connect to Git".
2. Pick your `galaxy-eleven` repository. For settings use: Framework preset = None, Build command = (leave empty), Build output directory = `public`. Click "Save and Deploy".
3. When it finishes, open your project, go to "Settings", then "Variables and Secrets", then "Add". Name = `FOOTBALL_DATA_KEY`, value = your token from Step 1, type = Secret. Save.
4. Go to "Deployments", open the latest one and choose "Retry deployment".
5. Your site is now live at an address like `galaxy-eleven.pages.dev`. Share it.

## Your daily jobs (done in the GitHub website)
Open the file on GitHub, click the pencil icon, edit, click "Commit changes". The site updates in about a minute.

- **Add a watchalong link:** tap a match on your site and note its **Match ID** (top of the panel). Edit `public/watchalong.json`, e.g.
  `{ "497361": "https://your-stream-link", "497362": "https://another-link" }`
  Delete a line to remove it. Matches without a link show no watchalong button.
- **Add lineups:** edit `public/lineups.json`. Easiest way: message Claude "lineups for match 497361" and paste the block it gives you.
  Format: `"497361": {"h":["Raya|G","White|D", ...], "a":[...]}` (first 11 names are the starters, the rest are subs; letters after | are G, D, M or F).
- **News:** headlines now arrive automatically from BBC Sport, The Guardian and Sky Sports RSS feeds (title and link only). To pin your own story at the top, edit `public/news.json`: each line is `["Transfers","Headline","Short summary","link"]`. To change sources, edit the `FEEDS` list in `functions/api/news.js`.

## Honest limits of the free setup
- **Scores are delayed** a few minutes on football-data.org's free plan, and there is no minute counter.
- **Lineups are not automatic** on free data plans, so you add them by hand as above. The only legitimate automatic route is a paid data plan (for example API-Football, about 19 USD a month). Ask Claude to switch the project to it.
- **News feeds:** the site shows only headlines and links, but each publisher has its own terms. Check them before launch, or remove a feed you are unsure about.
- Only matches from 3 days ago to 6 days ahead are shown.
- **Commercial use:** you are building this for a paying client, so check football-data.org's terms. Their paid plan (about 12 euros a month) adds real-time scores and clearer commercial terms. Cloudflare's free plan is widely used for business sites, but read its terms too. (Vercel's free plan is for non-commercial use only, which is why this guide uses Cloudflare.)
- A custom domain such as galaxyeleven.com costs money. The free `.pages.dev` address costs nothing.
- Have the client check that the name "Galaxy Eleven" is free to use before launch.
- This was built without internet access, so test everything after publishing. If something is wrong, tell Claude exactly what you see.
