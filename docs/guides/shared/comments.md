# Comments

Part of the [style guide](../README.md).

## No comments

The code is expected to read on its own. `apps/client` has no comments beyond
lint directives (`// eslint-disable-next-line <rule> -- <reason>`), and stays that way; the reasoning belongs in `docs/` or the commit message.
Build scripts under `scripts/` and YAML in `.github/` are the exception — they
already carry comments.
