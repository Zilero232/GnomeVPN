# The Telegram bot

`apps/server/src/modules/telegram/` — a second door to the same account. How to
create the bot and fill in its variables is in [ops/deploy.md](../ops/deploy.md#creating-the-telegram-bot).
Part of the [documentation index](../README.md).

## Telegram is a second door to the same account

`apps/server/src/modules/telegram/` is a bot and nothing more: it reads the
subscription, the link and the checkout through the services that already own
them. Nothing about billing or peers is reimplemented there, and a command that
needs a user resolves the chat through `TelegramLinkService` rather than trusting
it.

**It is split by what a command touches, not one service.** `TelegramBotService`
owns the routing table — `actions` maps each command and keyboard button to a
handler, `callbacks` each inline-button prefix — and nothing else.
`TelegramSubscriptionService` answers `/connect` (`/link`), `/status`, `/buy`
and `/trial`; `TelegramAppsService` `/apps`; `TelegramBillingService`
`/devices`, `/rotate` and auto-renewal; `TelegramAccountService` `/start`,
linking, `/website`, `/language`, `/help`, `/unlink` and `/delete`.
`TelegramLinkService` owns the chat rows and link codes, `TelegramWebLoginService`
the sign-in links, `TelegramProfileService` announces the bot to Telegram,
`TelegramNotifyService` speaks first (below), and `TelegramSharedService` holds
what every handler needs — resolving the chat, picking the locale, replying with
the keyboard — rather than each of them repeating it.

**Telegram is a way in, not only a way back.** `/start` from an unknown chat —
like any command or button that needs a user — creates the account itself — `ensureChat` mints a `User` through
`IdentityService.createFromTelegram`, which calls better-auth's
`internalAdapter.createUser` and so runs the database hook that creates the
`Subscription`, then writes the `TelegramAccount` row. Nobody has to visit the
site first, and nobody has to link anything.

**`User.email` stays required, and a Telegram-born account gets a placeholder.**
The column is required in better-auth's _core_ schema, not in the
emailAndPassword plugin, so making it nullable is an unsupported configuration
rather than a migration. `telegramPlaceholderEmail` mints
`<id>@telegram.placeholder.invalid` instead — `.invalid` is reserved by RFC 6761
and can never resolve, which is the point. `sendEmail` drops anything addressed
to one, so no transactional mail is ever attempted against an address that
cannot receive it.

**The trial asks for a verified email only where there is an email to verify.**
`requireEmailVerification` is off, so that gate never meant more than "you hold
some mailbox", which a disposable address satisfies. A Telegram id is not a
weaker proof than that. `isPlaceholderEmail` is what the gate reads; the
once-only guarantee still rests where it always did, on the `Subscription` row.

**A chat that registered itself is not a claim on the id.** Someone who signs up
on the site and then sends the bot their code would otherwise be told the chat
belongs to another account — their own, created seconds earlier by `/start`.
`consumeCode` therefore deletes the Telegram-born user when it is untouched:
placeholder email, no trial taken, no period. A user with either is never
deleted, and the refusal stands.

**`/website` hands out a one-time link rather than a password.** The bot has no
password to give, so `TelegramWebLogin` stores a 32-byte code for ten minutes and
`/telegram/web-login` trades it once for a session token. It is a table of its
own, not a second meaning for `TelegramLinkCode`: that one proves a chat may
drive an account, this one turns its holder into the account. The route is
anonymous by necessity and throttled tighter than the API (`WEB_LOGIN.throttle`)
for the same reason the feed is.

`POST /telegram/web-login/widget` is the other way in from the site: it takes a
Telegram Login Widget payload, checks its shape with `isWidgetPayload` and its
signature against the bot token (`verifyWidgetPayload`), and signs the chat in
through the same `ensureChat`. Both routes treat the body as untrusted — the
code must be a non-empty string, and a payload that is not a widget payload is
refused before anything is verified.

**Unlinking is refused while the chat is the only way in.** For an account with a
placeholder email, removing the chat would leave a paid subscription nothing can
open, so `askUnlink` says so instead of asking to confirm.

**The link is a code, not an OAuth flow.** The account page issues a short code,
the reader retypes it into the bot, and the bot exchanges it for the user id.
Issuing a second code invalidates the first, the code lives fifteen minutes, and
its alphabet leaves out `0/O` and `1/I/l` because a person reads it off a screen.

**A Telegram id already linked elsewhere is a conflict, not a move.** Silently
repointing it would take the subscription away from whoever holds the other
account, so `consumeCode` refuses — inside the transaction, so the refusal rolls
the claim back and the code still works from the right chat.

**A second chat for the same account is the opposite case, and is a move.**
`telegram_account.user_id` is unique, so the row cannot simply be added: the
previous chat is unlinked first. Without that the `create` collides on
`user_id` and someone linking their new phone is told "something went wrong".

**An empty `TELEGRAM_BOT_TOKEN` switches the bot off.** The module still loads
and the routes still exist; they simply do nothing. A deploy that has not
configured Telegram is not a failed deploy.

**The webhook is verified by header, and a mismatch answers 200.** Telegram
signs every call with `TELEGRAM_WEBHOOK_SECRET`. Answering an error would have
Telegram retry, and telling a prober it guessed wrong invites it to keep
guessing — so a bad secret is dropped silently. For the same reason
`handleUpdate` never throws: Telegram replays any update it gets no 200 for.
The route (`WEBHOOK.path`) carries `@SkipThrottle()`: every update arrives from
Telegram's own addresses, so a per-IP limit would throttle Telegram itself, and
the secret header is what keeps everyone else out.

**The server registers its own webhook on boot, so nothing is run by hand.**
`api.telegram.org` is blocked by most Russian ISPs, which makes a manual
registration step something only the production host can do — and something a
domain change or a rotated secret silently invalidates. `listen` sets it
alongside the descriptions, skipping the call when `getWebhookInfo` already
names the same URL and reports no delivery error. That error is what catches a
rotated secret: the URL still matches, so nothing else would notice that
Telegram is being turned away by the header check.

A webhook is only registered when `TELEGRAM_WEBHOOK_URL` is https and a secret
is set. Both are Telegram's own requirements, and calling `setWebhook` without
them fails the whole announcement, taking the command list with it.

**The webhook has its own host, and that host is the only one behind
Cloudflare.** IPv4 from this VPS to `api.telegram.org` is SNI-blocked in both
directions, so a webhook pointed at `API_URL` gets `Connection timed out`.
Telegram will not take an AAAA-only name either — `setWebhook` answers
`IPv6-only addresses are not allowed` — so the callback host needs IPv4 that is
not ours: `bot.example.com` is proxied through Cloudflare, and Telegram
reaches its addresses. The site and `api` stay unproxied, because Russian ISPs
have throttled Cloudflare since June 2025 and every user pays for that hop.

Caddy serves the host `/telegram/*` and 404s the rest: it is a callback
endpoint, not a second copy of the API. Outbound still needs the IPv6 network in
`docker-compose.yml` — Cloudflare answers the inbound half only.

Telegram caches DNS for a few minutes, so a record change is not visible to
`setWebhook` immediately; it keeps answering for the old address until the cache
expires.

**Every outbound call retries a network failure.** IPv6 egress to
`api.telegram.org` holds, but not every time: a renewal's "renewed" message was
lost to a single `Network request for 'sendMessage' failed!`, logged and gone.
`retryNetworkErrors` is a grammY API transformer installed on the bot itself,
so a reply to a button, a notification and the boot announcement all retry an
`HttpError` (the call never got an answer) `BOT_API.callRetries` times. A
`GrammyError` is an answer — a blocked bot, a bad chat id — and is never
retried. A retried `sendMessage` whose first attempt did arrive shows twice;
that is the price of not losing one.

The fallback, if IPv6 egress goes too, is long polling, which needs no inbound
path at all.

The boot logs what `getWebhookInfo` answered — the registered URL, the last
delivery error and the pending count — because that is the whole of what a
separate diagnostic command could have told anyone, and a log is where someone
looks when the bot goes quiet.

**An update can arrive before the bot has initialised, so `handleUpdate` waits
on it.** The announcement runs detached to keep Nest booting, and grammY refuses
to dispatch anything until `bot.init()` has told it who the bot is — a webhook
that is already registered delivers into that gap and every update fails with
"Bot not initialized". `init()` therefore sits outside the announcement's own
try/catch: the rest of the announcement is best-effort, but this part is what
`handleUpdate` awaits, so its failure has to reach the promise rather than be
swallowed alongside a description that did not update.

**An unset secret rejects everything rather than matching the absent header.**
`TELEGRAM_WEBHOOK_SECRET` defaults to `''`, so a `!==` against it would let a
request with no header through — a deploy that configured the token and forgot
the secret would hand the bot to whoever finds the route. The comparison is
`timingSafeEqual`, whose length check returns early because the length of a
secret is not itself a secret.

**The two refusals a command can give are different answers.** A code that did
not work and a chat that belongs to someone else's account send a reader to
different places, so `refusalFor` branches on the error code rather than
catching everything as an invalid code; the same is true of the trial, where an
unconfirmed address is not a used-up trial. `errorCodeOf` reads the code back
out of the app exception's body, which is where the app exceptions carry it.

**The bot speaks both languages.** It reads Telegram's own `language_code` for
the first message and stores what `/language` chose, which then wins — someone
who set it did so because the client was reporting the wrong thing.

**The keyboard is the interface; the commands are the fallback.** A reply
keyboard collapses into an icon beside the message box rather than holding the
screen open — it is not `persistent()`, because a dozen buttons standing over
the chat cost more than one tap costs. It changes with the chat: the link and the
status only appear once there is a subscription to use, and the trial only while
it can still be taken. `KEYBOARD_ROWS` is the whole layout — a button names the
state it belongs to and a row that empties out is dropped rather than shipped
blank. Adding a button is a row entry plus a label in both locale files.

A press arrives as a plain text message, so `buttonFor` maps a label back to its
key across both languages before the text is read as a link code. The labels
therefore have to stay unique, including between languages — a test asserts it,
because two identical labels would make a press ambiguous.

**Its copy lives in JSON, not in TypeScript.** `config/locales/{ru,en}.json`
hold every string the bot sends, mirroring the client's per-namespace files, and
`BotMessages` is derived from the Russian one — so a key present in one language
and missing from the other fails to typecheck rather than reaching a reader. The
command menu is built from the `commands` block rather than listed a second time
beside it.

**Announcing the bot never blocks the boot.** Nest does not finish starting
until `onModuleInit` returns, and `api.telegram.org` is unreachable from some
networks, so the announcement runs detached and a failure is logged rather than
raised. The same is why a command list that failed to update is not an error.

**Everything BotFather can set, the server sets on boot** — name, description,
short description and command list in each locale, and the menu button, which is
always `type: 'commands'` (it opens the command list). Each value is compared
with what Telegram already holds and written only when it differs. The one
exception is the photo, which has no API method and stays a one-off
`/setuserpic`. Editing any of the rest in BotFather is overwritten on the next
restart.

**The bot speaks first when the state changes under the reader.** A payment
settles in a webhook and a renewal in a cron, so without this nobody learns
anything until they open the chat and press something — and the keyboard they
are looking at still offers "Subscribe" on a subscription that is already paid.
`TelegramNotifyService.tell` sends the message and the keyboard rebuilt from the
current state, for a payment, extra devices bought, an automatic renewal, a card
that was declined, a period about to end (`period-reminder`) and a period that
ran out.

It lives in `TelegramNotifyModule`, which imports only `SubscriptionModule` —
`BillingModule` and the scheduler import that rather than the whole
`TelegramModule`, which imports billing back.

**Both of its consumers import the files directly, never `telegram` or
`telegram/services`.** Either barrel re-exports a service that injects
`CheckoutService`, so reaching billing through one loads billing while billing
is still initialising: `Cannot access 'CheckoutService' before initialization`,
at boot, with nothing failing to typecheck first. This is the one place in the
server that goes around a module barrel deliberately, and moving either import
back to the barrel brings the crash back — it was tried.

A chat that is not linked simply gets nothing, and anything that fails — the
chat lookup included, which sits inside the same `try` — is logged rather than
raised: an unreachable Telegram must not fail a settled payment.

## Identity, input and callbacks

**One chat row per account, and the id is the identity.**
`telegram_account.telegram_id` is what never changes — a username does, which is
why the username is stored for display only. The row points at a `User`, so a
Telegram account is a second door to one subscription rather than a second
subscription.

**A message is read as a link code only when it is shaped like one.** Anything
else a reader types gets the help text. Without `looksLikeLinkCode`, every
stray message became a database claim attempt — a free guessing oracle across
every live code at once, and updates from Telegram never pass the per-IP
throttler because they all arrive from Telegram.

**`ResolvedChat` carries the Telegram id.** `findChat` already has it, and a
handler that needs it — `setLocale` — would otherwise read `identityOf` a second
time around the shared unwrap that just did.

**A callback payload is untrusted input, whatever button rendered it.**
`countFrom` checks the shape before the value because `Number()` reads `" 2"`
and `"0x2"` as two, and `autoRenewChoice` returns null rather than treating an
unrecognised payload as "off" — a ternary there would let a crafted press turn a
paying reader's renewal off. `parseClientId` matches against `CLIENT_IDS` rather
than asking `in`, which also answers for `__proto__`.

**Every callback handler unwraps the press the same way**, so
`TelegramSharedService.answered` does it once: read the sender, acknowledge the
press so the client stops spinning, resolve the chat, hand the handler the
value. `confirmed` builds on it for the yes/no presses that `ask` renders, and
`withUser` is the same unwrap for a typed command.

**A callback payload is matched on an escaped prefix.** `callbackPattern` builds
the regular expression rather than interpolating the prefix by hand, so a prefix
carrying a metacharacter cannot widen the match, and a fresh pattern per call is
what keeps a global flag from carrying `lastIndex` between updates.

**A Telegram id is a bigint from the edge inwards.** It exceeds what a JS number
holds safely, so `identityOf` converts once at the boundary rather than leaving
each call site to remember.
