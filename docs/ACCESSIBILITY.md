# Wastra — Accessibility Notes

A snapshot of the app's accessibility posture against **WCAG 2.2 AA**, what was
fixed in the a11y pass, and the conventions to keep new UI accessible.

## Conventions (apply to all new UI)

- **Icons are decorative by default.** `<Icon>` renders a Material Symbols
  ligature (`settings`, `close`, …). Without a label it sets `aria-hidden="true"`
  so screen readers don't read the ligature text aloud. The **interactive
  parent** carries the accessible name:
  ```tsx
  <button aria-label="Pengaturan"><Icon name="settings" /></button>
  ```
  Only pass `<Icon label="…">` when the icon itself is the sole carrier of
  meaning (then it becomes `role="img"` with that label).
- **Every icon-only button / link needs an `aria-label`.** A control whose only
  child is an `<Icon>` has no accessible name otherwise.
- **Form controls need a name** — a `<label>`, or `aria-label` when the visible
  cue is only a placeholder/icon.
- **Toggles** use `role="switch"` + `aria-checked`. **Star ratings / bookmarks**
  use `aria-pressed`.
- **Status messages** announce via `role="status"` (polite) or `role="alert"`
  (assertive) so they reach screen readers without focus.
- **Buttons inside forms** that don't submit must be `type="button"`.

## Modals

All modals share one accessibility primitive: [`useModalA11y`](../src/hooks/useModalA11y.ts).
Attach its ref to the dialog container and pair it with `role="dialog"`,
`aria-modal="true"`, and `aria-labelledby` (or `aria-label`). The hook provides:

- focus moved into the dialog on open;
- **focus trap** on Tab / Shift+Tab;
- **Escape** to close;
- focus **restored** to the triggering element on close.

Wired into: `BookingModal`, `ReviewModal`, `SettingsModal`, `GuestGateModal`.
Behaviour is covered by `src/hooks/useModalA11y.test.tsx`.

## Fixed in this pass

- **Icon ligatures hidden app-wide** — `Icon` is now `aria-hidden` by default,
  removing literal ligature text (e.g. "expand_more") from the a11y tree.
- **Icon-only controls labelled** — header (notifications, settings, search),
  notification panel (clear-all, per-row delete), booking & review & settings &
  guest-gate modals (close, counters, stars), destination detail (back, share,
  bookmark), AI chat (send), profile (avatar, toggles), prediksi/legal/dashboard
  back & info buttons.
- **Form inputs named** — login & signup fields, home & destinasi search,
  sort `<select>`, AI chat input, review textarea, admin `TagInput`
  (new optional `label` prop). Password show/hide buttons labelled.
- **Semantics** — watchlist cards on Profil are keyboard-operable
  (`role="button"` + Enter/Space); sortable dashboard table headers expose
  `aria-sort` and move the click target into a real `<button>`.
- **Live regions** — `Toast` announces (`role="status"`/`alert` + `aria-live`);
  Auth success/error use `role="status"`/`role="alert"`.
- **`type="button"`** added to non-submitting buttons in forms/modals.
- **Backdrops** marked `aria-hidden="true"`.

## i18n

Accessibility strings for the bilingual surfaces live under the `a11y` namespace
in `src/i18n/locales/{id,en}.json`. Hardcoded-Indonesian modals use Indonesian
labels inline, matching their visible copy.

## Backlog

- Run an automated audit (axe / Lighthouse) in CI against key routes.
- Verify color contrast of muted `on-surface-variant` text on tinted surfaces.
- Footer "coming soon" links in `Landing.tsx` are `href="#"` placeholders —
  convert to real routes or buttons when those pages exist.
- Consider a visible skip-to-content link on the app shell.
