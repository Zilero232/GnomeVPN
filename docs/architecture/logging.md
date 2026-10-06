# Logging

One logger for the whole monorepo, and what must never reach it. Part of the
[documentation index](../README.md).

## One logger, one list of secrets

`@gnomevpn/logger` holds the only `pino()` call in the repo. The server, the web
app and the provision scripts each pass a service name and get a child logger —
nobody configures levels, redaction or transport a second time.

That matters because of `REDACTED_PATHS`. A panel password, a subscription
token and a peer's tunnel credential all pass through this monorepo, and a
second logger configured elsewhere is a second list to keep in sync — which is
how one of them ends up in a log that gets pasted into an issue.

Output is pretty by default and JSON in production; `LOG_FORMAT=json` forces it
either way, which is what the reporter's tests read. A script keeps its
`[scope] message` shape through `pretty.messageFormat` rather than by writing to
`console` — the shape is a display concern, the fields are the data.

## A node's URL is a secret, so logs name the node instead

`node.apiUrl` embeds the 3x-ui panel's random web path — the only thing between
the public panel port and its login page. `REDACTED_PATHS` strips object keys,
which cannot help once the URL is interpolated into a message string, and
`node-health` writes one every minute. Log lines name `node.id` (or the bare
host for `XrayClient`, which has nothing else), never the URL.
