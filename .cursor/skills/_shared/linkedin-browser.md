# LinkedIn browser: low-token rules

Full `browser_snapshot` of a LinkedIn page costs ~20–50k tokens and stays in context for every later step. Use the cheapest option that answers the question.

## Order of preference

1. **Probe** (`browser_cdp` → `Runtime.evaluate`, `returnByValue: true`) — returns ~50 tokens of JSON.
2. **JS click** via `Runtime.evaluate` — no snapshot needed.
3. **Scoped snapshot**: `browser_snapshot({ interactive: true, compact: true, selector: "<scope>" })` then `browser_click(ref)`.
4. **Full snapshot** only when 1–3 return `unclear` / fail. Never more than once per profile.

Never call `browser_take_screenshot` or `take_screenshot_afterwards` unless reporting a blocker.

## Profile probe

Run after `browser_navigate` to a profile (wait ~2s first):

```js
(() => {
  const url = location.href;
  if (/\/(checkpoint|login|authwall|uas)\b/.test(url)) return { state: 'blocked', url };
  const h1 = document.querySelector('main h1');
  const card = h1?.closest('section') ?? document.querySelector('main section');
  if (!card) return { state: 'unclear', url, why: 'no top card' };
  const labels = [...card.querySelectorAll('button, a[role="button"], a[href*="/messaging/"]')]
    .map(el => (el.getAttribute('aria-label') || el.innerText || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean).slice(0, 12);
  const has = re => labels.some(l => re.test(l));
  const degree = (card.innerText.match(/·\s*(1st|2nd|3rd\+?)/) || [])[1] ?? null;
  const state = degree === '1st' ? 'connected'
    : has(/^Pending|withdraw/i) ? 'pending'
    : has(/^(Invite .* to connect|Connect)$/i) ? 'connect'
    : 'unclear';
  return { state, degree, name: h1?.innerText.trim() ?? null, labels };
})()
```

- `connected` → accepted. `pending` → still pending. `connect` → Connect button in top card.
- `unclear` → Connect may be under **More**: run the More-menu probe below before any snapshot.
- `blocked` → stop the batch and report (challenge / login).

## JS clicks

Click by aria-label/text inside the top card, return what was clicked:

```js
((re) => {
  const card = document.querySelector('main h1')?.closest('section');
  const el = [...(card ?? document).querySelectorAll('button, a[role="button"], [role="menuitem"], div[role="button"]')]
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
- For pages you only read (search results, lists), extract with `Runtime.evaluate` returning an array of `{name, title, url}` capped at 10, not a snapshot.
