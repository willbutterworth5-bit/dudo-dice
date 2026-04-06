import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameContext } from '../hooks/useGameContext';
import { AIPlayer, Difficulty } from '../game/AIPlayer';
import { Bid, GameSettings, GameState, RoundResult, PLAYER_COLOR_MAP } from '../game/GameState';
import { ProfileStorage } from '../utils/profileStorage';
import { useAuth } from '../context/AuthContext';
import { recordGameSession } from '../utils/supabaseSync';
import AchievementToast from './AchievementToast';
import DiceFace from './DiceFace';
import BidInput from './BidInput';
import GameOverModal from './GameOverModal';
import RoundResultModal from './RoundResultModal';
import PalificoInfoModal from './PalificoInfoModal';
import GameLogPanel from './GameLogPanel';
import RoundAnalysisModal from './RoundAnalysisModal';
import GameAnalysisModal from './GameAnalysisModal';
import type { RoomPlayerInfo, RatingUpdate } from '../hooks/useMultiplayerConnection';
import {
  BOARD_BASE,
  buildSectorPlayerIndexes,
  findMyPlayerIndex,
  getBoardSizeForAvailableSpace,
  getBoardScale,
  getResponsiveBoardSize,
  isMyPlayer as isMyPlayerForBoard,
} from './game-board/layout';
import {
  buildSequentialRevealOrder,
  countMatchingDice,
  getRevealedDiceForPlayer,
  type RevealState,
} from './game-board/reveal';

export interface MultiplayerMode {
  playerId: string | null;
  gameState: GameState;
  turnTimeRemaining: number;
  roundResult: RoundResult | null;
  winnerId: string | null;
  isReconnecting: boolean;
  roomPlayers: RoomPlayerInfo[];
  ratingUpdate: RatingUpdate | null;
  isRanked: boolean;
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
  const { user } = useAuth();
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
  const [revealState, setRevealState] = useState<RevealState | null>(null);
  const [revealComplete, setRevealComplete] = useState(false);
  const [diceThrowing, setDiceThrowing] = useState(false);
  const [previousRoundNumber, setPreviousRoundNumber] = useState(0);
  const [isTallying, setIsTallying] = useState(false);
  const [innerCircleChallenge, setInnerCircleChallenge] = useState(false);
  const [challengedBidPlayerId, setChallengedBidPlayerId] = useState<string | null>(null);
  const aiTurnInProgress = useRef(false);

  // Achievement tracking (vs-computer only)
  const successfulDudosThisGame = useRef(0);
  const calzaSucceededThisGame = useRef(false);
  const humanDiceAtGameStart = useRef(startingDice);
  const humanMinDiceThisGame = useRef(startingDice);  // for Comeback King
  const humanWasAtOneDie = useRef(false);             // for Dice Whisperer
  const consecutiveDudoSuccesses = useRef(0);         // for Mind Reader
  const consecutiveValidBids = useRef(0);             // for The Oracle (valid bids when challenged)
  const pendingDudoAchievements = useRef<string[]>([]); // queued until after reveal animation
  const gameStartHour = useRef(new Date().getHours());  // for Night Owl / Early Bird
  const gameStartTime = useRef(Date.now());              // for session duration tracking
  const unlockAchievementsRef = useRef<(ids: string[]) => void>(() => {});
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([]);

  // Fire-and-forget session recording for Supabase analytics
  const fireSession = (result: 'win' | 'loss' | 'abandoned') => {
    if (!gameState) return;
    recordGameSession(user?.id ?? null, {
      session_type: isMultiplayer ? 'online' : 'vs_ai',
      difficulty: isMultiplayer ? undefined : difficulty,
      player_count: playerCount,
      human_count: isMultiplayer ? gameState.players.filter(p => p.isHuman).length : 1,
      result,
      rounds_played: gameState.roundHistory.length,
      starting_dice: startingDice,
      palifico_enabled: palificoEnabled,
      calza_enabled: calzaEnabled,
      duration_seconds: Math.round((Date.now() - gameStartTime.current) / 1000),
    }).catch(() => {});
  };

  const [showGameLog, setShowGameLog] = useState(false);
  const [showRoundAnalysis, setShowRoundAnalysis] = useState(false);
  const [showGameAnalysis, setShowGameAnalysis] = useState(false);
  const [dudoFadingOut, setDudoFadingOut] = useState(false);
  const [boardShaking, setBoardShaking] = useState(false);
  const [showDiceBreakdown, setShowDiceBreakdown] = useState(false);
  const animationTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [modalClosing, setModalClosing] = useState(false);
  const [isCalzaRound, setIsCalzaRound] = useState(false);
  const boardAreaRef = useRef<HTMLDivElement | null>(null);

  // Responsive board scaling for mobile
  const [boardSize, setBoardSize] = useState(() => {
    if (typeof window === 'undefined') return BOARD_BASE;
    return getResponsiveBoardSize(window.innerWidth, window.innerHeight);
  });
  useEffect(() => {
    const updateSize = () => {
      const viewportWidth = window.innerWidth;

      if (viewportWidth < 640) {
        setBoardSize(getResponsiveBoardSize(viewportWidth, window.innerHeight));
        return;
      }

      const boardArea = boardAreaRef.current;
      if (!boardArea) {
        setBoardSize(BOARD_BASE);
        return;
      }

      setBoardSize(getBoardSizeForAvailableSpace(
        boardArea.clientWidth - 24,
        boardArea.clientHeight - 50,
      ));
    };

    const boardArea = boardAreaRef.current;
    const resizeObserver = typeof ResizeObserver !== 'undefined' && boardArea
      ? new ResizeObserver(updateSize)
      : null;

    if (boardArea && resizeObserver) {
      resizeObserver.observe(boardArea);
    }

    window.addEventListener('resize', updateSize);
    updateSize();
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver?.disconnect();
    };
  }, []);
  const boardScale = getBoardScale(boardSize);

  // Track timeouts for cleanup on unmount
  const trackTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    animationTimeouts.current.push(id);
    return id;
  }, []);

  // Cleanup all animation timeouts on unmount
  useEffect(() => {
    return () => {
      animationTimeouts.current.forEach(id => clearTimeout(id));
      animationTimeouts.current = [];
    };
  }, []);

  // Sequential reveal function - defined early to avoid hoisting issues
  const startSequentialReveal = useCallback((result: RoundResult, state: GameState, onComplete?: () => void) => {
    if (!result || !result.allDice) {
      if (onComplete) onComplete();
      return;
    }

    const revealed: { [key: string]: number[] } = {};
    const matchingDice: { [key: string]: number[] } = {};

    const orderedDicePositions = buildSequentialRevealOrder(
      result,
      state,
      isMultiplayer,
      multiplayerMode?.playerId ?? null,
    );

    // Determine palifico mode from the bid history of this round (not the new round's state,
    // which has already reset). Ones are only wild when palifico was NOT active.
    const wasPalificoRound = result.bids[0]?.palificoMode ?? false;

    setRevealState({
      playerIndex: -1,
      dieIndex: -1,
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
          trackTimeout(() => {
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

        trackTimeout(() => {
          revealNextDie(diePositionIdx + 1, currentRevealed, currentMatching);
        }, 450);
      } catch (error) {
        console.error('Error in reveal:', error);
        setRevealState(null);
      }
    };

    // Start revealing first die after a short initial delay
    trackTimeout(() => {
      revealNextDie(0, revealed, matchingDice);
    }, 200);
  }, [isMultiplayer, multiplayerMode?.playerId, trackTimeout]);

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

    // Clear any pending animation timeouts from previous rounds
    animationTimeouts.current.forEach(id => clearTimeout(id));
    animationTimeouts.current = [];

    // Shake the board on Dudo call
    setBoardShaking(true);
    trackTimeout(() => setBoardShaking(false), 600);

    // Brief dramatic pause: flash the challenge moment, then crossfade into the reveal.
    trackTimeout(() => {
      // Begin crossfade: fade out DUDO/CALZA text before switching to the Found counter
      setDudoFadingOut(true);
      trackTimeout(() => {
        setInnerCircleChallenge(false);
        setDudoFadingOut(false);
        startSequentialReveal(result, state, () => {
          setShowDice(true);
          // Fire any Dudo achievements queued to show after the reveal
          if (pendingDudoAchievements.current.length > 0) {
            unlockAchievementsRef.current(pendingDudoAchievements.current);
            pendingDudoAchievements.current = [];
          }
        });
      }, 300);
    }, 1200);
  }, [startSequentialReveal, trackTimeout]);

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
    trackTimeout(() => setDiceThrowing(false), 800);
  }, [playerCount, startingDice, palificoEnabled, calzaEnabled, analysisEnabled, initializeGame, isMultiplayer, trackTimeout]);

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
      trackTimeout(() => {
        setDiceThrowing(false);
      }, 800); // Match animation duration
      setIsTallying(false);
      setInnerCircleChallenge(false);
      // Don't clear challengedBidPlayerId here — it's needed for the red
      // highlight during the reveal. It gets cleared when the modal is dismissed.
    }
    
    // Update previous round number after checking
    if (gameState.roundNumber !== previousRoundNumber) {
      setPreviousRoundNumber(gameState.roundNumber);
    }
  }, [gameState, previousRoundNumber, trackTimeout]);

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
  }, [multiplayerMode, isMultiplayer, gameState, startChallengeAnimation]);

  // Clear round result overlay when game ends (after reveal completes — see RoundResultModal gate below)
  const hasWinner = isMultiplayer
    ? !!multiplayerMode?.winnerId
    : !!(gameEngine?.getWinner());
  useEffect(() => {
    if (hasWinner && !lastRoundResult) {
      setShowDice(false);
      setChallengedBidPlayerId(null);
      setRevealState(null);
      setRevealComplete(false);
      setInnerCircleChallenge(false);
      setIsTallying(false);
      setIsCalzaRound(false);
      setModalClosing(false);
    }
  }, [hasWinner, lastRoundResult]);

  // Handle AI turns (local mode only — in multiplayer, server handles AI)
  useEffect(() => {
    if (isMultiplayer) return;
    if (!gameState || !gameEngine) return;
    if (gameState.gamePhase === 'gameOver') return;
    if (aiTurnInProgress.current) return;
    // Don't run AI turns while any round result is active (reveal animation or result modal)
    if (lastRoundResult) return;
    if (innerCircleChallenge) return;

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
            if (result) {
              const humanPlayer = freshState.players.find(p => p.isHuman);
              if (humanPlayer && result.bidderId === humanPlayer.id) {
                const aiWon = result.winnerId === result.challengerId;
                ProfileStorage.recordCalledAgainst(aiWon);
                if (!aiWon) {
                  // Human bluffed successfully (AI called but was wrong)
                  consecutiveValidBids.current++;
                  const profile = ProfileStorage.getProfile();
                  const bluffs = profile.vsComputerStats.timesCalledAgainst - profile.vsComputerStats.successfulCallsAgainst;
                  const toUnlock: string[] = [];
                  if (!profile.achievements.includes('bold_bluffer') && bluffs >= 5) toUnlock.push('bold_bluffer');
                  if (!profile.achievements.includes('calculated_risk') && result.actualCount === result.challengedBid.quantity) toUnlock.push('calculated_risk');
                  if (!profile.achievements.includes('the_oracle') && consecutiveValidBids.current >= 5) toUnlock.push('the_oracle');
                  if (toUnlock.length) unlockAchievements(toUnlock);
                } else {
                  consecutiveValidBids.current = 0;
                }
                // Track if human is down to 1 die
                const humanDiceAfter = freshState.players.find(p => p.isHuman)?.diceCount ?? 0;
                if (humanDiceAfter === 1) humanWasAtOneDie.current = true;
                if (humanDiceAfter < humanMinDiceThisGame.current) humanMinDiceThisGame.current = humanDiceAfter;
              }
              // Set animation state BEFORE updating game state to prevent
              // a render frame where dice count shows the new (reduced) value
              // before lastRoundResult is set (which would make the die flash away then back).
              startChallengeAnimation(result, freshState, false);
              updateGameState();
            }
            aiTurnInProgress.current = false;
          } else if (decision === 'calza') {
            const result = localCallCalza(freshPlayer.id);
            if (result) {
              startChallengeAnimation(result, freshState, true);
              updateGameState();
            }
            aiTurnInProgress.current = false;
          } else {
            const bid = aiPlayer.generateBid(freshState, freshPlayer);
            if (bid) {
              const result = await localMakeBid(bid);
              if (result.success) {
                updateGameState();
                setBidAnimationKey(prev => prev + 1);
              }
              // Release AI lock after a microtask so the state update from
              // updateGameState() is processed first, preventing the effect
              // from re-firing with stale currentPlayerIndex and skipping
              // the human's turn.
              await Promise.resolve();
              aiTurnInProgress.current = false;
            } else {
              // Can't generate valid bid, challenge instead
              const result = localChallengeBid(freshPlayer.id);
              if (result) {
                const humanPlayer = freshState.players.find(p => p.isHuman);
                if (humanPlayer && result.bidderId === humanPlayer.id) {
                  const aiWon = result.winnerId === result.challengerId;
                  ProfileStorage.recordCalledAgainst(aiWon);
                  if (!aiWon) {
                    consecutiveValidBids.current++;
                    const profile = ProfileStorage.getProfile();
                    const bluffs = profile.vsComputerStats.timesCalledAgainst - profile.vsComputerStats.successfulCallsAgainst;
                    const toUnlock: string[] = [];
                    if (!profile.achievements.includes('bold_bluffer') && bluffs >= 5) toUnlock.push('bold_bluffer');
                    if (!profile.achievements.includes('calculated_risk') && result.actualCount === result.challengedBid.quantity) toUnlock.push('calculated_risk');
                    if (!profile.achievements.includes('the_oracle') && consecutiveValidBids.current >= 5) toUnlock.push('the_oracle');
                    if (toUnlock.length) unlockAchievements(toUnlock);
                  } else {
                    consecutiveValidBids.current = 0;
                  }
                  const humanDiceAfter = freshState.players.find(p => p.isHuman)?.diceCount ?? 0;
                  if (humanDiceAfter === 1) humanWasAtOneDie.current = true;
                  if (humanDiceAfter < humanMinDiceThisGame.current) humanMinDiceThisGame.current = humanDiceAfter;
                }
                startChallengeAnimation(result, freshState);
                updateGameState();
              }
              aiTurnInProgress.current = false;
            }
          }
        } catch (error) {
          console.error('Error in AI turn:', error);
          aiTurnInProgress.current = false;
        }
      };

    handleAITurn();
  }, [gameState, gameEngine, aiPlayer, localMakeBid, localChallengeBid, localCallCalza, startChallengeAnimation, lastRoundResult, updateGameState, innerCircleChallenge, isMultiplayer]);

  // Unlock achievements and queue toasts. Returns newly unlocked IDs.
  const unlockAchievements = useCallback((ids: string[]) => {
    const newlyUnlocked = ids.filter(id => ProfileStorage.unlockAchievement(id));
    if (newlyUnlocked.length > 0) {
      setPendingAchievements(prev => [...prev, ...newlyUnlocked]);
    }
  }, []);
  unlockAchievementsRef.current = unlockAchievements;

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
        const freshState = gameEngine.getState();
        const successful = result.winnerId === result.challengerId;
        ProfileStorage.recordDudoCall(successful);
        if (successful) {
          successfulDudosThisGame.current++;
          consecutiveDudoSuccesses.current++;
          const profile = ProfileStorage.getProfile();
          const toQueue: string[] = [];
          if (!profile.achievements.includes('cold_blooded') && profile.vsComputerStats.successfulDudoCalls >= 10) toQueue.push('cold_blooded');
          if (!profile.achievements.includes('mind_reader') && consecutiveDudoSuccesses.current >= 3) toQueue.push('mind_reader');
          // Queue to show after reveal animation
          if (toQueue.length) pendingDudoAchievements.current.push(...toQueue);
        } else {
          consecutiveDudoSuccesses.current = 0;
        }
        startChallengeAnimation(result, freshState, false);
        updateGameState();
      }
    } catch (error) {
      console.error('Error challenging bid:', error);
    }
  }, [gameEngine, gameState, localChallengeBid, startChallengeAnimation, updateGameState, isMultiplayer, multiplayerMode, unlockAchievements]);

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
        const freshState = gameEngine.getState();
        if (result.calzaSuccess) {
          calzaSucceededThisGame.current = true;
          unlockAchievements(['calza']);
        }
        startChallengeAnimation(result, freshState, true);
        updateGameState();
      }
    } catch (error) {
      console.error('Error calling calza:', error);
    }
  }, [gameEngine, gameState, localCallCalza, startChallengeAnimation, updateGameState, isMultiplayer, multiplayerMode, unlockAchievements]);

  if (!gameState || (!isMultiplayer && !gameEngine)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white">Loading game...</div>
      </div>
    );
  }

  if (!gameState.players || gameState.players.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white">Initializing players...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white">Setting up game...</div>
      </div>
    );
  }

  const winner = isMultiplayer
    ? (multiplayerMode?.winnerId ? gameState.players.find(p => p.id === multiplayerMode.winnerId) ?? null : null)
    : gameEngine?.getWinner() ?? null;

  // Calculate total dice
  const totalDice = gameState.players.reduce((sum, p) => sum + p.diceCount, 0);
  
  // Calculate current matching dice count during reveal
  const currentMatchingCount = countMatchingDice(revealState?.matchingDice);

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
  const humanIdx = findMyPlayerIndex(gameState.players, isMultiplayer, multiplayerMode?.playerId);

  // Helper to check if a player is "me" (the local human player)
  const isMyPlayer = (playerId: string) =>
    isMyPlayerForBoard(gameState.players, playerId, isMultiplayer, multiplayerMode?.playerId);

  // Is it my turn?
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]
    ? isMyPlayer(gameState.players[gameState.currentPlayerIndex].id)
    : false;
  const numPlayers = gameState.players.length;
  const sectorToPlayerIdx: (number | null)[] = buildSectorPlayerIndexes(
    gameState.players,
    isMultiplayer,
    multiplayerMode?.playerId,
  );
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

  // Challenge overlay positions — same radius as normal bid display
  const challengedSectorIdx = challengedBidPlayerId
    ? sectorPlayers.findIndex(p => p?.id === challengedBidPlayerId)
    : -1;
  const challengedMidRad = ((challengedSectorIdx >= 0 ? sectorAngles[challengedSectorIdx] : 0) + 30) * Math.PI / 180;
  const challengeBidChipX = Math.cos(challengedMidRad) * innerRingMidR;
  const challengeBidChipY = Math.sin(challengedMidRad) * innerRingMidR;


  return (
    <div className="h-dvh flex flex-col relative" style={{ minWidth: '0', overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex-1 min-h-0 flex flex-col max-w-4xl mx-auto w-full relative pt-14 sm:pt-14">
        {/* Back button - fixed top left */}
        <button
          onClick={() => {
            if (!winner) fireSession('abandoned');
            onBackToHome();
          }}
          className="fixed h-10 sm:h-8 text-white text-xs sm:text-sm font-semibold z-50 rounded-xl px-2 sm:px-2 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
          style={{ left: 'max(0.75rem, env(safe-area-inset-left, 0px))', top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
        >
          ← Back
        </button>

        {/* Dice count + Round + Palifico + Log - fixed top right, aligned with back button */}
        <div className="fixed z-50 flex items-center gap-1 sm:gap-1.5" style={{ right: 'max(0.75rem, env(safe-area-inset-right, 0px))', top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}>
          <div className="relative">
            <button
              onClick={() => setShowDiceBreakdown(v => !v)}
              className="h-10 sm:h-8 text-white px-2.5 sm:px-2 rounded-xl flex items-center gap-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 min-w-[3rem] justify-center"
            >
              <span className="text-xs">🎲</span>
              <span className="font-bold text-xs sm:text-sm">x{totalDice}</span>
            </button>
            {showDiceBreakdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDiceBreakdown(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-lg border border-white/20 p-2.5 min-w-[140px]">
                  {gameState.players.filter(p => p.diceCount > 0).map(p => {
                    const color = PLAYER_COLOR_MAP[p.color] || '#6B7280';
                    const displayName = p.isHuman ? 'You' : p.name;
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-2 py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-white text-xs truncate">{displayName}</span>
                        </div>
                        <span className="text-white font-bold text-xs flex-shrink-0">{p.diceCount}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-white/20 mt-1.5 pt-1.5 flex items-center justify-between">
                    <span className="text-white/70 text-xs">Total</span>
                    <span className="text-white font-bold text-xs">{totalDice}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          {gameState.palificoMode.active && (
            <button
              onClick={() => setShowPalificoInfo(true)}
              className="h-10 sm:h-8 text-white px-2 sm:px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
            >
              <span className="hidden sm:inline">Palifico</span><span className="sm:hidden">P!</span>
            </button>
          )}
          <button
            onClick={() => setShowGameLog(v => !v)}
            className="h-10 sm:h-8 text-white px-2 sm:px-2 rounded-xl text-xs font-semibold shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
            title="Game Log"
          >
            📋
          </button>
        </div>

        {/* Redesigned Game Board - Segmented Circle */}
        <div ref={boardAreaRef} className="relative flex-1 min-h-0 sm:min-h-[450px] w-full" style={{ overflow: 'visible' }}>
          {/* Table Container */}
          <div className={`absolute inset-0 flex items-center justify-center ${boardShaking ? 'animate-board-shake' : ''}`} style={{ overflow: 'visible', padding: '0' }}>
            <div className="relative" style={{ width: '450px', height: '450px', overflow: 'visible', flexShrink: 0, transform: `scale(${boardScale})`, transformOrigin: 'center center' }}>
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
                // During a dudo/reveal, suppress the current-player highlight — only the last bidder is shown
                const isCurrentPlayer = !challengedBidPlayerId && !lastRoundResult && player && gameState.players.findIndex(p => p.id === player.id) === gameState.currentPlayerIndex;
                // During reveal/tally, use the round-result snapshot so a player who just
                // lost their last die still looks alive until the modal is dismissed.
                // Also suppress elimination during the challenge banner (innerCircleChallenge)
                // and while dice are being shown (showDice) to prevent premature greying.
                const hadDiceInRound = lastRoundResult && player
                  ? (lastRoundResult.allDice?.find(d => d.playerId === player.id)?.dice?.length ?? 0) > 0
                  : false;
                const duringRevealSequence = !!(lastRoundResult || innerCircleChallenge || showDice || isTallying);
                const isEliminated = player && player.diceCount === 0 && !hadDiceInRound && !duringRevealSequence;
                // During dudo/tallying: the challenged bidder gets red highlight
                const isDudoChallenged = !!(challengedBidPlayerId && player && player.id === challengedBidPlayerId);
                // Normal play: track who made the last bid (for subtle glow, not red)
                const isLastBidder = !challengedBidPlayerId && !!(player && gameState.currentBid && gameState.currentBid.playerId === player.id);
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
                
                const largeArc = 0; // 60° sector never exceeds 180°
                
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
                      filter: isDudoChallenged
                        ? 'drop-shadow(0 0 14px rgba(220, 38, 38, 0.6))'
                        : (isLastBidder ? `drop-shadow(0 0 10px ${hexColor})` : 'none'),
                      transition: 'filter 0.6s ease',
                    }}
                  >
                    {/* Inner part of sector (70 to 175) */}
                    <path
                      d={`M ${225 + x1} ${225 + y1} L ${225 + x2} ${225 + y2} A ${ringRadius} ${ringRadius} 0 ${largeArc} 1 ${225 + x3} ${225 + y3} L ${225 + x4} ${225 + y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${225 + x1} ${225 + y1} Z`}
                      fill={isDudoChallenged ? '#DC2626' : hexColor}
                      fillOpacity={player ? ((isCurrentPlayer ? 0.65 : isDudoChallenged ? 0.45 : 0.15)) : 0.08}
                      stroke={isCurrentPlayer ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.06)'}
                      strokeWidth={isCurrentPlayer ? '2' : '0.5'}
                      style={{ transition: 'fill 0.6s ease, fill-opacity 0.6s ease' }}
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
                  // During challenge/reveal, highlight the last bidder's sector lines in red.
                  const isDudoLine = (lastRoundResult || innerCircleChallenge) && challengedSectorIdx >= 0 && (
                    idx === challengedSectorIdx ||
                    idx === (challengedSectorIdx + 1) % 6
                  );
                  const isActiveLine = isDudoLine || (!lastRoundResult && !innerCircleChallenge && (
                    idx === currentPlayerSector ||
                    idx === (currentPlayerSector + 1) % 6
                  ));

                  // First pass: only inactive lines. Second pass: only active lines (drawn on top).
                  if (isActiveLine !== renderActive) return null;

                  const gradientId = `active-line-grad-${idx}`;
                  const lineColor = isDudoLine ? '#E03030' : currentPlayerColor;

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
                            <stop offset="0%" stopColor={isDudoLine ? lineColor : 'white'} stopOpacity="1" />
                            <stop offset="15%" stopColor={lineColor} stopOpacity="1" />
                            <stop offset="65%" stopColor={lineColor} stopOpacity="1" />
                            <stop offset="100%" stopColor={darkenHex(lineColor, 65)} stopOpacity="1" />
                          </linearGradient>
                        </defs>
                      )}
                      <line
                        x1={225 + startX}
                        y1={225 + startY}
                        x2={225 + endX}
                        y2={225 + endY}
                        stroke={isActiveLine ? `url(#${gradientId})` : 'rgba(255, 255, 255, 0.33)'}
                        strokeWidth={isDudoLine ? '14' : '12'}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-width 0.4s ease' }}
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
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <div className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm flex-shrink-0">
                    <DiceFace value={lastRoundResult.challengedBid.faceValue} size="sm" />
                  </div>
                  <div
                    className="text-sm font-bold text-white leading-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                  >
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
              
              // Get dice for this player — use the round-result snapshot whenever a
              // result is active so that the human's dice don't briefly flash as the
              // new-round (re-rolled) values during the DUDO/CALZA banner.
              const originalDice = lastRoundResult
                ? (lastRoundResult.allDice?.find(d => d.playerId === player.id)?.dice ?? player.dice ?? [])
                : (player.dice ?? []);
              
              // Create sorted dice with mapping to original indices
              const diceWithIndices = originalDice && originalDice.length > 0
                ? originalDice.map((value, originalIdx) => ({ value, originalIdx })).sort((a, b) => a.value - b.value)
                : [];
              
              const { revealedIndices, matchingIndices } = getRevealedDiceForPlayer(revealState, player);
              
              // Calculate positions for dice along the arc
              // During reveal, use the pre-round dice count from allDice so the loser's
              // die isn't removed visually before the tally animation finishes.
              const diceCount = (lastRoundResult && originalDice.length > 0)
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
                    {currentMatchingCount === 0 ? (
                      <div className="text-4xl font-bold leading-none">0</div>
                    ) : (
                      <div
                        key={`found-${currentMatchingCount}`}
                        className="text-4xl font-bold leading-none animate-count-pulse"
                      >
                        {currentMatchingCount}
                      </div>
                    )}
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
          </div>
        </div>


        {/* Player Color Legend */}
        <div className="px-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-2 mb-3 sm:mb-1">
            {gameState.players.map((player, playerIdx) => {
              const color = PLAYER_COLOR_MAP[player.color] || '#6B7280';
              const isCurrentTurn = playerIdx === gameState.currentPlayerIndex && gameState.gamePhase === 'bidding' && !lastRoundResult && !showDice;
              const hadDiceInRoundLegend = lastRoundResult
                ? (lastRoundResult.allDice?.find(d => d.playerId === player.id)?.dice?.length ?? 0) > 0
                : false;
              const duringRevealLegend = !!(lastRoundResult || innerCircleChallenge || showDice || isTallying);
              const isEliminated = player.diceCount === 0 && !hadDiceInRoundLegend && !duringRevealLegend;
              return (
                <div
                  key={player.id}
                  className="flex-1 min-w-0 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md h-9 sm:h-7"
                  style={{
                    background: `linear-gradient(to bottom right, ${color}, ${color}dd)`,
                    boxShadow: isCurrentTurn
                      ? `inset 0 0 0 2px white, 0 2px 4px rgba(0,0,0,0.25)`
                      : `0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    opacity: isEliminated ? 0.4 : (isCurrentTurn ? 1 : 0.75),
                  }}
                >
                  <span className="text-[9px] sm:text-[11px] font-bold text-white text-center truncate px-1 sm:px-2.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {player.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bid Input Section */}
        <div className="px-3 pb-2 sm:pb-4 relative z-10 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            {/* Challenge Context Banner — who called who and what the bid was */}
            {lastRoundResult && !showDice && !modalClosing && (() => {
              const challPlayer = gameState.players.find(p => p.id === lastRoundResult.challengerId);
              const bidPlayer   = gameState.players.find(p => p.id === lastRoundResult.bidderId);
              const challColor  = PLAYER_COLOR_MAP[challPlayer?.color ?? ''] || '#6B7280';
              const bidColor    = PLAYER_COLOR_MAP[bidPlayer?.color   ?? ''] || '#6B7280';
              return (
                <div
                  className="animate-fade-slide-up bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-center"
                >
                  <div className="flex items-center justify-center gap-1.5 flex-wrap text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: challColor }} />
                      <span className="font-bold text-white">{challPlayer?.name ?? 'Player'}</span>
                    </div>
                    {isCalzaRound ? (
                      <span className="text-white/65">called <span className="font-bold text-yellow-300">CALZA</span> on</span>
                    ) : (
                      <span className="text-white/65">called <span className="font-bold text-red-300">DUDO</span> on</span>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: bidColor }} />
                      <span className="font-bold text-white">{bidPlayer?.name ?? 'Player'}<span className="font-normal text-white/65">'s bid of</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white">{lastRoundResult.challengedBid.quantity}×</span>
                      <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                        <DiceFace value={lastRoundResult.challengedBid.faceValue} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
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
                className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl p-1.5 sm:p-3 shadow-2xl animate-fade-slide-up flex items-center justify-center"
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
        </div>

        {/* Round Result Modal */}
        {lastRoundResult && showDice && (() => {
          // Check if the human was just eliminated in this round
          const humanPlayer = isMultiplayer
            ? gameState.players.find(p => p.id === multiplayerMode?.playerId)
            : gameState.players.find(p => p.isHuman);
          const humanJustEliminated = humanPlayer
            && humanPlayer.diceCount === 0
            && (lastRoundResult.loserId === humanPlayer.id);

          return (
            <RoundResultModal
              result={lastRoundResult}
              revealComplete={revealComplete}
              players={gameState.players}
              analysisEnabled={isMultiplayer ? false : analysisEnabled}
              closing={modalClosing}
              autoClose={isMultiplayer && !humanJustEliminated}
              onViewAnalysis={() => setShowRoundAnalysis(true)}
              onSkipToEnd={humanJustEliminated && !isMultiplayer && gameEngine ? () => {
                gameEngine.simulateToEnd(difficulty);
                updateGameState();
                // Clear round result state so Game Over modal shows
                setShowDice(false);
                setLastRoundResult(null);
                setChallengedBidPlayerId(null);
                setRevealState(null);
                setRevealComplete(false);
                setInnerCircleChallenge(false);
                setIsTallying(false);
                setIsCalzaRound(false);
                setModalClosing(false);
              } : undefined}
              onLeaveGame={humanJustEliminated && isMultiplayer ? () => {
                fireSession('loss');
                onBackToHome();
              } : undefined}
              onClose={() => {
                // Start exit animation, then reset state after it completes
                setModalClosing(true);
                trackTimeout(() => {
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
          );
        })()}

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

        {/* Game Over Modal — only show after reveal animation clears */}
        {winner && !lastRoundResult && !revealState && (
          <GameOverModal
            winner={winner}
            analysisEnabled={isMultiplayer ? false : analysisEnabled}
            ratingUpdate={multiplayerMode?.ratingUpdate}
            isRanked={multiplayerMode?.isRanked}
            onViewGameAnalysis={() => setShowGameAnalysis(true)}
            onNewGame={isMultiplayer ? undefined : () => {
              const humanPlayer = gameState.players.find(p => p.isHuman);
              const humanWon = !!(humanPlayer && winner.id === humanPlayer.id);
              ProfileStorage.recordGame(humanWon);
              fireSession(humanWon ? 'win' : 'loss');

              // Achievement checks at game-over
              const profile = ProfileStorage.getProfile();
              if (humanWon) {
                profile.consecutiveWins = (profile.consecutiveWins ?? 0) + 1;
              } else {
                profile.consecutiveWins = 0;
              }
              ProfileStorage.saveProfile(profile);

              const humanDiceNow = humanWon ? (humanPlayer?.diceCount ?? 0) : 0;
              const hour = gameStartHour.current;
              const toUnlock: string[] = [];
              const unlocked = profile.achievements;
              const s = profile.vsComputerStats;
              if (!unlocked.includes('first_game') && s.gamesPlayed >= 1) toUnlock.push('first_game');
              if (!unlocked.includes('getting_hang') && s.gamesPlayed >= 10) toUnlock.push('getting_hang');
              if (!unlocked.includes('dice_devotee') && s.gamesPlayed >= 100) toUnlock.push('dice_devotee');
              if (humanWon) {
                if (!unlocked.includes('first_win') && s.gamesWon >= 1) toUnlock.push('first_win');
                if (!unlocked.includes('seasoned_gambler') && s.gamesWon >= 25) toUnlock.push('seasoned_gambler');
                if (!unlocked.includes('master_of_bluff') && s.gamesWon >= 100) toUnlock.push('master_of_bluff');
                if (!unlocked.includes('impossible_odds') && humanDiceNow === 1) toUnlock.push('impossible_odds');
                if (!unlocked.includes('dice_whisperer') && humanWasAtOneDie.current) toUnlock.push('dice_whisperer');
                if (!unlocked.includes('perfect_game') && humanDiceNow === humanDiceAtGameStart.current) toUnlock.push('perfect_game');
                if (!unlocked.includes('comeback_king') && humanMinDiceThisGame.current <= humanDiceAtGameStart.current - 3) toUnlock.push('comeback_king');
                if (!unlocked.includes('hot_streak') && profile.consecutiveWins >= 3) toUnlock.push('hot_streak');
                if (!unlocked.includes('unstoppable') && profile.consecutiveWins >= 7) toUnlock.push('unstoppable');
              }
              if (!unlocked.includes('night_owl') && hour >= 2 && hour < 5) toUnlock.push('night_owl');
              if (!unlocked.includes('early_bird') && hour >= 5 && hour < 7) toUnlock.push('early_bird');
              unlockAchievements(toUnlock);

              // Reset transient refs
              successfulDudosThisGame.current = 0;
              calzaSucceededThisGame.current = false;
              humanDiceAtGameStart.current = startingDice;
              humanMinDiceThisGame.current = startingDice;
              humanWasAtOneDie.current = false;
              consecutiveDudoSuccesses.current = 0;
              consecutiveValidBids.current = 0;
              gameStartHour.current = new Date().getHours();
              gameStartTime.current = Date.now();

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
                const humanWon = !!(humanPlayer && winner.id === humanPlayer.id);
                ProfileStorage.recordGame(humanWon);
                fireSession(humanWon ? 'win' : 'loss');

                // Achievement checks at game-over
                const profile = ProfileStorage.getProfile();
                if (humanWon) {
                  profile.consecutiveWins = (profile.consecutiveWins ?? 0) + 1;
                } else {
                  profile.consecutiveWins = 0;
                }
                ProfileStorage.saveProfile(profile);

                const humanDiceNow = humanWon ? (humanPlayer?.diceCount ?? 0) : 0;
                const hour = gameStartHour.current;
                const toUnlock: string[] = [];
                const unlocked = profile.achievements;
                const s = profile.vsComputerStats;
                if (!unlocked.includes('first_game') && s.gamesPlayed >= 1) toUnlock.push('first_game');
                if (!unlocked.includes('getting_hang') && s.gamesPlayed >= 10) toUnlock.push('getting_hang');
                if (!unlocked.includes('dice_devotee') && s.gamesPlayed >= 100) toUnlock.push('dice_devotee');
                if (humanWon) {
                  if (!unlocked.includes('first_win') && s.gamesWon >= 1) toUnlock.push('first_win');
                  if (!unlocked.includes('seasoned_gambler') && s.gamesWon >= 25) toUnlock.push('seasoned_gambler');
                  if (!unlocked.includes('master_of_bluff') && s.gamesWon >= 100) toUnlock.push('master_of_bluff');
                  if (!unlocked.includes('impossible_odds') && humanDiceNow === 1) toUnlock.push('impossible_odds');
                  if (!unlocked.includes('dice_whisperer') && humanWasAtOneDie.current) toUnlock.push('dice_whisperer');
                  if (!unlocked.includes('perfect_game') && humanDiceNow === humanDiceAtGameStart.current) toUnlock.push('perfect_game');
                  if (!unlocked.includes('comeback_king') && humanMinDiceThisGame.current <= humanDiceAtGameStart.current - 3) toUnlock.push('comeback_king');
                  if (!unlocked.includes('hot_streak') && profile.consecutiveWins >= 3) toUnlock.push('hot_streak');
                  if (!unlocked.includes('unstoppable') && profile.consecutiveWins >= 7) toUnlock.push('unstoppable');
                }
                if (!unlocked.includes('night_owl') && hour >= 2 && hour < 5) toUnlock.push('night_owl');
                if (!unlocked.includes('early_bird') && hour >= 5 && hour < 7) toUnlock.push('early_bird');
                unlockAchievements(toUnlock);
              }
              if (isMultiplayer) {
                const humanWonMp = !!(multiplayerMode?.playerId && winner.id === multiplayerMode.playerId);
                fireSession(humanWonMp ? 'win' : 'loss');
                // Track unique online opponents for Friendly Face / Social Butterfly
                const opponentIds = gameState.players.filter(p => !p.isHuman).map(p => p.id);
                if (opponentIds.length > 0) {
                  const uniqueCount = ProfileStorage.recordOnlinePlayers(opponentIds);
                  const mp = ProfileStorage.getProfile();
                  const toUnlockOnline: string[] = [];
                  if (!mp.achievements.includes('friendly_face') && uniqueCount >= 5) toUnlockOnline.push('friendly_face');
                  if (!mp.achievements.includes('social_butterfly') && uniqueCount >= 20) toUnlockOnline.push('social_butterfly');
                  if (toUnlockOnline.length) unlockAchievements(toUnlockOnline);
                }
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

        {/* Achievement Toast */}
        <AchievementToast
          ids={pendingAchievements}
          onDismiss={(id) => setPendingAchievements(prev => prev.filter(x => x !== id))}
        />
      </div>
    </div>
  );
}
