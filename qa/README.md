# Dudo Dice QA Suite

This folder contains a comprehensive QA suite for [dudodice.com](https://dudodice.com), covering:

- unit and integration tests for core game logic
- browser-based E2E tests for local and online gameplay flows
- responsive/UI checks for desktop and mobile
- multiplayer stress, disconnection, and security/integrity checks

## Structure

- `qa/playwright.config.ts`
  Browser test configuration
- `qa/e2e/*.spec.ts`
  Playwright E2E, UI, and live-site checks
- `qa/test-plan.md`
  Manual cases that cannot be fully automated
- `tests/shared/*.test.ts`
  Unit tests for randomness, bid validation, dice counting, engine behavior, and AI
- `tests/server/*.test.ts`
  Integration, stress, edge-case, and security/integrity tests
- `tests/frontend/*.test.ts`
  Frontend utility and wrapper tests

## Prerequisites

- Node.js 18+
- npm

## Install

From the repo root:

```bash
npm install
```

If you want Playwright to use bundled browsers:

```bash
npx playwright install chromium
```

If you prefer an already installed browser, set a channel:

PowerShell:

```powershell
$env:PW_BROWSER_CHANNEL = "chrome"
```

Bash:

```bash
export PW_BROWSER_CHANNEL=chrome
```

## Base URL

The E2E suite defaults to the live production site:

- `https://dudodice.com`

Override it with `BASE_URL` when needed.

PowerShell:

```powershell
$env:BASE_URL = "https://dudodice.com"
```

Bash:

```bash
export BASE_URL="https://dudodice.com"
```

## Commands

Run all unit/integration coverage:

```bash
npm run qa:unit
```

Run browser E2E/UI coverage:

```bash
npm run qa:e2e
```

Run browser E2E/UI coverage in headed mode:

```bash
npm run qa:e2e:headed
```

Run the full QA suite:

```bash
npm run qa:all
```

Open the Playwright HTML report:

```bash
npm run qa:report
```

## Coverage Map

### Unit / Logic

- dice randomness sanity checks
- bid validation rules
- dice counting
- game engine round transitions
- AI behavior

### Functional E2E

- landing page to local game
- deterministic bid placement flow
- deterministic `Calza` win flow
- deterministic `Dudo` loss flow
- online create/join/start flow across two browser players

### UI / UX

- landing-page asset loading
- viewport overflow checks
- mobile action-button tap target sizing
- game-board rendering smoke checks

### Edge Cases

- illegal bid attempts
- disconnect and AI takeover behavior
- empty room cleanup
- simultaneous multi-player joins

### Security / Integrity

- sanitized multiplayer state hides other players' dice in server payloads
- browser-facing game-state payloads only reveal the requesting player's dice

## Notes

- The Playwright suite creates isolated rooms with unique names and codes.
- The production E2E suite is designed to be low-impact, but it still creates real rooms and game sessions.
- Some responsive tests may surface genuine live-site issues rather than runner problems. Treat failures as defects until proven otherwise.
