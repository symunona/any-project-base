Create an opinionated starter project.

The goal is to create a painless project starter repo, that kick-starts any business idea I have.
Most SaaS businesses use a fixed set of concepts, I want to be iterate over them fast.
The point is: create a solid, well working STUB, that ties the agent's hands about the basic infra and module structure, and chosen tech, so it can produce a demo ready and deployable the shortest time possible without having to worry about security and implementation details, holding the hand of the DEV making it as frictionless as possible.

## Setup
## Dev Tooling
Install these first, make sure they work!
- just setup tools
- caveman skill: https://github.com/JuliusBrussee/caveman
- use beads for task tracking for multiagent work: https://github.com/gastownhall/beads
- use gitnexus: https://github.com/abhigyanpatwari/GitNexus for the fronend webapps and supabase and mobile-app
- context7 for API: https://github.com/upstash/context7
- pnpm
- android SDK (optional!)
- docker (for supabase)
create install.sh
create checkers for each of these libs!
install should detect first if any of these are already installed, show the table.
Each should have their respective files: 
setup/dev/
- [skill]_setup.sh // does the installing
- [skill]_check.sh // if installed

- main installer first lists which of these tools are already installed, then based on that runs the ones still needed.
> A: LSP write support in agents immature/editor-dependent — skip for now. Agent renames via grep+edit. Broken references caught by `tsc --noEmit --strict` in pre-commit + CI. TypeScript strict mode is the guardrail. Revisit when Claude Code LSP write support matures.
## Platform Setups
- setup/platform/
	- [platform]_setup.sh
	- [platform]_check.sh
- same as the above: just setup platforms
- setting up all the used tools (supabase, stripe, firebase (push notifications), emailing)
	- I want a very precise (go supabase, register, click the right menu, make api key, new env, etc) style HUMAN_SETUP.md where we document for each platform: 1. what the platform does 2. what won't work if we do not do (obviously not supabase, but e.g. firebase or stripe)
	- I want to automate whatever we can, by the clis of these platforms, and make the setup process/detection as convenient WITH checks as it can be. E.g. I want an installer script that holds my hand, every steps it checks if I managed that step by checking if the API key is valid e.g. or the flow should work.
		- create separate script files for each.
		- create just setup XXX that runs each
		- create just setup status/just setup health to return a list for each that runs the checks for each, show it in a table, if not set up/partial: show write out the implications of it.

## Coding Rules
- No robot attribution
	- you are an **anonymous contributor**. Do not include your name, model name, or any AI attribution in commit messages, comments, code, or documentation.
	- Do not add "Co-Authored-By" or similar lines to commits.
- Generated files convention
	- Every generated or script-synced file MUST have a header comment as its very first line.
	- Format by filetype:
		- TypeScript/JS: `// GENERATED — do not edit. Source: <what produces it>. Re-generate: <exact command>.`
		- CSS: `/* GENERATED — do not edit. Source: <what produces it>. Re-generate: <exact command>. */`
		- SQL: `-- GENERATED — do not edit. Source: <what produces it>. Re-generate: <exact command>.`
		- YAML/JSON: `# GENERATED — do not edit. Source: <what produces it>. Re-generate: <exact command>.`
	- Agent must NEVER edit a file with this header. Change the source, re-run the generator.
	- Checker: `setup/checks/generated_files_check.sh` — verifies header present on all known generated files.

	Known generated files:

	| File | Source | Re-generate |
	|------|--------|-------------|
	| `commons/types/db.types.ts` | `supabase gen types typescript --local` | `just db-types` |
	| `setup/branding/palette.js` | agent, branding setup step | `just setup branding` |
	| `branding/colors.yaml` | `apply-branding.sh` from palette selection | `just setup apply-branding` |
	| `commons/styles/globals.css` | `apply-branding.sh` | `just setup apply-branding` |
	| `client-portal/public/manifest.json` | `apply-branding.sh` | `just setup apply-branding` |
	| `admin-portal/public/manifest.json` | `apply-branding.sh` | `just setup apply-branding` |
	| `mobile-app/app.json` | `apply-branding.sh` (partial) | `just setup apply-branding` |
	| `INSTALL_STATUS.md` | `setup/install.sh` end of run | `just setup report` |
	| `setup/.install-state.json` | `setup/install.sh` per step | `just setup` |
	| `architecture/complexity-baseline.json` | `complexity_check.sh` on merge | `just check complexity-baseline` |

- before work
	- always read AGENTS.md of each folder FIRST
	- look at git history to gain context `git log --oneline -30`
	- check git status `git status` for uncommitted files - decide what to do with them first, always start with clean worktree.
- when planning
	- classify if there are any major refactor taking place of the existing API, architectural logic
	- if something has architectural changes, ASK the dev!
	- always create a change assessment for each plan, finish every plan with a table where you collect the following: architectural change needed, complexity, certainty, impact
- when implementing
	- use https://github.com/vercel-labs/agent-browser for debugging fronend apps

# Architecture

landing/ - static carousel index with SEO optimized content.
client-portal/ - frontend webapp for users of the service
admin-portal/ - frontend webapp, where the admin users can sign in
supabase/ - backend, locally runnable, hosting static webapp
mobile-app/ - Expo (React Native) app, web target for agent testing
architecture/ - md fixed architectural decisions
commons/ - assets that are reused, lib utils for that can be used in both webapps
setup/ - different platform setup and setup checker scripts and their docs
branding/ 

CLAUDE.md - use AGENTS.md, always read ALL parent folder AGENTS.md
HUMANS.md - best practices, how to prompt and design the logic
justfile
README.md - Very brief explanation what this is.
LICENCE - MIT

.env.local.example - but use cred store of supabase as default 
> A: Use `.env.local.example` (committed) + `.env.local` (gitignored). `setup/env/env_check.sh` lists all vars, flags missing ones, explains broken functionality per missing var (same pattern as platform checks). `setup/env/env_setup.sh` walks user through each missing var interactively — prompts, user pastes value, script writes to correct `.env` file.

Default: 2 envs on supabase: prod, testing

### How it looks on the web:
domain eg: any-project-base.com -> landing, used for android & ios app intent open with manifest!
app.any-project-base.com -> client app /api - redirects to supabase respective api
admin.any-project-base.com -> admin app /api - redirects to supabase respective api

## Frontend Webapps
- pnpm, vite, react, react query, router, tailwindcss, lucide icons, PWA, 
- mobile first
- css: one short root file with color variables, only use colors from there, approximately ~10/20 theme colors, dark mode too in one file, do NOT use any other and built in colors
	- CREATE CHECKER FOR THIS
- group reusable components by modules under components
- always look for existing components first
- generalized,standardized paging endpoints and data tables and infinite scrolling with limit, offset,order, pagesize (defined in architecture/paging.md) 
- API interface generated from the backend files 
> A: Supabase JS client for DB (typed via `supabase gen types`). Hono + Zod for edge function endpoints — AppType exported from edge functions, imported by commons for typed hono/client. Schemas written separately in edge functions and commons (simpler Deno boundary). Drift guarded by checker script (see architecture/philosophy.md). See architecture/tooling.md.
- auth, cookie based, use built in of supabase if there is (is there?)
- display commit hash and datetime in short watermark bottom-right of the page when compiled, otherwise show dev
- generalized modules, modals, buttons, in-page notifications, header, layouts
- never user fetch directly, create a fetchApi function, that wraps fetch away
	- create check for this in tooling
- remember dark mode in LS
- use root package.json, do not use project level!
	- fixed package versions in package.json for supply chain attacks
	- glassworm checker
- [[translation]]

#### Checkers
	- complexity: do complexity analysis for each sub-repo where makes sense, use that as an indicator, raise that to the dev if the complexity of something changed significantly
- code linters + ESLint:
> A: `@typescript-eslint/recommended-type-checked`, `react-hooks/exhaustive-deps: error`, `no-restricted-globals: fetch` (enforces fetchApi wrapper), `no-console`, `import/no-cycle`, `complexity: warn at 8`. See architecture/complexity.md.

- css: class color checker: only use root defined vars everywhere for the color palette
> A: grep for hardcoded `#hex`, `rgb()`, `hsl()` outside `globals.css`. `eslint-plugin-tailwindcss` for class misuse.

- supply chain:
> A: GlassWorm + `socket.dev` CLI (catches malicious packages pre-install) + `lockfile-lint` (registry tampering) + `pnpm audit`. Run on every install/update.

- security static analysis:
> A: `semgrep` with OWASP ruleset (SAST, CI-blocking) + `eslint-plugin-security` (no eval/innerHTML/unsafe regex) + `gitleaks` pre-commit (leaked secrets).

- complexity: see architecture/complexity.md
> A: `code-complexity` CLI. Threshold 8: doc required (blocking). 11-15: warn. >15: CI hard fail. @docs: convention — doc file lives next to source, mermaid graph + history preserved. See architecture/complexity.md.

- GlassWorm hunter for supply chain attacks: https://github.com/afine-com/glassworm-hunter
		- run every time we do install/package update

- other CQ:
> A: `knip` (unused exports/files/deps), `size-limit` (bundle regression), `madge --circular` (circular deps visualization).


## Repos
### Admin Webapp
Layouts: login, app
Header: Usage, Plans, Users, Support, System
#### Users
pagable list of users with filters
url: user/[id]
load user details
Do user actions, delete (with confirm by having to type in their username)
Change Plan
Transaction history, user plan, show predicted future charges based on plan
User Credits
Usage stats: not the actual records, but aggregated different granularity stats (endpoint should suport multiple resolutions for usage)
Show the user's registered devices (devices table)
#### Plans
Member (Free)
Member + PayAsYouGo
Subscription Monthly
Subscription Yearly
Cupouns
Other Products
Credits
plans should have from-to dates to might be null.
> A: 4 modes: none/credits/subscription_credits/tiers — set in project.yaml. Stripe owns payment/invoicing, DB mirrors via webhooks (stripe_* prefixed tables). Credits tracked locally per user, deducted atomically on each LLM call. See architecture/pricing.md.
#### Usage
As everything uses tokens of LLMs and image models now, let's have native support for that in DB level:
On each LLM/AI model call, create entry in the DB with input/output token count
#### System
version release history: should contain a db entry for each deployment in the deployments table: When deploying a version, should get an entry in that table. Api should pull the release notes for each SHA, db should have date, branch, sha in it for that env.

#### Support
Simple "ticketing" system admin side.
Users can message the admins/support personel, and they can respond to them on here. 
Conversations have new/open/waiting-on-customer/closed statuses they can be closed from here, then they disappear (by default this filter is on) - there is a quicksearch bard where admins can search for tickets/users.
View is like an email client: list, message opens on the right.
Users get email notifications about the new message, unless they opt it out (user settings page ), with the content.
When loading the detailed view of the message: hit the llm backend to suggest an answer based on the ticket's text and a fixed prompt wired into a constant: show these as buttons, when support agent/admin presses the button, fill in the response textarea
### Client Webapp
It can login with email/oauth like google/fb - if their credentials are set in env vars.
Once logged in, they have a 
#### dummy dashboard: 
a simple AI chat interface: text input on the bottom with send, when response comes back, messages shows up just on frontend. Do not persist this data on the backend, just create an API endpoint for LLM calls to demo that, make it single component, call it RemoveMeThisISOnlyDemoLlmChat component within the Dashboard component.

#### Header: 
	hamburger/profile dropdown is settings (comes in from the side on mobile)
	
Profile 
	they can: change their name update their notification preferences
Plan/billing
	explain the details of their current plan, show them the available plans, or if they can
	show them their transaction info (stripe)
	if the plan allow, allow them to buy credits via stripe
	if they're on a subscription 
> A: Stripe handles checkout, subscriptions, invoices, coupons, customer portal. Own DB handles credit balance, usage tracking, plan feature flags. Webhook sync keeps them in sync. See architecture/pricing.md.

Support 
	should redirect them to a form where they can post a message to the admin, or see their conversations.
#### Login
Forgot password/password reset handling via supabase - check emailing
## Mobile App (Expo / React Native)
- saves device id into db after auth, gets handle token so it never signs out by default
- registers for push notifications via `expo-notifications` (FCM + Web Push unified)
- test push notification button on admin page, incoming notification screen in app
- compile and debug on web via `expo start --web` — Playwright can test this
- always wrap native functionality via `Platform.OS === 'web' ? mockImpl : nativeImpl`
- foreground services via `expo-task-manager` + `expo-background-fetch`; true foreground service = bare workflow + native module (edge case)
- shared React components + TS types via commons/
> A: Expo (React Native). Web target for agent testing via Playwright. Native-only features (push, foreground services, biometrics) wrapped with Platform.OS mock for web. EAS Build for cloud APK builds — local Android SDK optional.


## Landing
I am thinking of a mainly static index.html, with lang selector top right, but not using any fancy thing, just a simple redirect like 
es/index.html - translation spanish
ko/index.html
js/ whatever js to be compiled into it
index.html (default en)
shared js scripts from root, mainly for the visuals, lightweight, interactivity if needed, simple vite build no webapp, but e.g browser lang detection/saving lang prefs. Save lang prefs in cookie/ls so app can reuse it! (app might be in subdomain)
Separate files per language.

Let's do a simple bg yt embed: behind header https://www.youtube.com/watch?v=672TY8K2PKk
Let's do a landing of THIS very project.

## Users
3 roles: admin, support, user, but extensible.
admin webapp only accessible with admin and support
they have names, emails.
auth methods separate table I guess
> Q: auth best practices, e.g. they reg with email, but then use google auth?
> A: Enable auto-link in Supabase Auth (merges same verified email across providers). `auth.identities` handles multiple methods per user — no custom auth_methods table needed. Roles go in custom JWT claims on `public.users`.

newsletter email opt in

## Tools
- [Just Command Runner](https://github.com/casey/just)
	- group tasks by category
	- just start should start
	- just deploy prod/test/... - it saves 
### initiate project
- cli tool Q&A style:
	- sets(replaces):
		- name
		- default url/domain (used in )
		- branding (logo, tagline)
		- git url
		- authors every subproject (webapps, landing, mobile app) start with name `any-project-base`
		- mobile app domain
	- creates `project.yaml` with these info
	> A: theme_colors (primary/secondary/accent/success/danger), agent, pricing_model, analytics, push_notifications, auth_providers, default_locale, supported_locales, envs. Branding managed via branding/ dir + `just setup apply-branding`. See architecture/branding.md + architecture/project-yaml.md.

## Docs
Each module folder should have their respective AGENTS.md.
Main AGENTS.md should describe what the current folder and it's engineering decisions are.
In a pre-commit hook, write a script, that takes the folder's diff, and if something changes does the following:
- runs the respective checks/tests for the folder
- looks if there were architectural changes/decisions that needs noting in the AGENTS.md, updates it if needed, so AGENTS.md remains a living document.

## Integrations
stripe: 
> A: Yes. Stripe CLI scripts product/price creation per template. Test/prod = separate API keys, no "env" concept. setup/pricing/setup_pricing.sh orchestrates CLI calls + ordered agent prompts. See architecture/pricing.md + architecture/tooling.md.

posthog: 
	for the client app/mobile app (optin in config, if posthog keys are populated)
>	A: Default events: user_signed_up (source), user_logged_in, plan_viewed, checkout_started/completed, subscription_canceled, credits_depleted, llm_call_made, feature_used, support_ticket_created, notification_clicked. Session replay + feature flags enabled. Only initializes if POSTHOG_KEY set. pricing_model:none → billing events omitted automatically.

## Questions
For each platform, how much of the registering/setup/getting API keys for dev/test env can we automate?
- supabase
- stripe
- firebase/google

## Github workflows
on release/pre-release, build
just release / just pre-release triggers tagging, asks for release name (makes up a release name) - auto version up, sums up the changes from last version


