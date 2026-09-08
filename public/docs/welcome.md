# Using this handbook

This site is our lightweight **internal docs hub**: company context on the home page, and standalone articles under **Posts**.

## Adding a new article

1. Add a Markdown file under `public/docs/your-slug.md`.
2. Register it in `src/data/posts.ts` (title, date, description, slug).
3. Deploy — the post is available at `/p/your-slug`.

Use clear titles, keep posts focused, and link out to tickets or repos when it helps.

## Code blocks

Add a language after the opening triple backticks to enable syntax highlighting, for example `python`, `bash`, `sh`, `javascript`, `typescript`, `json`, `yaml`, or `dotenv`:

````markdown
```python
from bao_env_load import load_env

load_env(project="shopsimply")
```
````

Highlighting also works inside expandable `<details>` sections. Use `text` for plain text or `mermaid` for diagrams. Untagged blocks and unsupported languages remain readable as plain code.

## Images

- Site assets (logo, team photo, diagrams): place files in `public/` (e.g. `public/company.jpg`, `public/diagrams/diagram1.png`).
- Reference them in Markdown as `/company.jpg` or `/diagrams/diagram1.png`.

_Last updated: April 8, 2026_
