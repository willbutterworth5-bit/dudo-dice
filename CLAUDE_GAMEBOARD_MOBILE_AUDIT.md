# Claude Brief: Mobile Game Board Audit And Fixes

Use this file as the handoff brief for investigating and fixing mobile layout issues in the Dudo Dice game board.

## Goal

Improve the mobile layout and responsiveness of the in-game board, with special attention to overflow, fixed-position UI crowding, and touch usability.

## Live Context

The production site is:

- `https://dudodice.com`

The landing screen was checked live at phone-sized widths and already shows a real mobile issue:

- the `Dudo Dice` title/header gets clipped on the right on common portrait phone widths

The deeper game-board review below is source-backed. Full live browser automation into the production board was attempted but could not be completed on this machine because headless Chrome/Edge exited before exposing a stable remote debug port.

## Main Task

Review and fix the mobile responsiveness of:

- `frontend/src/components/GameBoard.tsx`

Related components worth checking:

- `frontend/src/components/BidInput.tsx`
- `frontend/src/components/GameLogPanel.tsx`
- `frontend/src/components/RoundResultModal.tsx`
- `frontend/src/components/GameOverModal.tsx`

## High-Risk Findings

### 1. Horizontal scrolling is explicitly allowed on the game screen

File:

- `frontend/src/components/GameBoard.tsx`

Relevant code:

- line 629: root container uses `overflowX: 'auto'`

Why this matters:

- On mobile, board overflow may become sideways scrolling instead of being properly contained or reflowed.
- This is usually a sign the board is not truly responsive.

### 2. The board uses a fixed 450x450 internal layout and relies on CSS transform scaling

File:

- `frontend/src/components/GameBoard.tsx`

Relevant code:

- lines 89-110: board sizing logic
- line 664: wrapper height is based on `boardSize`
- line 667: actual board still renders at fixed `450px x 450px`

Why this matters:

- The component reserves one amount of layout space but visually renders another via `transform: scale(...)`.
- CSS transforms do not affect normal document flow.
- On shorter mobile screens, the visual board can become larger than the space the page thinks it occupies.
- This can cause overlap with controls below or above the board.

### 3. Minimum board scale can exceed the allocated layout height on short screens

File:

- `frontend/src/components/GameBoard.tsx`

Relevant code:

- line 97: `boardSize` can shrink based on width/height
- line 110: `boardScale = Math.max(0.55, boardSize / BOARD_BASE)`

Why this matters:

- If `boardSize / 450` falls below `0.55`, the visual board still uses `0.55`.
- That means the board can render larger than the reserved height.
- This is especially risky on landscape phones, short-height devices, browser UI-expanded states, or split-screen.

### 4. Fixed top-left and top-right controls may crowd narrow screens and ignore safe areas

File:

- `frontend/src/components/GameBoard.tsx`

Relevant code:

- lines 632-638: fixed back button
- lines 641-660: fixed top-right control cluster

Why this matters:

- On mobile devices with notches or limited horizontal space, fixed controls can crowd each other or sit awkwardly near system UI.
- There is no obvious safe-area handling.

## Medium-Risk Findings

### 5. Dice are positioned with fixed pixel radii and visible overflow

File:

- `frontend/src/components/GameBoard.tsx`

Relevant code:

- lines 922-1033

Why this matters:

- Dice are placed around the board edge using fixed radii and absolute positioning.
- This helps preserve the board aesthetic, but it increases the chance that dice or reveal effects extend outside the intended mobile frame.

### 6. Center circle is fixed-size

File:

- `frontend/src/components/GameBoard.tsx`

Relevant code:

- lines 1045-1059

Why this matters:

- The center display remains `140x140` / `120x120` regardless of viewport width.
- On smaller phones, this may dominate the play area and reduce usable space for surrounding board content.

### 7. Action buttons in the bid input stay in a single row

File:

- `frontend/src/components/BidInput.tsx`

Relevant code:

- lines 203-229

Why this matters:

- `Bid`, `Dudo`, and optional `Calza` all remain on one row.
- This may become cramped at small widths or with larger text scaling/accessibility settings.

### 8. Game log drawer has a fixed width

File:

- `frontend/src/components/GameLogPanel.tsx`

Relevant code:

- line 113: width is fixed to `260px`

Why this matters:

- Likely okay on many phones, but very dominant on narrow screens.
- Worth checking for balance and readability.

## Areas That Already Look Reasonable

### Bid input stacks on small screens

File:

- `frontend/src/components/BidInput.tsx`

Relevant code:

- line 113: main control area uses `flex-col sm:flex-row`

Why this is good:

- Face value and quantity sections already move into a vertical layout on small screens.

### Round result modal looks mobile-friendly

File:

- `frontend/src/components/RoundResultModal.tsx`

Relevant code:

- line 45: `max-w-xs w-full mx-4`

Why this is good:

- Modal width is constrained and padded from screen edges.

### Game over modal likely fits phones

File:

- `frontend/src/components/GameOverModal.tsx`

Relevant code:

- line 22: `max-w-md w-full mx-4`
- line 38: buttons can wrap

Why this is good:

- Modal structure is more forgiving on mobile than the board layout.

## What Claude Should Do

### Primary objective

Refactor the game-board layout so it behaves like a truly responsive mobile screen, not a fixed desktop board scaled down visually.

### Suggested approach

1. Remove the need for horizontal scrolling on the game board screen.
2. Rework board sizing so the visual board dimensions and the reserved layout space match.
3. Audit top fixed controls for narrow widths and safe-area spacing.
4. Check whether the central circle, outer dice ring, and bid markers need responsive sizing.
5. Consider stacking or reflowing action buttons in `BidInput.tsx` at smaller widths.
6. Verify that modals and side panels still behave well after board/layout changes.

## Acceptance Criteria

The fix should aim for:

1. No horizontal scrolling on the main game board on common portrait phone widths.
2. No clipping of key board UI on typical mobile sizes such as:
   - `390x844`
   - `360x800`
   - a narrower small-phone width around `320px`
3. Top controls remain usable and do not collide or feel crowded.
4. Bid input remains tappable and readable.
5. The board remains centered and visually coherent.
6. No regressions to existing tests/build.

## Validation Commands

Run after changes:

```bash
npm run test
npm run verify
```

If frontend lint debt has also been fixed:

```bash
npm run verify:strict
```

## Useful Files

- `frontend/src/components/GameBoard.tsx`
- `frontend/src/components/BidInput.tsx`
- `frontend/src/components/GameLogPanel.tsx`
- `frontend/src/components/RoundResultModal.tsx`
- `frontend/src/components/GameOverModal.tsx`
- `frontend/src/App.tsx`

## Short Summary For Claude

The mobile landing screen already visibly clips the site title in production, and the game board code is structurally fragile on mobile because it uses:

- horizontal-scroll fallback
- a fixed `450x450` board
- CSS transform scaling instead of true responsive layout
- fixed-position top controls without obvious safe-area handling

Please make the board genuinely responsive on mobile while preserving the current gameplay UI and keeping `npm run verify` passing.
