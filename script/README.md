# Scripts

All scripts resolve paths relative to the repo root, so they can be run from any directory.

## fetch.sh

```bash
bash script/fetch.sh
```

Downloads every post listed in `meta/missing_posts.csv` that isn't already in `posts/`.
Reads `sid` and `cf_clearance` from `.env`, passes them to ZMediumToMarkdown, moves the
resulting `.md` files to `posts/` and images to `assets/`, then rebuilds `README.md`.
Safe to interrupt and re-run — already-downloaded posts are skipped automatically.

Requires: `ZMediumToMarkdown` gem, `.env` with `sid` and `cf_clearance` cookies from medium.com.

## fetch.rb

Called by `fetch.sh`. Can also be run directly if cookies are already exported:

```bash
MEDIUM_COOKIE_SID=... MEDIUM_COOKIE_CF_CLEARANCE=... ZMTM_TOS_ACCEPTED=1 ruby script/fetch.rb
```

## index.rb

Regenerates `README.md` from the posts in `posts/`:

```bash
ruby script/index.rb > README.md
```

## download_images.rb

Scans all posts for remote image URLs and downloads them into `assets/<post-id>/`,
replacing the remote URLs in the markdown with local `../assets/` paths. Idempotent.

```bash
ruby script/download_images.rb
```

## download_yt_thumbs.rb

Finds standalone YouTube links in posts and replaces them with linked thumbnail images,
saving the thumbnails to `assets/<post-id>/`. Idempotent.

```bash
ruby script/download_yt_thumbs.rb
```

## recover_broken_images.rb

Reads `meta/broken_links.csv` and attempts to recover each image via the Wayback Machine
CDX API. Skips expired Facebook CDN URLs (unrecoverable). Saves recovered images to
`assets/<post-id>/` and patches the posts in place. Writes a log to `meta/recovery_log.csv`.

```bash
ruby script/recover_broken_images.rb
```
