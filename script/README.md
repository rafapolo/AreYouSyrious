# Scripts

All scripts resolve paths relative to the repo root and can be run from any directory.

## ays — unified pipeline CLI

```
ruby script/ays <command> [options]
```

| Command | What it does |
|---------|-------------|
| `fetch` | Download missing posts from Medium via ZMediumToMarkdown, then rebuild README |
| `images` | Download remote images referenced in posts and replace URLs with local paths |
| `thumbs` | Download YouTube thumbnails for standalone video links and embed them |
| `recover` | Recover broken images via Wayback Machine CDX API |
| `index` | Regenerate README.md from posts (prints to stdout) |
| `all` | Run full pipeline: images → thumbs → recover → index |

**Options:**

- `--fetch` — (for `all` only) prepend the `fetch` step before images

**Examples:**

```bash
ruby script/ays fetch
ruby script/ays images
ruby script/ays thumbs
ruby script/ays recover
ruby script/ays index > README.md
ruby script/ays all
ruby script/ays all --fetch
```

## Authentication (fetch only)

`fetch` reads `.env` from the repo root. Required keys:

```
sid=<value>
cf_clearance=<value>
```

These are mapped to `MEDIUM_COOKIE_SID` and `MEDIUM_COOKIE_CF_CLEARANCE` for ZMediumToMarkdown.
`cf_clearance` expires in minutes — refresh it from your browser if fetch gets blocked.

## Meta files

- `meta/missing_posts.csv` — list of posts to fetch (`date,title,url`)
- `meta/all_posts_urls.csv` — full known post URL list
- `meta/broken_links.csv` — broken image URLs for the `recover` command
- `meta/recovery_log.csv` — output log written by `recover`
