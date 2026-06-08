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

Wired into: `BookingModal`, `ReviewModal`, `SettingsModal`, `GuestGateModal`,
and the admin CRUD dialogs (`DashboardDestinasi` add/edit + delete-confirm,
`UserManagement` edit). The delete-confirm uses `role="alertdialog"`.
`NotificationPanel` is a popover (not a modal): it closes on Escape and on
outside-click, without a focus trap. Behaviour is covered by
`src/hooks/useModalA11y.test.tsx`.

> **Coverage note:** every interactive `<button>/<Link>/<a>/<NavLink>` whose only
> child is an `<Icon>` was swept programmatically (brace-aware, so inline
> `=>` handlers don't hide the match) and given an accessible name — **0 remain**.

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

## Reduced motion

- `<MotionConfig reducedMotion="user">` wraps the app in `App.tsx`, so every
  `motion/react` component automatically drops transform/layout animation when
  the OS "reduce motion" setting is on.
- A global `@media (prefers-reduced-motion: reduce)` block in `src/index.css`
  neutralizes CSS transitions/animations (using `0.01ms`, not `none`, so
  reveal-from-opacity animations still snap to their visible end state).
- Components that gate visibility behind a scroll/in-view reveal (e.g.
  `BlurText`) short-circuit to the fully-visible state under reduced motion via
  `usePrefersReducedMotion`, so text is never stuck hidden.

## Automated audit (axe-core)

`e2e/accessibility.spec.ts` runs **axe-core** (WCAG 2.0/2.1 A + AA) against 9
routes — 3 public + 6 authenticated (a synthetic Supabase session is seeded the
same way as `booking-payment.spec.ts`). Run it with:

```bash
npm run test:a11y      # just the audit (needs system Chrome; boots the dev server)
```

The suite fails on any `serious`/`critical` violation. It emulates
`prefers-reduced-motion` and lets reveals settle before sampling, so it also
acts as a reduced-motion smoke test. Canvas/WebGL layers and the one decorative
`[data-decorative]` marquee are excluded (not content; unreadable by contrast).

Contrast fixes from the audit: density `%` badges (`amber/emerald-600` →
`-700`), muted helper text (`/60`–`/70` opacities → solid), the Landing forecast
mock-chart panel (`bg-white/10` → `bg-black/10` so white labels pass), the
Prediksi "Live Cam" glass button, and the Legal contact links (added
`underline` so they're distinguishable without color). The Prediksi forecast
cards were also restructured so the bookmark button is no longer nested inside
the card's selection button (`nested-interactive`).

## Backlog

- Wire `npm run test:a11y` into CI.
- Footer "coming soon" links in `Landing.tsx` are `href="#"` placeholders —
  convert to real routes or buttons when those pages exist.
- Consider a visible skip-to-content link on the app shell.
- Form inputs use `aria-label`; consider visible persistent `<label>`s.
