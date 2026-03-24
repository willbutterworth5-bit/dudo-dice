import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameContext } from '../context/GameContext';
import { AIPlayer, Difficulty } from '../game/AIPlayer';
import { Bid, GameSettings, GameState, RoundResult, PLAYER_COLOR_MAP } from '../game/GameState';
import { ProfileStorage } from '../utils/profileStorage';
import DiceFace from './DiceFace';
import BidInput from './BidInput';
import GameOverModal from './GameOverModal';
import RoundResultModal from './RoundResultModal';
import PalificoInfoModal from './PalificoInfoModal';
import GameLogPanel from './GameLogPanel';
import RoundAnalysisModal from './RoundAnalysisModal';
import GameAnalysisModal from './GameAnalysisModal';
import type { RoomPlayerInfo } from '../hooks/useMultiplayerConnection';

export interface MultiplayerMode {
  sessionId: string;
  gameState: GameState;
  turnTimeRemaining: number;
  roundResult: RoundResult | null;
  winnerId: string | null;
  isReconnecting: boolean;
  roomPlayers: RoomPlayerInfo[];
  onMakeBid: (quantity: number, faceValue: number) => void;
  onChallenge: () => void;
  onCalza: () => void;
}

interface GameBoardProps {
  playerCount: number;
  difficulty: Difficulty;
  startingDice: number;
  analysisEnabled: boolean;
  palificoEnabled: boolean;
  calzaEnabled: boolean;
  onBackToHome: () => void;
  multiplayerMode?: MultiplayerMode;
}

/** Darken a hex colour by subtracting `amount` from each RGB channel. */
function darkenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function GameBoard({ playerCount, difficulty, startingDice, analysisEnabled, palificoEnabled, calzaEnabled, onBackToHome, multiplayerMode }: GameBoardProps) {
  const isMultiplayer = !!multiplayerMode;
  const { gameEngine, gameState: localGameState, initializeGame, makeBid: localMakeBid, challengeBid: localChallengeBid, callCalza: localCallCalza, updateGameState } = useGameContext();
  const [aiPlayer, setAiPlayer] = useState(() => new AIPlayer(difficulty));

  // In multiplayer mode, use server-provided state; in local mode, use context state
  const gameState = isMultiplayer ? multiplayerMode.gameState : localGameState;

  // Update AI player difficulty if it changes (local mode only)
  useEffect(() => {
    if (!isMultiplayer) {
      setAiPlayer(new AIPlayer(difficulty));
    }
  }, [difficulty, isMultiplayer]);
  const [showDice, setShowDice] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [showPalificoInfo, setShowPalificoInfo] = useState(false);
  const [bidAnimationKey, setBidAnimationKey] = useState(0);
  const [revealState, setRevealState] = useState<{
    playerIndex: number;
    dieIndex: number;
    revealed: { [playerId: string]: number[] };
    matchingDice?: { [playerId: string]: number[] };
  } | null>(null);
  const [revealComplete, setRevealComplete] = useState(false);
  const [diceThrowing, setDiceThrowing] = useState(false);
  const [previousRoundNumber, setPreviousRoundNumber] = useState(0);
  const [isTallying, setIsTallying] = useState(false);
  const [innerCircleChallenge, setInnerCircleChallenge] = useState(false);
  const [challengedBidPlayerId, setChallengedBidPlayerId] = useState<string | null>(null);
  const aiTurnInProgress = useRef(false);
  const [showGameLog, setShowGameLog] = useState(false);
  const [showRoundAnalysis, setShowRoundAnalysis] = useState(false);
  const [showGameAnalysis, setShowGameAnalysis] = useState(false);
  const [dudoFadingOut, setDudoFadingOut] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [isCalzaRound, setIsCalzaRound] = useState(false);

  // Sequential reveal function - defined early to avoid hoisting issues
  const startSequentialReveal = useCallback((result: RoundResult, state: GameState, onComplete?: () => void) => {
    if (!result || !result.allDice) {
      if (onComplete) onComplete();
      return;
    }

    const revealed: { [key: string]: number[] } = {};
    const matchingDice: { [key: string]: number[] } = {};

    // Mirror the sector mapping from the render — local player always at sector 3 (bottom)
    const humanIdxInner = isMultiplayer
      ? state.players.findIndex((p: any) => p.id === multiplayerMode?.sessionId)
      : state.players.findIndex((p: any) => p.isHuman);
    const playerCountInner = state.players.length;
    const sectorToPlayerIdxInner: (number | null)[] = [null, null, null, humanIdxInner, null, null];
    for (let i = 0; i < Math.min(humanIdxInner, 3); i++) {
      sectorToPlayerIdxInner[2 - i] = ((humanIdxInner - 1 - i) + playerCountInner) % playerCountInner;
    }
    for (let i = 0; i < Math.min(playerCountInner - 1 - humanIdxInner, 2); i++) {
      sectorToPlayerIdxInner[4 + i] = humanIdxInner + 1 + i;
    }
    const sectorPlayers = sectorToPlayerIdxInner.map((idx: number | null) =>
      idx !== null ? state.players[idx] : null
    );

    // Build the reveal order by walking sectors clockwise starting from sector 4
    // (the sector immediately to the human's left), going 4→5→0→1→2→3.
    // Within each sector, dice are in value-sorted order (ascending), which
    // matches exactly how they are visually positioned on the board.
    const clockwiseSectors = [4, 5, 0, 1, 2, 3];
    const orderedDicePositions: Array<{
      playerId: string;
      playerSectorIdx: number;
      originalDieIdx: number;
      dieValue: number;
    }> = [];

    for (const sectorIdx of clockwiseSectors) {
      const player = sectorPlayers[sectorIdx];
      if (!player) continue;

      const playerDiceEntry = result.allDice.find((d: any) => d.playerId === player.id);
      if (!playerDiceEntry || !playerDiceEntry.dice || playerDiceEntry.dice.length === 0) continue;

      const diceWithIndices = playerDiceEntry.dice
        .map((value: number, originalIdx: number) => ({ value, originalIdx }))
        .sort((a: any, b: any) => a.value - b.value);

      for (const diceItem of diceWithIndices) {
        orderedDicePositions.push({
          playerId: player.id,
          playerSectorIdx: sectorIdx,
          originalDieIdx: diceItem.originalIdx,
          dieValue: diceItem.value,
        });
      }
    }

    // Determine palifico mode from the bid history of this round (not the new round's state,
    // which has already reset). Ones are only wild when palifico was NOT active.
    const wasPalificoRound = (result.bids[0] as any)?.palificoMode ?? false;

    setRevealState({
      playerIndex: 0,
      dieIndex: 0,
      revealed,
      matchingDice: {}, // pre-initialize so key starts at "found-0", avoiding spurious animation
    });

    // Recursive function to reveal dice sequentially clockwise
    const revealNextDie = (
      diePositionIdx: number,
      currentRevealed: { [key: string]: number[] },
      currentMatching: { [key: string]: number[] }
    ) => {
      try {
        if (diePositionIdx >= orderedDicePositions.length) {
          // All dice revealed — keep matching dice highlighted
          setRevealState({
            playerIndex: 0,
            dieIndex: 0,
            revealed: currentRevealed,
            matchingDice: currentMatching,
          });
          setTimeout(() => {
            setRevealComplete(true);
            if (onComplete) onComplete();
          }, 300);
          return;
        }

        const diePos = orderedDicePositions[diePositionIdx];
        const playerId = diePos.playerId;

        if (!currentRevealed[playerId]) currentRevealed[playerId] = [];
        if (!currentMatching[playerId]) currentMatching[playerId] = [];

        // Reveal this die
        currentRevealed[playerId] = [...currentRevealed[playerId], diePos.originalDieIdx];

        // Check if this die matches the bid
        const bidFaceValue = result.challengedBid?.faceValue;
        const matches = bidFaceValue
          ? (wasPalificoRound
              ? diePos.dieValue === bidFaceValue
              : diePos.dieValue === bidFaceValue || diePos.dieValue === 1)
          : false;

        if (matches) {
          currentMatching[playerId] = [...currentMatching[playerId], diePos.originalDieIdx];
        }

        setRevealState({
          playerIndex: diePos.playerSectorIdx,
          dieIndex: diePos.originalDieIdx,
          revealed: { ...currentRevealed },
          matchingDice: { ...currentMatching },
        });

        setTimeout(() => {
          revealNextDie(diePositionIdx + 1, currentRevealed, currentMatching);
        }, 450);
      } catch (error) {
        console.error('Error in reveal:', error);
        setRevealState(null);
      }
    };

    // Start revealing first die after a short initial delay
    setTimeout(() => {
      revealNextDie(0, revealed, matchingDice);
    }, 200);
  }, [isMultiplayer, multiplayerMode?.sessionId]);

  // Shared challenge animation sequence used by both AI and human challenges
  const startChallengeAnimation = useCallback((result: RoundResult, state: GameState, isCalza = false) => {
    setChallengedBidPlayerId(result.bidderId); // Track the player being called out
    setRevealState(null);
    setRevealComplete(false);
    setShowDice(false);
    setLastRoundResult(result);
    setInnerCircleChallenge(true);
    setIsCalzaRound(isCalza);
    setIsTallying(false);

    // Brief dramatic pause: flash the challenge moment, then crossfade into the reveal.
    setTimeout(() => {
      // Begin crossfade: fade out DUDO/CALZA text before switching to the Found counter
      setDudoFadingOut(true);
      setTimeout(() => {
        setInnerCircleChallenge(false);
        setDudoFadingOut(false);
        startSequentialReveal(result, state, () => setShowDice(true));
      }, 300);
    }, 1200);
  }, [startSequentialReveal]);

  // Initialize game on mount (local mode only)
  useEffect(() => {
    if (isMultiplayer) return; // Server handles initialization in multiplayer
    const settings: GameSettings = {
      playerCount,
      startingDice,
      analysisEnabled,
      palificoEnabled,
      calzaEnabled,
    };
    initializeGame(settings);
    // Trigger dice throw animation on initial game start
    setDiceThrowing(true);
    setTimeout(() => setDiceThrowing(false), 800);
  }, [playerCount, startingDice, palificoEnabled, calzaEnabled, initializeGame, isMultiplayer]);

  // Initialize previousRoundNumber when gameState first becomes available
  useEffect(() => {
    if (gameState && previousRoundNumber === 0) {
      setPreviousRoundNumber(gameState.roundNumber);
    }
  }, [gameState, previousRoundNumber]);

  // Detect new round and trigger dice throw animation
  useEffect(() => {
    if (!gameState) return;
    
    // Check if round number changed (new round started)
    // Allow it to trigger even if previousRoundNumber is 0 (first round after initialization)
    if (gameState.roundNumber > previousRoundNumber) {
      setDiceThrowing(true);
      setTimeout(() => {
        setDiceThrowing(false);
      }, 800); // Match animation duration
      setIsTallying(false);
      setInnerCircleChallenge(false);
      setChallengedBidPlayerId(null);
    }
    
    // Update previous round number after checking
    if (gameState.roundNumber !== previousRoundNumber) {
      setPreviousRoundNumber(gameState.roundNumber);
    }
  }, [gameState?.roundNumber, previousRoundNumber]);

  // Handle multiplayer round results — trigger reveal animation
  const prevMpRoundResult = useRef<RoundResult | null>(null);
  useEffect(() => {
    if (!isMultiplayer || !multiplayerMode || !gameState) return;
    const result = multiplayerMode.roundResult;
    if (result && result !== prevMpRoundResult.current) {
      prevMpRoundResult.current = result;
      const isCalza = result.challengeType === 'calza';
      startChallengeAnimation(result, gameState, isCalza);
    }
  }, [multiplayerMode?.roundResult, isMultiplayer, gameState, startChallengeAnimation]);

  // Handle AI turns (local mode only — in multiplayer, server handles AI)
  useEffect(() => {
    if (isMultiplayer) return;
    if (!gameState || !gameEngine) return;
    if (gameState.gamePhase === 'gameOver') return;
    if (aiTurnInProgress.current) return;
    // Don't run AI turns if we're showing a round result, tallying, or during challenge sequence
    if (lastRoundResult && showDice) return;
    if (isTallying || innerCircleChallenge) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;

      // AI turn - add delay (2.5 seconds, no countdown)
      const handleAITurn = async () => {
        try {
          aiTurnInProgress.current = true;

          // Wait 1.2–2.2 seconds (randomised to feel less robotic)
          await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1000));

          // Get fresh state after delay
          const freshState = gameEngine.getState();
          const freshPlayer = freshState.players[freshState.currentPlayerIndex];
          
          if (!freshPlayer || freshPlayer.isHuman || freshState.gamePhase === 'gameOver') {
            aiTurnInProgress.current = false;
            return;
          }

          const decision = aiPlayer.makeDecision(freshState, freshPlayer);

          if (decision === 'challenge') {
            const result = localChallengeBid(freshPlayer.id);
            aiTurnInProgress.current = false;
            if (result) {
              updateGameState();
              const humanPlayer = freshState.players.find(p => p.isHuman);
              if (humanPlayer && result.bidderId === humanPlayer.id) {
                ProfileStorage.recordCalledAgainst(result.winnerId === result.challengerId);
              }
              startChallengeAnimation(result, freshState, false);
            }
          } else if (decision === 'calza') {
            const result = localCallCalza(freshPlayer.id);
            aiTurnInProgress.current = false;
            if (result) {
              updateGameState();
              startChallengeAnimation(result, freshState, true);
            }
          } else {
            const bid = aiPlayer.generateBid(freshState, freshPlayer);
            if (bid) {
              const result = await localMakeBid(bid);
              aiTurnInProgress.current = false;
              if (result.success) {
                updateGameState();
                setBidAnimationKey(prev => prev + 1);
              }
            } else {
              // Can't generate valid bid, challenge instead
              const result = localChallengeBid(freshPlayer.id);
              aiTurnInProgress.current = false;
              if (result) {
                updateGameState();
                const humanPlayer = freshState.players.find(p => p.isHuman);
                if (humanPlayer && result.bidderId === humanPlayer.id) {
                  ProfileStorage.recordCalledAgainst(result.winnerId === result.challengerId);
                }
                startChallengeAnimation(result, freshState);
              }
            }
          }
        } catch (error) {
          console.error('Error in AI turn:', error);
          aiTurnInProgress.current = false;
        }
      };

    handleAITurn();
  }, [gameState?.currentPlayerIndex, gameState?.gamePhase, gameEngine, aiPlayer, localMakeBid, localChallengeBid, startChallengeAnimation, lastRoundResult, showDice, updateGameState, isTallying, innerCircleChallenge, isMultiplayer]);

  const handleHumanBid = useCallback(async (bid: Bid) => {
    if (isMultiplayer && multiplayerMode) {
      multiplayerMode.onMakeBid(bid.quantity, bid.faceValue);
      setBidAnimationKey(prev => prev + 1);
      return;
    }

    if (!gameEngine || !gameState) return;

    const latestState = gameEngine.getState();
    const currentPlayer = latestState.players[latestState.currentPlayerIndex];

    if (!currentPlayer || !currentPlayer.isHuman) return;

    const updatedBid: Bid = {
      ...bid,
      playerId: currentPlayer.id,
    };

    const result = await localMakeBid(updatedBid);
    if (result.success) {
      setBidAnimationKey(prev => prev + 1);
    }
  }, [gameEngine, gameState, localMakeBid, isMultiplayer, multiplayerMode]);

  const handleHumanChallenge = useCallback(() => {
    if (isMultiplayer && multiplayerMode) {
      multiplayerMode.onChallenge();
      return;
    }

    if (!gameEngine || !gameState) return;

    const latestState = gameEngine.getState();
    const currentPlayer = latestState.players[latestState.currentPlayerIndex];

    if (!currentPlayer || !currentPlayer.isHuman) return;
    if (!latestState.currentBid) return;

    try {
      const result = localChallengeBid(currentPlayer.id);
      if (result) {
        updateGameState();
        const freshState = gameEngine.getState();
        ProfileStorage.recordDudoCall(result.winnerId === result.challengerId);
        startChallengeAnimation(result, freshState, false);
      }
    } catch (error) {
      console.error('Error challenging bid:', error);
    }
  }, [gameEngine, gameState, localChallengeBid, startChallengeAnimation, updateGameState, isMultiplayer, multiplayerMode]);

  const handleHumanCalza = useCallback(() => {
    if (isMultiplayer && multiplayerMode) {
      multiplayerMode.onCalza();
      return;
    }

    if (!gameEngine || !gameState) return;

    const latestState = gameEngine.getState();
    const currentPlayer = latestState.players[latestState.currentPlayerIndex];

    if (!currentPlayer || !currentPlayer.isHuman) return;
    if (!latestState.currentBid) return;

    try {
      const result = localCallCalza(currentPlayer.id);
      if (result) {
        updateGameState();
        const freshState = gameEngine.getState();
        startChallengeAnimation(result, freshState, true);
      }
    } catch (error) {
      console.error('Error calling calza:', error);
    }
  }, [gameEngine, gameState, localCallCalza, startChallengeAnimation, updateGameState, isMultiplayer, multiplayerMode]);

  if (!gameState || (!isMultiplayer && !gameEngine)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-text-primary">Loading game...</div>
      </div>
    );
  }

  if (!gameState.players || gameState.players.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-text-primary">Initializing players...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-text-primary">Setting up game...</div>
      </div>
    );
  }

  const winner = isMultiplayer
    ? (multiplayerMode?.winnerId ? gameState.players.find(p => p.id === multiplayerMode.winnerId) ?? null : null)
    : gameEngine?.getWinner() ?? null;

  // Calculate total dice
  const totalDice = gameState.players.reduce((sum, p) => sum + p.diceCount, 0);
  
  // Calculate current matching dice count during reveal
  const currentMatchingCount = revealState?.matchingDice
    ? Object.values(revealState.matchingDice).reduce((sum, diceIndices) => sum + diceIndices.length, 0)
    : 0;

  // Calculate positions around circle - 6 equal sectors of 60 degrees each
  // Human player always at bottom center (90 degrees = sector 3)
  // To center sector 3 at 90 degrees (bottom), it should span from 60 to 120 degrees
  // So sector 3 starts at 60 degrees
  // For even distribution: 0: -120, 1: -60, 2: 0, 3: 60 (bottom center), 4: 120, 5: -180 (or 180)
  const sectorAngles = [-120, -60, 0, 60, 120, 180]; // 6 sectors, 60 degrees apart, sector 3 centered at bottom (90 degrees)
  
  // Always put human at sector 3 (bottom); distribute others in array order around it.
  // Works correctly for 2–6 players. For 4–6 players produces same result as before.
  // In multiplayer: "me" is the player matching my session ID (dice are visible)
  // In local: "me" is the player marked isHuman
  const humanIdx = isMultiplayer
    ? gameState.players.findIndex(p => p.id === multiplayerMode!.sessionId)
    : gameState.players.findIndex(p => p.isHuman);

  // Helper to check if a player is "me" (the local human player)
  const isMyPlayer = (playerId: string) => isMultiplayer
    ? playerId === multiplayerMode!.sessionId
    : gameState.players.find(p => p.id === playerId)?.isHuman ?? false;

  // Is it my turn?
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]
    ? isMyPlayer(gameState.players[gameState.currentPlayerIndex].id)
    : false;
  const numPlayers = gameState.players.length;
  const sectorToPlayerIdx: (number | null)[] = [null, null, null, humanIdx, null, null];
  // Fill sectors 0–2 with players that come before human in array order
  for (let i = 0; i < Math.min(humanIdx, 3); i++) {
    sectorToPlayerIdx[2 - i] = ((humanIdx - 1 - i) + numPlayers) % numPlayers;
  }
  // Fill sectors 4–5 with players that come after human in array order
  for (let i = 0; i < Math.min(numPlayers - 1 - humanIdx, 2); i++) {
    sectorToPlayerIdx[4 + i] = humanIdx + 1 + i;
  }
  const sectorPlayers = sectorToPlayerIdx.map(idx =>
    idx !== null ? gameState.players[idx] : null
  );
  // Visual sector of the current player — used for active line highlighting
  const currentPlayerSector = sectorToPlayerIdx.indexOf(gameState.currentPlayerIndex);

  // Current player's color — used to tint the center circle on their turn
  const currentPlayerColor = PLAYER_COLOR_MAP[currentPlayer.color] || '#FFFFFF';

  // Which sector the last bidder occupies — for displaying the bid in their inner segment
  const lastBidSectorIdx = gameState.currentBid
    ? sectorPlayers.findIndex(p => p?.id === gameState.currentBid!.playerId)
    : -1;
  const lastBidMidAngle = lastBidSectorIdx >= 0 ? sectorAngles[lastBidSectorIdx] + 30 : 0;
  const lastBidMidRad = (lastBidMidAngle * Math.PI) / 180;
  const innerRingMidR = 118; // midpoint of inner ring (radii 70–175)
  const lastBidX = Math.cos(lastBidMidRad) * innerRingMidR;
  const lastBidY = Math.sin(lastBidMidRad) * innerRingMidR;

  // Challenge overlay positions — bidder sector (challenged bid chip) + challenger sector (DUDO badge)
  // Challenge overlay positions — use radius 148 (outer part of inner ring, away from center circle)
  const challengeOverlayR = 148;
  const challengedSectorIdx = challengedBidPlayerId
    ? sectorPlayers.findIndex(p => p?.id === challengedBidPlayerId)
    : -1;
  const challengedMidRad = ((challengedSectorIdx >= 0 ? sectorAngles[challengedSectorIdx] : 0) + 30) * Math.PI / 180;
  const challengeBidChipX = Math.cos(challengedMidRad) * challengeOverlayR;
  const challengeBidChipY = Math.sin(challengedMidRad) * challengeOverlayR;


  return (
    <div className="min-h-screen relative" style={{ padding: '0.5rem', paddingTop: '3rem', minWidth: '0', overflowX: 'auto' }}>
      <div className="max-w-4xl mx-auto relative">
        {/* Player Color Legend - fixed left column, below back button */}
        <div className="fixed z-50 flex flex-col gap-1.5" style={{ left: '0.75rem', top: '3.75rem', width: '4rem' }}>
        {gameState.players.map((player, playerIdx) => {
          const color = PLAYER_COLOR_MAP[player.color] || '#6B7280';
          const isCurrentTurn = playerIdx === gameState.currentPlayerIndex && gameState.gamePhase === 'bidding' && !lastRoundResult && !showDice;
          return (
            <div key={player.id}>
              <div
                className="rounded-md px-1.5 py-0.5 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: color,
                  boxShadow: isCurrentTurn ? '0 0 0 2px white' : 'none',
                  transform: isCurrentTurn ? 'scale(1.08)' : 'scale(1)',
                  opacity: isCurrentTurn ? 1 : 0.6,
                }}
              >
                <span className="text-[10px] font-bold text-white text-center whitespace-nowrap">{player.name}</span>
              </div>
            </div>
          );
        })}
        </div>
        
        {/* Back button - fixed top left */}
        <button
          onClick={onBackToHome}
          className="fixed text-white text-sm font-semibold z-50 rounded-xl px-2 py-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900"
          style={{ left: '0.75rem', top: '0.75rem' }}
        >
          ← Back
        </button>

        {/* Dice count + Round + Palifico + Log - fixed top right, aligned with back button */}
        <div className="fixed z-50 flex items-center gap-1.5" style={{ right: '0.75rem', top: '0.75rem' }}>
          <div className="text-white px-2 py-1 rounded-xl flex items-center gap-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900">
            <span className="text-xs">🎲</span>
            <span className="font-bold text-sm">x{totalDice}</span>
          </div>
          {gameState.palificoMode.active && (
            <button
              onClick={() => setShowPalificoInfo(true)}
              className="text-white px-2 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md bg-gradient-to-br from-indigo-700 to-purple-900"
            >
              Palifico
            </button>
          )}
          <button
            onClick={() => setShowGameLog(v => !v)}
            className="text-white px-2 py-1 rounded-xl text-xs font-semibold shadow-md bg-gradient-to-br from-indigo-700 to-purple-900"
            title="Game Log"
          >
            📋
          </button>
        </div>

        {/* Redesigned Game Board - Segmented Circle */}
        <div className="relative w-full max-w-4xl mx-auto" style={{ height: '450px', marginTop: '0.5rem', overflow: 'visible' }}>
          {/* Table Container */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ overflow: 'visible', padding: '20px' }}>
            <div className="relative" style={{ width: '450px', height: '450px', overflow: 'visible', flexShrink: 0 }}>
              {/* Base Circle */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: '#F5F5F5',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E0E0E0',
                }}
              />
              
              {/* Player Sectors - Colored segments */}
              {sectorAngles.map((startAngle, sectorIdx) => {
                const player = sectorPlayers[sectorIdx];
                // During a dudo, suppress the current-player highlight so only the called player is shown
                const isCurrentPlayer = !challengedBidPlayerId && player && gameState.players.findIndex(p => p.id === player.id) === gameState.currentPlayerIndex;
                const isEliminated = player && player.diceCount === 0;
                // During dudo/tallying: use the captured bidder ID so the highlight stays locked
                const isLastBidder = challengedBidPlayerId
                  ? !!(player && player.id === challengedBidPlayerId)
                  : !!(player && gameState.currentBid && gameState.currentBid.playerId === player.id);
                const hexColor = player
                  ? (isEliminated ? '#9CA3AF' : (PLAYER_COLOR_MAP[player.color] || '#6B7280'))
                  : '#9CA3AF'; // Grey for empty sectors
                
                const endAngle = startAngle + 60; // 60 degrees per sector
                const innerRadius = 70; // Center circle radius
                const outerRadius = 225; // Table radius
                const ringRadius = 175; // Ring position (where inner and outer parts split)
                
                // Create SVG path for sector
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                // Inner part coordinates (70 to 175) - aligns with ring
                const x1 = Math.cos(startRad) * innerRadius;
                const y1 = Math.sin(startRad) * innerRadius;
                const x2 = Math.cos(startRad) * ringRadius;
                const y2 = Math.sin(startRad) * ringRadius;
                const x3 = Math.cos(endRad) * ringRadius;
                const y3 = Math.sin(endRad) * ringRadius;
                const x4 = Math.cos(endRad) * innerRadius;
                const y4 = Math.sin(endRad) * innerRadius;
                
                // Outer part coordinates (175 to 225) - starts at ring
                const x5 = Math.cos(startRad) * ringRadius;
                const y5 = Math.sin(startRad) * ringRadius;
                const x6 = Math.cos(startRad) * outerRadius;
                const y6 = Math.sin(startRad) * outerRadius;
                const x7 = Math.cos(endRad) * outerRadius;
                const y7 = Math.sin(endRad) * outerRadius;
                const x8 = Math.cos(endRad) * ringRadius;
                const y8 = Math.sin(endRad) * ringRadius;
                
                const largeArc = 60 > 180 ? 1 : 0;
                
                return (
                  <svg
                    key={`sector-${sectorIdx}`}
                    className="absolute"
                    style={{
                      width: '450px',
                      height: '450px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1,
                      opacity: player ? (isEliminated ? 0.4 : 1) : 0.9,
                      overflow: 'visible',
                      filter: isLastBidder
                        ? `drop-shadow(0 0 10px ${hexColor})`
                        : 'none',
                    }}
                  >
                    {/* Inner part of sector (70 to 175) */}
                    <path
                      d={`M ${225 + x1} ${225 + y1} L ${225 + x2} ${225 + y2} A ${ringRadius} ${ringRadius} 0 ${largeArc} 1 ${225 + x3} ${225 + y3} L ${225 + x4} ${225 + y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${225 + x1} ${225 + y1} Z`}
                      fill={hexColor}
                      fillOpacity={player ? (isCurrentPlayer ? 0.65 : 0.15) : 0.08}
                      stroke={isCurrentPlayer ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.06)'}
                      strokeWidth={isCurrentPlayer ? '2' : '0.5'}
                    />
                    {/* Outer part of sector (175 to 225) */}
                    <path
                      d={`M ${225 + x5} ${225 + y5} L ${225 + x6} ${225 + y6} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${225 + x7} ${225 + y7} L ${225 + x8} ${225 + y8} A ${ringRadius} ${ringRadius} 0 ${largeArc} 0 ${225 + x5} ${225 + y5} Z`}
                      fill={hexColor}
                      fillOpacity={player ? (isEliminated ? 0.08 : 0.75) : 0.08}
                      stroke="rgba(255, 255, 255, 0.5)"
                      strokeWidth="0.5"
                    />
                  </svg>
                );
              })}
              
              {/* Dividing Lines - inactive lines first (behind), then active lines on top */}
              {[false, true].map(renderActive =>
                sectorAngles.map((angle, idx) => {
                  const tableRadius = 225;
                  const centerCircleRadius = 70;
                  const startX = Math.cos((angle * Math.PI) / 180) * centerCircleRadius;
                  const startY = Math.sin((angle * Math.PI) / 180) * centerCircleRadius;
                  const endX = Math.cos((angle * Math.PI) / 180) * tableRadius;
                  const endY = Math.sin((angle * Math.PI) / 180) * tableRadius;

                  // Line idx is the left boundary of sector idx and the right boundary of sector (idx-1).
                  // Freeze lines to neutral during challenge/reveal so they don't flicker to the next player's colour.
                  const isActiveLine = !lastRoundResult && !innerCircleChallenge && (
                    idx === currentPlayerSector ||
                    idx === (currentPlayerSector + 1) % 6
                  );

                  // First pass: only inactive lines. Second pass: only active lines (drawn on top).
                  if (isActiveLine !== renderActive) return null;

                  const gradientId = `active-line-grad-${idx}`;

                  return (
                    <svg
                      key={`line-${renderActive ? 'active' : 'inactive'}-${idx}`}
                      className="absolute"
                      style={{
                        width: '450px',
                        height: '450px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: renderActive ? 3 : 2,
                        overflow: 'visible',
                      }}
                    >
                      {isActiveLine && (
                        <defs>
                          <linearGradient
                            id={gradientId}
                            gradientUnits="userSpaceOnUse"
                            x1={225 + startX}
                            y1={225 + startY}
                            x2={225 + endX}
                            y2={225 + endY}
                          >
                            <stop offset="0%" stopColor="white" stopOpacity="1" />
                            <stop offset="15%" stopColor={currentPlayerColor} stopOpacity="1" />
                            <stop offset="65%" stopColor={currentPlayerColor} stopOpacity="1" />
                            <stop offset="100%" stopColor={darkenHex(currentPlayerColor, 65)} stopOpacity="1" />
                          </linearGradient>
                        </defs>
                      )}
                      <line
                        x1={225 + startX}
                        y1={225 + startY}
                        x2={225 + endX}
                        y2={225 + endY}
                        stroke={isActiveLine ? `url(#${gradientId})` : 'rgba(255, 255, 255, 0.33)'}
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                    </svg>
                  );
                })
              )}

              {/* Middle Ring - Between inner circle and dice area */}
              <svg
                className="absolute"
                style={{
                  width: '450px',
                  height: '450px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                }}
              >
                <circle
                  cx="225"
                  cy="225"
                  r="175"
                  fill="none"
                  stroke="none"
                />
              </svg>


            </div>
          </div>

          {/* Bid display — own layer above sector fills, below central circle */}
          {gameState.currentBid && lastBidSectorIdx >= 0 && !lastRoundResult && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200"
              style={{ zIndex: 10, opacity: innerCircleChallenge ? 0 : 1 }}
            >
              {/* Positioning wrapper — slides smoothly between sectors */}
              <div
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${lastBidX}px), calc(-50% + ${lastBidY}px))`,
                  transition: 'transform 0.4s ease',
                }}
              >
                {/* Inner div owns the key + scale animation (opacity stays 1 — dice face must not be transparent) */}
                <div
                  key={bidAnimationKey}
                  className="flex flex-col items-center justify-center gap-0.5 animate-bid-reveal"
                >
                  {/* Dice face — always fully opaque */}
                  <div className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm flex-shrink-0">
                    <DiceFace value={gameState.currentBid.faceValue} size="sm" />
                  </div>
                  {/* Quantity text — fully opaque, no fade (sector glow already signals whose bid it is) */}
                  <div
                    className="text-sm font-bold text-white leading-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                  >
                    ×{gameState.currentBid.quantity}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Challenge overlays — prominent cards in each key sector during the reveal */}
          {lastRoundResult && !showDice && challengedSectorIdx >= 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
              {/* Bid card — sits in the bidder's sector */}
              <div
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${challengeBidChipX}px), calc(-50% + ${challengeBidChipY}px))`,
                }}
              >
                <div className="flex flex-col items-center gap-0.5 bg-white rounded-lg px-2 py-1.5"
                  style={{ boxShadow: '0 0 0 2.5px #E03030, 0 3px 10px rgba(0,0,0,0.4)', minWidth: '2.5rem' }}>
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center flex-shrink-0">
                    <DiceFace value={lastRoundResult.challengedBid.faceValue} size="sm" />
                  </div>
                  <div className="text-xs font-bold leading-none" style={{ color: '#E03030' }}>
                    ×{lastRoundResult.challengedBid.quantity}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Dice arranged along outer arc in each sector */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
            {sectorPlayers.map((player, sectorIdx) => {
              if (!player) return null; // Skip empty sectors
              
              const startAngle = sectorAngles[sectorIdx];
              const sectorSpan = 60; // 60 degrees per sector
              const outerRadius = 200; // Distance from center for dice (proportional to new board size)
              const playerHexColor = PLAYER_COLOR_MAP[player.color] || '#6B7280';
              
              // During reveal, only show dice that have been revealed sequentially
              // After reveal is complete, show all dice
              const isRevealing = revealState !== null && lastRoundResult !== null;
              // Don't show dice during challenge phases or tallying - only show after reveal starts
              const isLocalPlayer = isMyPlayer(player.id);
              const shouldShowDice = isLocalPlayer || (isRevealing ? true : false);
              
              // Get dice for this player
              const originalDice = (lastRoundResult && revealState)
                ? (lastRoundResult.allDice?.find(d => d.playerId === player.id)?.dice || player.dice)
                : player.dice;
              
              // Create sorted dice with mapping to original indices
              const diceWithIndices = originalDice && originalDice.length > 0
                ? originalDice.map((value, originalIdx) => ({ value, originalIdx })).sort((a, b) => a.value - b.value)
                : [];
              
              const revealedIndices = revealState ? (revealState.revealed[player.id] || []) : [];
              const matchingIndices = revealState ? (revealState.matchingDice?.[player.id] || []) : [];
              
              // Calculate positions for dice along the arc
              // During reveal, use the pre-round dice count from allDice so the loser's
              // die isn't removed visually before the tally animation finishes.
              const diceCount = (lastRoundResult && revealState && originalDice.length > 0)
                ? originalDice.length
                : player.diceCount;
              const diceSpacing = sectorSpan / (diceCount + 1); // Space dice evenly in sector

              return (
                <div key={`dice-sector-${sectorIdx}`}>
                  {Array.from({ length: diceCount }).map((_, dieIdx) => {
                    // Position dice along the arc of the sector
                    const angleInSector = startAngle + (dieIdx + 1) * diceSpacing;
                    const angleRad = (angleInSector * Math.PI) / 180;
                    const x = Math.cos(angleRad) * outerRadius;
                    const y = Math.sin(angleRad) * outerRadius;
                    // Rotate each die so its top faces the board centre
                    const rotationAngle = angleInSector - 90;

                    const diceItem = diceWithIndices[dieIdx];
                    const die = diceItem?.value;
                    const originalIdx = diceItem?.originalIdx ?? -1;
                    
                    // Whether this die has been sequentially counted in the reveal loop
                    const hasBeenCounted = isRevealing && originalIdx !== -1 && revealedIndices.includes(originalIdx);

                    // Human always sees their own dice during the reveal (just not the glow until counted)
                    const isRevealed = isRevealing
                      ? (isLocalPlayer || hasBeenCounted)
                      : (shouldShowDice && die !== undefined);

                    // Glow only after the die has been sequentially counted — never before
                    const isMatching = hasBeenCounted && originalIdx !== -1 && matchingIndices.includes(originalIdx);
                    const matches = isMatching;

                    // During dice throwing animation, show spinning dice
                    const isThrowing = diceThrowing && !isRevealing && !lastRoundResult;
                    const showValueDuringThrow = false; // Hide values during throw animation

                    // Animate when die is counted — human gets a pop (already visible), others get a flip-in
                    const isCurrentlyRevealing = hasBeenCounted;
                    const isMatchingAndRevealing = isCurrentlyRevealing && isMatching;
                    
                    return (
                      <div
                        key={`die-${sectorIdx}-${dieIdx}`}
                        className="absolute"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotationAngle}deg)`,
                        }}
                      >
                        <div
                          className={`
                            flex items-center justify-center relative
                            ${isThrowing
                              ? 'animate-dice-roll-throw'
                              : isLocalPlayer
                                ? (isMatchingAndRevealing ? 'animate-die-count-pop-match' : (isCurrentlyRevealing ? 'animate-die-count-pop' : ''))
                                : (isMatchingAndRevealing ? 'animate-reveal-match' : (isCurrentlyRevealing ? 'animate-reveal' : ''))
                            }
                          `}
                          style={isThrowing ? { animationDelay: `${sectorIdx * 10 + dieIdx * 30}ms` } : undefined}
                        >
                          {(isRevealed && !isThrowing) || (isThrowing && showValueDuringThrow) ? (
                            <div className={`w-7 h-7 bg-white border border-border-medium rounded flex items-center justify-center shadow-sm ${matches ? 'die-matching-glow' : ''}`}>
                              <DiceFace value={die} size="sm" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 bg-white border border-border-medium rounded flex items-center justify-center shadow-sm">
                              <span
                                className="text-sm font-bold"
                                style={{ color: playerHexColor }}
                              >
                                ?
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Central Circle - Bid Display with colorful gradient */}
          <div className="absolute inset-0 flex items-center justify-center z-20" style={{ overflow: 'visible' }}>
            <div
              className="rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                width: '140px',
                height: '140px',
                aspectRatio: '1',
                zIndex: 10,
                background: (innerCircleChallenge || lastRoundResult) ? (isCalzaRound ? '#CA8A04' : '#E03030') : '#E0E0E0',
                border: (innerCircleChallenge || lastRoundResult) ? `3px solid ${isCalzaRound ? '#CA8A04' : '#E03030'}` : '1px solid #D0D0D0',
                overflow: 'visible',
              }}
            >
              <div
                className="rounded-full flex items-center justify-center overflow-hidden p-2 transition-all duration-500"
                style={{
                  width: '120px',
                  height: '120px',
                  aspectRatio: '1',
                  background: (innerCircleChallenge || lastRoundResult)
                    ? (isCalzaRound ? '#CA8A04' : '#E03030')
                    : currentPlayerColor,
                  border: (innerCircleChallenge || lastRoundResult)
                    ? '3px solid white'
                    : '1px solid #E0E0E0',
                  transition: 'background-color 0.4s ease, border 0.3s ease',
                }}
              >
                {(innerCircleChallenge || (lastRoundResult && !revealState)) ? (
                  // "DUDO!" / "CALZA!" flash — fades out before switching to the Found counter
                  <div className={`text-center text-white flex flex-col items-center justify-center gap-0.5 w-full px-2 ${dudoFadingOut ? 'animate-fade-out' : ''}`}>
                    <div className="text-3xl font-bold tracking-wide animate-dudo-text" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{isCalzaRound ? 'CALZA!' : 'DUDO!'}</div>
                  </div>
                ) : lastRoundResult && revealState ? (
                  // Live counter: fades in, then increments with each matching die revealed
                  <div className="text-center text-white flex flex-col items-center justify-center w-full px-1 animate-fade-in">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0">
                        <DiceFace value={lastRoundResult.challengedBid.faceValue} size="sm" />
                      </div>
                      <span className="text-sm font-bold opacity-80">×{lastRoundResult.challengedBid.quantity}</span>
                    </div>
                    <div className="text-[9px] text-white/70 uppercase tracking-widest leading-none mb-2">Found</div>
                    <div
                      key={`found-${currentMatchingCount}`}
                      className="text-4xl font-bold leading-none animate-count-pulse"
                    >
                      {currentMatchingCount}
                    </div>
                  </div>
                ) : (
                  // Normal play — human shows "Your Turn", AI/others show "Thinking" or player name
                  <div className="text-center flex flex-col items-center justify-center w-full px-2 gap-0 select-none">
                    {isMyTurn ? (
                      <>
                        <div className="text-[9px] font-bold tracking-widest text-white/75 uppercase leading-none">Your</div>
                        <div className="text-xl font-bold text-white leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Turn!</div>
                        {isMultiplayer && (
                          <div className="text-[9px] text-white/60 mt-0.5">{Math.ceil((multiplayerMode?.turnTimeRemaining ?? 0) / 1000)}s</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-[9px] text-white/70 uppercase tracking-wide leading-none">
                          {isMultiplayer ? currentPlayer.name : 'Thinking'}
                        </div>
                        <div className="text-lg font-bold text-white leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {isMultiplayer ? `${Math.ceil((multiplayerMode?.turnTimeRemaining ?? 0) / 1000)}s` : '…'}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Challenge Context Banner — who called who and what the bid was (visible during DUDO flash too) */}
        {lastRoundResult && !showDice && !modalClosing && (() => {
          const challPlayer = gameState.players.find(p => p.id === lastRoundResult.challengerId);
          const bidPlayer   = gameState.players.find(p => p.id === lastRoundResult.bidderId);
          const challColor  = PLAYER_COLOR_MAP[challPlayer?.color ?? ''] || '#6B7280';
          const bidColor    = PLAYER_COLOR_MAP[bidPlayer?.color   ?? ''] || '#6B7280';
          return (
            <div className="max-w-2xl mx-auto animate-fade-slide-up" style={{ marginTop: '1.25rem' }}>
              <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl px-4 py-2.5 shadow-2xl">
                <div className="flex items-center justify-center gap-1.5 flex-wrap text-sm">
                  {/* Challenger */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: challColor }} />
                    <span className="font-bold text-white">{challPlayer?.name ?? 'Player'}</span>
                  </div>
                  {isCalzaRound ? (
                    <span className="text-white/65">called <span className="font-bold text-yellow-300">CALZA</span> on</span>
                  ) : (
                    <span className="text-white/65">called <span className="font-bold text-red-300">DUDO</span> on</span>
                  )}
                  {/* Bidder */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: bidColor }} />
                    <span className="font-bold text-white">{bidPlayer?.name ?? 'Player'}</span>
                  </div>
                  <span className="text-white/65">'s bid of</span>
                  {/* The bid itself */}
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white">{lastRoundResult.challengedBid.quantity}×</span>
                    <div className="w-5 h-5 bg-white/20 border border-white/30 rounded flex items-center justify-center flex-shrink-0">
                      <DiceFace value={lastRoundResult.challengedBid.faceValue} size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bid Input Section */}
        <div className="max-w-2xl mx-auto" style={{ marginTop: '1.25rem' }}>
          {isMyTurn && gameState.gamePhase === 'bidding' && !lastRoundResult && !showDice && (
            <BidInput
              currentBid={gameState.currentBid}
              palificoMode={gameState.palificoMode}
              playerId={currentPlayer.id}
              onBid={handleHumanBid}
              onChallenge={handleHumanChallenge}
              calzaEnabled={calzaEnabled}
              onCalza={handleHumanCalza}
              disabled={aiTurnInProgress.current}
            />
          )}
          {!isMyTurn && gameState.gamePhase === 'bidding' && !lastRoundResult && !innerCircleChallenge && (
            <div
              key={`waiting-${gameState.currentPlayerIndex}`}
              className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl p-3 shadow-2xl text-center animate-fade-slide-up"
            >
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PLAYER_COLOR_MAP[currentPlayer.color] || '#6B7280' }}
                />
                <span className="text-sm font-semibold text-white">
                  {currentPlayer.name}
                </span>
                <span className="text-white/70 text-sm">is thinking</span>
                <span className="flex gap-0.5 items-end pb-0.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="block w-1 h-1 rounded-full bg-white/70 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Round Result Modal */}
        {lastRoundResult && showDice && (
          <RoundResultModal
            result={lastRoundResult}
            revealComplete={revealComplete}
            players={gameState.players}
            analysisEnabled={isMultiplayer ? false : analysisEnabled}
            closing={modalClosing}
            autoClose={isMultiplayer}
            onViewAnalysis={() => setShowRoundAnalysis(true)}
            onClose={() => {
              // Start exit animation, then reset state after it completes
              setModalClosing(true);
              setTimeout(() => {
                setShowDice(false);
                setLastRoundResult(null);
                setChallengedBidPlayerId(null);
                setRevealState(null);
                setRevealComplete(false);
                setInnerCircleChallenge(false);
                setIsTallying(false);
                setIsCalzaRound(false);
                setModalClosing(false);
              }, 250); // Matches modalExit duration + small buffer
            }}
          />
        )}

        {/* Round Analysis Modal */}
        {showRoundAnalysis && lastRoundResult && (
          <RoundAnalysisModal
            result={lastRoundResult}
            players={gameState.players}
            onClose={() => setShowRoundAnalysis(false)}
          />
        )}

        {/* Palifico Info Modal */}
        {showPalificoInfo && gameState.palificoMode.active && gameState.palificoMode.lockedFaceValue !== null && (
          <PalificoInfoModal
            onClose={() => setShowPalificoInfo(false)}
            lockedFaceValue={gameState.palificoMode.lockedFaceValue}
          />
        )}

        {/* Game Over Modal */}
        {winner && (
          <GameOverModal
            winner={winner}
            analysisEnabled={isMultiplayer ? false : analysisEnabled}
            onViewGameAnalysis={() => setShowGameAnalysis(true)}
            onNewGame={isMultiplayer ? undefined : () => {
              const humanPlayer = gameState.players.find(p => p.isHuman);
              const humanWon = humanPlayer && winner.id === humanPlayer.id;
              ProfileStorage.recordGame(!!humanWon);

              const settings: GameSettings = {
                playerCount,
                startingDice,
                analysisEnabled,
                palificoEnabled,
                calzaEnabled,
              };
              initializeGame(settings);
              setAiPlayer(new AIPlayer(difficulty));
            }}
            onQuit={() => {
              if (!isMultiplayer) {
                const humanPlayer = gameState.players.find(p => p.isHuman);
                const humanWon = humanPlayer && winner.id === humanPlayer.id;
                ProfileStorage.recordGame(!!humanWon);
              }
              onBackToHome();
            }}
          />
        )}

        {/* Game Analysis Modal */}
        {showGameAnalysis && (
          <GameAnalysisModal
            roundHistory={gameState.roundHistory}
            players={gameState.players}
            onClose={() => setShowGameAnalysis(false)}
          />
        )}

        {/* Game Log Panel */}
        <GameLogPanel
          isOpen={showGameLog}
          onClose={() => setShowGameLog(false)}
          players={gameState.players}
          currentRoundBids={gameState.bidSequence}
          roundHistory={gameState.roundHistory}
          roundNumber={gameState.roundNumber}
          analysisEnabled={analysisEnabled}
        />
      </div>
    </div>
  );
}
