# Project rules — Jungle Mole (and future multi-portal games)

## Multi-portal branch discipline

This repo ships one HTML5 game to many portals (YouTube Playables,
CrazyGames, Poki, Playgama, and potentially more). **Each portal's
platform-specific code must live on its own branch.** Portals have
different SDKs, ad flows, save mechanisms, orientation rules, moderation
policies, and CSP restrictions — mixing them on one branch has already
caused regressions (e.g. Playgama SDK requirements bled into the
CrazyGames build).

**Convention:**

| Portal            | Branch name              | Vite target       |
| ----------------- | ------------------------ | ----------------- |
| YouTube Playables | `portal/playables`       | `playables`       |
| CrazyGames        | `portal/crazygames`      | `crazygames`      |
| Poki              | `portal/poki`            | `poki`            |
| Playgama          | `portal/playgama`        | `playgama`        |
| Store (Play/App)  | `portal/store`           | `store`           |
| Shared engine     | `main`                   | —                 |

`main` holds the shared engine (scenes, gameplay, art, save shape).
Each portal branch adds only its SDK integration + build config on top.
Netlify can preview each branch independently so QA can test portal
builds in isolation.

**Workflow when adding a portal feature:**

1. Confirm which portal branch we're on (`git branch --show-current`).
2. If working on a portal-specific feature, **switch to that portal's
   branch first**. Never land portal-specific code on `main` or on
   another portal's branch.
3. Merge shared engine improvements from `main` into portal branches
   with a merge commit; never rebase portal branches onto each other.

Jungle Mole grew this rule *after* everything landed on one branch. We
accept the current mixed state for Jungle Mole; the next game must
start with the branch layout above.

## Read the platform's official docs BEFORE touching platform code

Do **not** guess method names, event names, storage keys, ad flows,
config-file names, or submission requirements from memory or intuition.
Before writing or modifying any portal SDK integration:

1. Open the portal's current developer documentation (the version that
   matches the SDK we're calling). Cite the URL in the PR description
   or commit message.
2. If the SDK is open source (e.g. `@playgama/bridge`, CrazyGames SDK),
   clone the repo and read the module source for the exact API — many
   portal docs are behind the actual code.
3. Verify locally when possible — a QA-tool simulator (as used for
   Playgama pause / save / ads verification) is worth the setup cost
   for any portal we ship to more than once.
4. State assumptions explicitly if unsure and ask before implementing.
   Never invent an API surface and hope it works.

If a policy or docs page is behind a login the user can access, ask
them to paste the relevant section before writing code.

## No assumptions

- Ask before creating files, moving files, or changing branch layout.
- If a requirement is ambiguous (e.g. "upload to Playables"), confirm
  the target platform, the account, and the intended flow before
  starting.
- If a step requires the user to do something outside this session
  (upload a ZIP, click Approve, verify a URL), write out the steps
  explicitly and stop for confirmation.
