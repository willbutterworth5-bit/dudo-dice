# Manual Test Plan

These cases are important but are not fully reliable to automate in a black-box browser suite.

## 1. DevTools Peeking Attempt

Goal:

- Verify a real player cannot discover opponent dice by exploring browser console state, React internals, or network payloads during a live online match.

Manual steps:

1. Open two separate browser profiles and join the same online room.
2. Start a game.
3. In Player A's browser, inspect:
   - DevTools console
   - `localStorage`
   - `sessionStorage`
   - visible websocket/network frames
4. Confirm opponent dice values are not available in plaintext anywhere accessible to Player A.

Pass criteria:

- Only Player A's own dice are visible to Player A.

## 2. Mobile Visual Review On Real Devices

Goal:

- Validate the board and controls on physical iPhone and Android devices, including browser chrome, safe areas, and touch ergonomics.

Manual steps:

1. Load the landing page.
2. Load a local game board.
3. Load an online waiting room and in-game board.
4. Rotate portrait/landscape.
5. Check:
   - clipped headers
   - overlap with notches
   - horizontal scrolling
   - off-screen dice/buttons

Pass criteria:

- No clipping, overlap, or unusable controls.

## 3. Animation Smoothness

Goal:

- Confirm dice roll, reveal, challenge, and modal animations feel smooth and readable on low- and mid-range hardware.

Manual steps:

1. Start multiple local games.
2. Trigger bid reveal, `Dudo`, and `Calza`.
3. Test on desktop and mobile devices.

Pass criteria:

- Animations complete without jank, flicker, or unreadable transitions.

## 4. Long-Running Reconnect Window

Goal:

- Validate reconnect behavior over the full grace period with real network loss.

Manual steps:

1. Start an online game with two players.
2. Disconnect one player by disabling Wi-Fi/network.
3. Reconnect before the grace period expires.
4. Repeat and reconnect after the grace period expires.

Pass criteria:

- Before grace expiry: player resumes correctly.
- After grace expiry: AI takeover happens and game remains consistent.

## 5. Cross-Browser Clipboard Experience

Goal:

- Confirm room-code copy behavior works on real browsers with real permission prompts.

Manual steps:

1. Create a room.
2. Click the room code.
3. Paste into another application.
4. Repeat on Chrome, Edge, Safari, and mobile browsers.

Pass criteria:

- Copied room code matches exactly, with no permission or UX regressions.

## 6. Multi-Tab Session Confusion

Goal:

- Confirm opening multiple tabs does not create confusing reconnect or duplicated session behavior.

Manual steps:

1. Open an online game in one tab.
2. Open the app in another tab from the same browser profile.
3. Try joining or reconnecting.

Pass criteria:

- Session behavior is understandable and does not leak control or state between tabs unexpectedly.

## 7. Real-World Load Observation

Goal:

- Observe room creation, join speed, and turn latency when several humans connect simultaneously.

Manual steps:

1. Join the same room with multiple real clients.
2. Start the game.
3. Play multiple rounds.

Pass criteria:

- Acceptable latency and no dropped turns, missing updates, or duplicated state changes.
