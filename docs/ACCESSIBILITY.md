# Wastra — Accessibility Notes

A snapshot of the app's accessibility posture against **WCAG 2.2 AA**, what was
fixed in the a11y pass, and the conventions to keep new UI accessible.

## Theming (light + dark)

The app ships **light and dark** themes. Dark mode is class-based: `useTheme`
toggles a `.dark` class on `<html>` (persisted to `localStorage`, defaulting to
the OS preference), and `index.html` applies it pre-paint to avoid a flash.
`src/index.css` defines the Material 3 dark palette by overriding the semantic
color tokens under `.dark`.

Rules that keep both themes correct:
- **Use semantic tokens, not raw palette colors.** `bg-surface`,
  `text-on-surface`, `bg-surface-container-*`, `border-outline-variant`, etc.
  flip automatically. Avoid `bg-white` / `bg-stone-*` / `text-stone-*`.
- **Pair each container with its `on-` token** so contrast holds when the
  container flips: `bg-primary`→`text-on-primary`, `bg-error`→`text-on-error`,
  `bg-primary-container`→`text-on-primary-container`. Density badges use the
  paired `getDensityBgColor` + `getDensityOnColor` helpers.
- **A literal-color surface needs literal-color text.** Heatmap cells
  (`getDensityHex`) and "always dark" bands (`bg-stone-900 text-white`) don't
  flip, so their text stays fixed (e.g. `text-stone-900` / `text-white`).
- For literal accent text that must stay readable on both surfaces, add a
  `dark:` variant (e.g. `text-amber-700 dark:text-amber-400`).

The axe harness audits **every route in both `light` and `dark`** (see below).

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
- WebGL/RAF backgrounds outside `motion/react`'s reach are handled directly:
  the full-screen `Aurora` shader renders a single static frame (no continuous
  loop) under reduced motion. (`CircularGallery` only moves on user input, so it
  needs no change.)

## Language

`<html lang>` is kept in sync with the active i18n language (`src/i18n/index.ts`
listens for `languageChanged` and updates `document.documentElement.lang`), so
the page language always matches the rendered content (WCAG 3.1.1).

## Automated audit (axe-core)

`e2e/accessibility.spec.ts` runs **axe-core** (WCAG 2.0/2.1 A + AA) against 18
routes **in both light and dark** (36 audits) — 4 public + 9 member-facing + 5
pengelola dashboard, each under `colorScheme: light` and `dark`. The session is
seeded into localStorage like `booking-payment.spec.ts`; `seedAdmin` additionally
stubs the PostgREST role-check queries so `DashboardRoute` renders. The `/app`
admin pages (Admin, Otoritas, AiAgent, UserManagement, AuditLogs) fetch live
data and aren't in the harness yet — their forms were labelled by hand. Run with:

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

## Navigation & forms

- **Skip link** — `AppLayout` renders a `sr-only focus:not-sr-only` "Lewati ke
  konten" link as its first child, targeting `<main id="main-content"
  tabIndex={-1}>`, so keyboard/AT users can jump past the nav.
- **Auth form** uses visible, persistent `<label htmlFor>` elements (the
  `BookingModal` pattern) instead of placeholder-only labelling, so the field
  purpose stays visible after typing. Search / sort / chat inputs keep
  `aria-label` (the conventional pattern for icon-prefixed search boxes).
- No dead `href="#"` links: the Landing footer's placeholder links now point to
  real destinations (`#features`, `mailto:`, `/privacy`).

## Backlog

- All previously-listed items are addressed. Remaining ideas: per-field inline
  validation messages wired with `aria-describedby`; periodic re-audit as new
  surfaces are added.
