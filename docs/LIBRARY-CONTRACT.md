# The Library contract

Bizzing Maths's contract, with maps. Every tool is one file, `app/src/library/<id>.js`,
registered in `app/src/library/index.js`. The host draws the page head and back button and
passes the tool a context; the tool draws everything below it.

## Exports

```js
export const TOOL = { id, name, glyph, art: 'lib-<id>', blurb };
export function view(ctx) { return '<div>…</div>'; }   // required
export function act(name, arg, ctx) { … }               // required; host re-renders after
export function key(e, ctx) { return false; }           // optional; true if handled
export function answered(q, right, ctx) { … }           // optional; after each answer in your run
export function done(run, ctx) { return { stars, lines, buttons }; }  // optional; after your run
export function selftest(ok, makeCtx) { … }             // required: prove your facts
```

## Context

`ctx.ui` (screen state) · `ctx.data` (the child's record for this tool; `ctx.save()`) ·
`ctx.kid`, `ctx.band` · `ctx.tick(right, xp)` (only for right answers the child produced) ·
`ctx.startRun(title, items)` (items are `mc` / `map` questions from `chapters/kit.js`; a map
question may set `region: 'US'|'IN'|'CA'|'AU'`) · `ctx.toast`, `ctx.sfx`, `ctx.confetti` ·
`ctx.go(nav, arg)`.

## Buttons, inputs, maps

- Button: `data-act="lib" data-arg="<id>|name|arg"` → `act('name', 'arg', ctx)`.
- Text input: `data-lib-input="field"` with a stable `id` → `ctx.ui.field`.
- Range: `data-lib-range="<id>"` → `act('range', value, ctx)`.
- A map from `worldSVG`/`regionSVG` with `tap: true`: a tap, or the keyboard cross + Enter,
  calls `act('tap', JSON.stringify({ key, cc, lat, lng }), ctx)`.
- **Every interaction by touch AND keyboard.**
- Colours only from CSS variables; classes prefixed `t-<id>-` where they are the tool's own.
