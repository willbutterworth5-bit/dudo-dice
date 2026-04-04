import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import HomeScreen from './components/HomeScreen'
import GameBoard from './components/GameBoard'
import ProfileScreen from './components/ProfileScreen'
import LobbyScreen from './components/LobbyScreen'
import WaitingRoom from './components/WaitingRoom'
import JoinRedirect from './components/JoinRedirect'
import RulesPage from './components/RulesPage'
import { GameProvider } from './context/GameContext'
import { useMultiplayerConnection } from './hooks/useMultiplayerConnection'
import type { GameConfig } from './types/routes'

// Wrapper for single-player game that reads config from location.state
function SinglePlayerGame() {
  const location = useLocation()
  const navigate = useNavigate()
  const config = location.state as GameConfig | null

  if (!config) {
    return <Navigate to="/play" replace />
  }

  return (
    <GameProvider>
      <GameBoard
        playerCount={config.playerCount}
        difficulty={config.difficulty}
        startingDice={config.startingDice}
        analysisEnabled={config.analysisEnabled}
        palificoEnabled={config.palificoEnabled}
        calzaEnabled={config.calzaEnabled}
        onBackToHome={() => navigate('/')}
      />
    </GameProvider>
  )
}

// Guard for online game — redirect to lobby if no active game state
function OnlineGame({ mp }: { mp: ReturnType<typeof useMultiplayerConnection> }) {
  const navigate = useNavigate()

  if (!mp.gameState) {
    return <Navigate to="/online" replace />
  }

  return (
    <GameProvider>
      <GameBoard
        playerCount={mp.gameState.players.length}
        difficulty="medium"
        startingDice={mp.gameState.settings.startingDice}
        analysisEnabled={false}
        palificoEnabled={mp.gameState.settings.palificoEnabled}
        calzaEnabled={mp.gameState.settings.calzaEnabled}
        onBackToHome={() => {
          mp.disconnect()
          navigate('/')
        }}
        multiplayerMode={{
          playerId: mp.playerId,
          gameState: mp.gameState,
          turnTimeRemaining: mp.turnTimeRemaining,
          roundResult: mp.roundResult,
          winnerId: mp.winnerId,
          isReconnecting: mp.isReconnecting,
          roomPlayers: mp.roomUpdate?.players ?? [],
          ratingUpdate: mp.ratingUpdate,
          isRanked: mp.isRanked,
          onMakeBid: mp.makeBid,
          onChallenge: mp.challenge,
          onCalza: mp.calza,
        }}
      />
    </GameProvider>
  )
}

// Guard for waiting room — redirect to lobby if no active room
function OnlineWaiting({ mp }: { mp: ReturnType<typeof useMultiplayerConnection> }) {
  const navigate = useNavigate()

  if (!mp.roomUpdate) {
    return <Navigate to="/online" replace />
  }

  return (
    <WaitingRoom
      roomCode={mp.roomUpdate.roomCode}
      players={mp.roomUpdate.players}
      hostId={mp.roomUpdate.hostId}
      myPlayerId={mp.playerId}
      settings={mp.roomUpdate.settings}
      startWithBotsVotes={mp.roomUpdate.startWithBotsVotes ?? []}
      isRanked={mp.roomUpdate.isRanked ?? false}
      onStartGame={mp.startGame}
      onVoteStartWithBots={mp.voteStartWithBots}
      onLeave={() => {
        mp.leaveRoom()
        navigate('/online')
      }}
    />
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const mp = useMultiplayerConnection()

  // Auto-navigate on multiplayer room phase changes
  useEffect(() => {
    if (!mp.roomUpdate) return
    const { phase } = mp.roomUpdate

    if (phase === 'waiting' && location.pathname === '/online') {
      navigate('/online/waiting')
    } else if (phase === 'playing' && (location.pathname === '/online/waiting' || location.pathname === '/online')) {
      navigate('/online/game')
    }
  }, [mp.roomUpdate, location.pathname, navigate])

  // Reconnect on page refresh if there's a stored session and we're on an online route
  useEffect(() => {
    const hasSeat = !!sessionStorage.getItem('dudo-multiplayer-seat')
    if (hasSeat && location.pathname.startsWith('/online')) {
      mp.connect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={
          <GameProvider>
            <HomeScreen />
          </GameProvider>
        } />
        <Route path="/game" element={<SinglePlayerGame />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/online" element={<LobbyScreen mp={mp} />} />
        <Route path="/online/waiting" element={<OnlineWaiting mp={mp} />} />
        <Route path="/online/game" element={<OnlineGame mp={mp} />} />
        <Route path="/online/join/:roomCode" element={<JoinRedirect mp={mp} />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Reconnecting overlay — shown on top of the online game */}
      {mp.isReconnecting && location.pathname === '/online/game' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white font-bold">Reconnecting...</p>
            <p className="text-white/50 text-sm mt-1">Please wait</p>
          </div>
        </div>
      )}
    </>
  )
}

export default App
