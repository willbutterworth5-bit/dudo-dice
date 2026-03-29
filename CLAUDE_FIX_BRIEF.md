# Dudo Dice Fix Brief

Use this file as the handoff brief for fixing the current codebase issues.

## Goal

Bring the repo to a clean `strict` verification state by fixing the frontend lint failures without breaking the currently passing automated test and build pipeline.

## Workspace

- Repo root: `C:\Users\willb\Dudo Dice`
- Main verification command: `npm run verify`
- Strict verification command: `npm run verify:strict`

## Current Status

### Passing now

The current automated regression suite is green:

- `npm run verify` passes
- `npm run test` passes
- `npm run typecheck:shared` passes
- `npm run build:server` passes
- `npm run build:frontend` passes

Current automated test coverage includes:

- Shared Perudo rules and bidding logic
- Dice counting behavior
- Core game engine state transitions
- AI bidding/challenge behavior
- Frontend probability helpers
- Frontend profile storage behavior
- Frontend local game engine wrapper behavior
- Room and room-manager server behavior
- Socket.IO integration for health, room creation, join, quick match, and game start

Relevant test files:

- `tests/shared/bid-validator.test.ts`
- `tests/shared/dice-counter.test.ts`
- `tests/shared/game-engine.test.ts`
- `tests/shared/ai-player.test.ts`
- `tests/frontend/probability.test.ts`
- `tests/frontend/profile-storage.test.ts`
- `tests/frontend/game-engine-wrapper.test.ts`
- `tests/server/room-manager.test.ts`
- `tests/server/room.test.ts`
- `tests/server/socket-integration.test.ts`

### Failing now

`npm run lint:frontend` fails with 14 errors and 5 warnings.

## Exact Lint Failures

### `frontend/src/components/GameBoard.tsx`

Errors:

- Line 139: `Unexpected any. Specify a different type`
- Line 140: `Unexpected any. Specify a different type`
- Line 169: `Unexpected any. Specify a different type`
- Line 174: `Unexpected any. Specify a different type`
- Line 174: `Unexpected any. Specify a different type`
- Line 188: `Unexpected any. Specify a different type`
- Line 721: `Unexpected constant condition`

Warnings:

- Line 307: `React Hook useEffect has missing dependencies: 'analysisEnabled' and 'trackTimeout'`
- Line 337: `React Hook useEffect has missing dependencies: 'gameState' and 'trackTimeout'`
- Line 349: `React Hook useEffect has a missing dependency: 'multiplayerMode'`
- Line 449: `React Hook useEffect has missing dependencies: 'gameState' and 'localCallCalza'`

### `frontend/src/components/GameLogPanel.tsx`

Errors:

- Line 78: `Unexpected any. Specify a different type`

### `frontend/src/components/PalificoInfoModal.tsx`

Errors:

- Line 6: `'_lockedFaceValue' is defined but never used`

### `frontend/src/context/GameContext.tsx`

Warnings:

- Line 82: `Fast refresh only works when a file only exports components`

### `frontend/src/hooks/useMultiplayerConnection.ts`

Errors:

- Line 107: `'_data' is defined but never used`
- Line 130: `'_data' is defined but never used`
- Line 138: `'_data' is defined but never used`
- Line 142: `'_data' is defined but never used`
- Line 146: `'_data' is defined but never used`

## What To Fix

### Required

1. Fix all frontend ESLint errors.
2. Resolve the current frontend ESLint warnings if possible without introducing behavioral regressions.
3. Keep `npm run verify` passing.
4. Make `npm run verify:strict` pass.

### Constraints

1. Do not remove or weaken the automated tests unless absolutely necessary.
2. Do not disable lint rules globally as a shortcut.
3. Prefer proper typing over `any`.
4. Preserve current game behavior unless a clear bug is discovered.
5. Be careful around in-progress frontend behavior, especially:
   - multiplayer turn flow
   - round transitions
   - calza/dudo actions
   - analysis-related logic in `GameBoard.tsx`

## Suggested Fix Strategy

### 1. `GameBoard.tsx`

Focus areas:

- Replace `any` with proper domain types from shared/frontend game state models.
- Review the constant-condition branch around line 721 and rewrite it so the intent is explicit.
- Audit each `useEffect` dependency warning carefully.
- If a dependency is intentionally excluded, refactor the code so the dependency is stable rather than suppressing the lint rule.

### 2. `GameLogPanel.tsx`

- Replace the `any` at line 78 with the appropriate log entry or round-history type.

### 3. `PalificoInfoModal.tsx`

- Remove the unused parameter or rename/refactor the component props so all inputs are meaningful.

### 4. `GameContext.tsx`

- Split non-component exports into a separate file if needed so React refresh rules are satisfied.

### 5. `useMultiplayerConnection.ts`

- Remove unused event payload parameters or use them meaningfully.
- Keep socket behavior unchanged unless clearly necessary.

## Validation Checklist

After fixes, run:

```bash
npm run lint:frontend
npm run test
npm run verify
npm run verify:strict
```

Expected result:

- All commands pass
- No new failing tests
- No TypeScript/build regressions

## Helpful Repo Files

- `package.json`
- `frontend/.eslintrc.cjs`
- `frontend/src/components/GameBoard.tsx`
- `frontend/src/components/GameLogPanel.tsx`
- `frontend/src/components/PalificoInfoModal.tsx`
- `frontend/src/context/GameContext.tsx`
- `frontend/src/hooks/useMultiplayerConnection.ts`
- `shared/src/GameState.ts`
- `shared/src/GameEngine.ts`

## Summary For Claude

This repo already has a working automated test suite and a passing non-lint verification flow. The remaining task is to fix the current frontend lint debt cleanly so the strict verification command passes:

```bash
npm run verify:strict
```

Please make the smallest safe set of changes needed to:

- eliminate the current lint failures and warnings
- preserve existing behavior
- keep the tests and builds passing
