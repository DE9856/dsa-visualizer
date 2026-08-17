# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # Vite dev server (Node 18+)
npm run build      # production build into dist/
npm run preview    # serve the built bundle
```

There is no test runner, no linter and no type checker in this project — `package.json`
has only `dev`/`build`/`preview`. (Some files carry `eslint-disable-next-line` comments,
but ESLint is not installed.) Verification means running `npm run dev` and exercising the
view in a browser; `npm run build` is the only automated check available.

`dist/` is a local build artifact and is gitignored — don't try to commit it.

## Documentation to keep in sync

`README.md`, `DOCS.md` (the deep reference — architecture, input formats, extension
guide) and `CHANGELOG.md` (Keep a Changelog format, entries under `## [Unreleased]`) are
maintained deliberately and describe behaviour in detail. A user-visible change is not
finished until they match it. Read `DOCS.md#architecture` before non-trivial work.

## The core idea: precomputed step frames

Every algorithm and every data-structure operation is a **pure function returning an array
of frames**. Nothing animates itself and no state is unwound — the UI renders frame
`stepIdx`, which is what makes stepping backwards, scrubbing and replay free.

- Sorting/searching: `run(array)` / `run(array, target)` returns frames like
  `{ array, compare, swap, sorted, line, pivot?, mid?, lo?, hi?, found? }`.
  `getSteps()` in `src/algorithms/index.js` then runs `annotateSteps()` to attach
  cumulative `cCount`/`sCount`.
- Data structures: `run(current, params)` returns
  `{ steps, final<Thing> }` (`finalList`, `finalTree`, `finalTable`, `finalHeap`,
  `finalTrie`, `finalUf`, `finalGraph`), with frames like `{ nodes, message, ... }`.
- `line` is an index into the algorithm's own `pseudocode` array so `InfoPanel` can
  highlight the executing line; each algorithm declares a `LINE = { ... }` constant next
  to `run`, with `null` for "finished". Every frame needs a `line`.
- Merge and quick sort additionally carry `range` / `depth` / `callId` / `callCount` /
  `calls` for `RecursionPanel`. `range` is always inclusive even though the two sorts
  recurse over different conventions internally.

## Wiring

```
src/dataStructures/<x>/*.js   one file per operation + helpers.js + index.js registry
src/hooks/use<X>.js           owns the structure's state, calls useStepPlayer, exposes
                              { ...player, steps, step, opMeta, runOperation, shuffle }
src/App.jsx                   one branch per view; picks the hook, feeds `transport`
src/components/<X>Canvas.jsx  renders a single `step`
src/components/<X>Sidebar.jsx renders inputs from the operation's `fields`
```

`useHistory` (`src/hooks/useHistory.js`) gives each view undo/redo. A view passes a
`snapshot()` of the state worth restoring and a `restore(doc, message)`, then calls
`history.record()` immediately *before* every mutation. Snapshots hold references, not
clones — safe only because operations never mutate the structure they're given, so keep
it that way.

`useStepPlayer` (`src/hooks/useStepPlayer.js`) owns playback for *all* views — `stepIdx`,
`playing`, `speed`, `togglePlay`/`stepForward`/`stepBack`/`reset`/`seek`/`pause`. It runs
on `requestAnimationFrame` and reads speed through a ref so the slider retimes the next
step instead of restarting a timer; don't reintroduce `setInterval`. `delayForSpeed()`
maps speed 1–100 onto 700ms–40ms, and `App.jsx` feeds it into the `--step-anim` CSS
variable so element transitions stay shorter than the gap between steps.

`App.jsx` keeps every view hook mounted simultaneously and selects one as `active`; the
transport bar and keyboard shortcuts always drive that one.

Registries are how things become visible: `src/algorithms/{sorting,searching}/index.js`
for algorithms, `src/dataStructures/<x>/index.js` (`<X>_OPERATIONS` / `<X>_OP_MAP` /
`<X>_GROUPS`) for operations, `src/data/categories.js` for the landing page. Register
there and the sidebar, info panel, counters and pseudocode display wire up automatically.

## Two things that must be updated together with a new view or field

1. **`src/utils/urlState.js`** — every setup round-trips through the location hash
   (`#v=tree&type=avl&a=30,20,10`). Adding a view means adding it to `VIEWS`, `fieldsFor()`
   (serialize) and `readSharedState()` (parse + validate). The hash is read **once on
   mount** and seeds the hooks via their `init` argument, so it cannot be re-read without
   a remount. Everything decoded must be validated — a hand-edited link may only produce a
   setup the app could have built itself. Serialization is per-structure and deliberate
   (BST/AVL by preorder, binary tree by level order, hash table by *insertion* order plus
   capacity, union-find by parent array).
2. **`src/data/topicTitles.js` and `src/data/topicOverviews.js`** — the heading and the
   long-form write-up rendered by `TopicPanel`. They are separate files on purpose: the
   panel starts collapsed, so the title ships in the main bundle while the prose is
   imported dynamically on first expand. `topicOverviews.js` must stay imported *only*
   by that dynamic import, or it lands back in the initial chunk.

## Conventions

- Plain JavaScript + JSX, ES modules, React 18 function components with hooks. No
  TypeScript, no state library, no router. The only runtime dependency besides React is
  `lucide-react` for icons.
- **All styling lives in `src/index.css`** — one large stylesheet with CSS custom
  properties at `:root`. No CSS modules, no Tailwind, no styled-components.
- Mobile is a structural difference, not a media query: below 760px
  (`useIsMobile`/`MOBILE_QUERY`) `Workspace.jsx` moves the sidebar into a bottom sheet
  with a fixed action bar. The sheet closes on *submit*, not on click, because unmounting
  the form first would cancel the operation. Nothing may scroll the page sideways — wide
  content (matrices, trees) gets its own scroll container.
- Comments in this codebase explain *why* — a non-obvious invariant, a bug the shape of
  the code prevents. Match that; don't narrate what the code plainly does.
- Commit messages are short, imperative, sentence-case descriptions of the user-visible
  change ("Highlight the pseudocode line each step is executing").
