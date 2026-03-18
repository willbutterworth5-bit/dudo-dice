# Dudo Dice - Perudo Game

A modern web-based implementation of Perudo (also known as Liar's Dice), where you can play against AI opponents.

## Features

- **Classic Perudo Gameplay**: Full implementation of Perudo rules including:
  - Standard bidding and challenging mechanics
  - Special ones bidding rules (half quantity when bidding ones, double when bidding back)
  - Palifico rule (one-die start locks face value, ones not wild)
  
- **AI Opponents**: Play against 1-5 computer opponents with intelligent decision-making

- **Beautiful UI**: 
  - Light and colorful theme
  - Distinct colored dice for each player (red, green, blue, yellow, orange, black)
  - Smooth animations and transitions
  - Responsive design for desktop and mobile

- **Game Features**:
  - Adjustable player count (2-6 players, default 6)
  - 3-second delay between AI moves for better UX
  - Visual feedback during turns
  - Comprehensive rules display
  - Game log showing round history

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Game Rules

### Basic Gameplay

- Each player starts with 5 dice (hidden from others)
- Players take turns making bids: "X dice showing face value Y"
- Ones (1s) are wild and count as any face value (except in Palifico mode)
- You can either raise the bid or challenge the previous bid
- If challenged, all dice are revealed and counted
- The loser of a challenge loses one die
- Last player with dice wins

### Special Ones Bidding Rules

- **Bidding with ones**: When bidding ones (face value = 1), the quantity can be half the current bid, rounded up.
  - Example: If current bid is "5 fours", you can bid "3 ones" (half of 5, rounded up)

- **Bidding back from ones**: When bidding back to a non-one value (2-6), the quantity must be doubled.
  - Example: If current bid is "3 ones", next bid must be at least "6 twos" (double of 3)

### Palifico Rule

When a player starts the bidding with **one die** (quantity = 1), Palifico mode is activated:
- All subsequent bids in that round must use the same face value as the initial bid
- Ones lose their wild status and are **NOT counted** (only exact matches count)
- Palifico mode lasts until the round ends (when a challenge occurs)

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Context API** for state management

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── game/            # Game logic and engine
│   ├── context/         # React Context for state
│   ├── utils/           # Utility functions
│   └── styles/          # CSS and theme
├── package.json
└── vite.config.ts
```

## Future Enhancements

- Online multiplayer support
- Different AI difficulty levels
- Sound effects
- More animations
- Statistics and game history

## License

This project is open source and available for personal use.
