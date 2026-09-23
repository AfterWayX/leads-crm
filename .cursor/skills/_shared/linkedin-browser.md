# LinkedIn browser: low-token rules

**Always CDP-first.** Full LinkedIn snapshots cost ~20–50k tokens each and stay in context for every later step. Default path for every profile/list page: navigate → short wait → `browser_cdp` probe. Never decide from a navigate dump.

## Hard rules (always)

1. After every `browser_navigate`, **ignore** the returned snapshot. Do not cite it, re-read it, or base decisions on it. Immediately run a CDP probe.
2. Prefer `browser_cdp` → `Runtime.evaluate` (`returnByValue: true`) for state, clicks, and list extraction.
3. **Scoped** `browser_snapshot({ interactive: true, compact: true, selector })` only when CDP click/fill needs a ref (composer, dialog) or probe returned `unclear`.
4. **Full** `browser_snapshot` (no selector) at most once per profile, only after scoped + More-menu probes fail.
5. Never `browser_take_screenshot` / `take_screenshot_afterwards` unless reporting a blocker.

## Order of preference

1. **Probe** (`browser_cdp` → `Runtime.evaluate`) — ~50 tokens of JSON.
2. **JS click** via `Runtime.evaluate` — no snapshot needed.
3. **Scoped snapshot** + `browser_click(ref)` — composer / dialog / unclear only.
4. **Full snapshot** — last resort, once per profile max.

## Profile probe

Run after `browser_navigate` to a profile (wait ~2s first). Do not use the navigate snapshot.

```js
(() => {
  const url = location.href;
  if (/\/(checkpoint|login|authwall|uas)\b/.test(url)) return { state: 'blocked', url };
  const h1 = document.querySelector('main h1');
  const card = h1?.closest('section') ?? document.querySelector('main section');
  if (!card) return { state: 'unclear', url, why: 'no top card' };
  const labels = [...card.querySelectorAll('button, a[role="button"], a')]
    .map(el => (el.getAttribute('aria-label') || el.innerText || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean).slice(0, 16);
  const has = re => labels.some(l => re.test(l));
  // Degree badge next to the name only — avoid false 1st from "Explore Premium" / mutuals
  const nameBlock = (h1?.parentElement?.innerText || h1?.innerText || '').slice(0, 200);
  const degree = (nameBlock.match(/·\s*(1st|2nd|3rd\+?)/) || [])[1] ?? null;
  const state = degree === '1st' ? 'connected'
    : has(/^Pending|Withdraw/i) ? 'pending'
    : has(/Invite .* to connect|^Connect$/i) ? 'connect'
    : 'unclear';
  return { state, degree, name: h1?.innerText.trim() ?? null, labels: labels.slice(0, 8) };
})()
```

- `connected` → accepted. `pending` → still waiting. `connect` → Connect / Invite still available.
- `unclear` → Connect may be under **More**: run the More-menu JS click before any snapshot.
- `blocked` → stop the batch and report (challenge / login).

## JS clicks

Click by aria-label/text inside the top card, return what was clicked:

```js
((re) => {
  const card = document.querySelector('main h1')?.closest('section');
  const el = [...(card ?? document).querySelectorAll('button, a[role="button"], a, [role="menuitem"], div[role="button"]')]
    .find(e => re.test((e.getAttribute('aria-label') || e.innerText || '').trim()));
  if (!el) return null;
  el.click();
  return (el.getAttribute('aria-label') || el.innerText).trim().slice(0, 60);
})(/^(Invite .* to connect|Connect)$/i)
```

- More menu: pass `/^More( actions)?$/i`, wait ~1s, then search the whole document for `/Invite .* to connect|^Connect$/i` (menu renders outside the card — replace `card ?? document` with `document`).
- Invite modal: find in `document.querySelector('[role="dialog"]')` by `/Send without a note/i`, `/Add a note/i`, `/^Send( invitation)?$/i`.
- After sending, re-run the profile probe; success = `pending`.
- If a JS click returns `null` or the UI does not change, fall back to a scoped snapshot (`selector: '[role="dialog"]'` or `'main section'`).

## Messaging

- Open DM: JS click `/^Message\b/i` in the top card.
- Type into the composer with `browser_type`/`browser_fill` using a ref from `browser_snapshot({ interactive: true, compact: true, selector: '.msg-overlay-conversation-bubble, [role="dialog"]' })`.
- Verify sent:

```js
(() => [...document.querySelectorAll('.msg-s-event-listitem__body, .msg-s-event__content')]
  .at(-1)?.innerText.trim().slice(0, 80) ?? null)()
```

  Success = returned text matches the start of the draft body.

## Context hygiene

- Do not echo probe/snapshot output back in chat. Keep one line per item: `{id, state, action}`.
- For pages you only read (search results, lists, invitation manager, connections), extract with `Runtime.evaluate` returning a small array capped at 10–20 items — never a snapshot.
- Treat navigate snapshot payloads as noise: act only on CDP JSON / scoped refs.
