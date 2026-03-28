import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import HomeScreen from './components/HomeScreen'
import GameBoard from './components/GameBoard'
import ProfileScreen from './components/ProfileScreen'
import LobbyScreen from './components/LobbyScreen'
import WaitingRoom from './components/WaitingRoom'
import { GameProvider } from './context/GameContext'
import { useMultiplayerConnection } from './hooks/useMultiplayerConnection'
import type { Difficulty } from './game/AIPlayer'

type Screen = 'landing' | 'home' | 'game' | 'profile' | 'lobby' | 'waiting' | 'online-game'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing')
  const [playerCount, setPlayerCount] = useState(6)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [startingDice, setStartingDice] = useState(5)
  const [analysisEnabled, setAnalysisEnabled] = useState(false)
  const [palificoEnabled, setPalificoEnabled] = useState(true)
  const [calzaEnabled, setCalzaEnabled] = useState(false)
  const [profileReturnScreen, setProfileReturnScreen] = useState<Screen>('home')

  const mp = useMultiplayerConnection()

  const handleStartGame = (count: number, diff: Difficulty, dice: number, analysis: boolean, palifico: boolean, calza: boolean) => {
    setPlayerCount(count)
    setDifficulty(diff)
    setStartingDice(dice)
    setAnalysisEnabled(analysis)
    setPalificoEnabled(palifico)
    setCalzaEnabled(calza)
    setCurrentScreen('game')
  }

  const handlePlayOnline = () => {
    mp.connect()
    setCurrentScreen('lobby')
  }

  const handleBackToHome = () => {
    mp.disconnect()
    setCurrentScreen('landing')
  }

  // Watch for room updates to auto-navigate
  useEffect(() => {
    if (mp.roomUpdate) {
      if (mp.roomUpdate.phase === 'waiting' && currentScreen === 'lobby') {
        setCurrentScreen('waiting')
      } else if (mp.roomUpdate.phase === 'playing' && (currentScreen === 'waiting' || currentScreen === 'lobby')) {
        setCurrentScreen('online-game')
      }
    }
  }, [mp.roomUpdate, currentScreen])

  return (
    <GameProvider>
      {currentScreen === 'landing' && (
        <LandingPage
          onPlayComputer={() => setCurrentScreen('home')}
          onPlayOnline={handlePlayOnline}
        />
      )}
      {currentScreen === 'home' && (
        <HomeScreen
          onStartGame={handleStartGame}
          onShowProfile={() => { setProfileReturnScreen('home'); setCurrentScreen('profile') }}
          onBack={() => setCurrentScreen('landing')}
        />
      )}
      {currentScreen === 'game' && (
        <GameBoard
          playerCount={playerCount}
          difficulty={difficulty}
          startingDice={startingDice}
          analysisEnabled={analysisEnabled}
          palificoEnabled={palificoEnabled}
          calzaEnabled={calzaEnabled}
          onBackToHome={() => setCurrentScreen('home')}
        />
      )}
      {currentScreen === 'profile' && (
        <ProfileScreen onBack={() => setCurrentScreen(profileReturnScreen)} />
      )}
      {currentScreen === 'lobby' && (
        <LobbyScreen
          isConnected={mp.isConnected}
          publicRooms={mp.publicRooms}
          error={mp.error}
          onCreateRoom={mp.createRoom}
          onJoinRoom={mp.joinRoom}
          onQuickMatch={mp.quickMatch}
          onListRooms={mp.listRooms}
          onShowProfile={() => { setProfileReturnScreen('lobby'); setCurrentScreen('profile') }}
          onBack={handleBackToHome}
        />
      )}
      {currentScreen === 'waiting' && mp.roomUpdate && (
        <WaitingRoom
          roomCode={mp.roomUpdate.roomCode}
          players={mp.roomUpdate.players}
          hostId={mp.roomUpdate.hostId}
          mySessionId={mp.sessionId}
          settings={mp.roomUpdate.settings}
          onStartGame={mp.startGame}
          onLeave={() => {
            mp.leaveRoom()
            setCurrentScreen('lobby')
          }}
        />
      )}
      {currentScreen === 'online-game' && mp.gameState && (
        <GameBoard
          playerCount={mp.gameState.players.length}
          difficulty="medium"
          startingDice={mp.gameState.settings.startingDice}
          analysisEnabled={false}
          palificoEnabled={mp.gameState.settings.palificoEnabled}
          calzaEnabled={mp.gameState.settings.calzaEnabled}
          onBackToHome={() => {
            mp.disconnect()
            setCurrentScreen('home')
          }}
          multiplayerMode={{
            sessionId: mp.sessionId,
            gameState: mp.gameState,
            turnTimeRemaining: mp.turnTimeRemaining,
            roundResult: mp.roundResult,
            winnerId: mp.winnerId,
            isReconnecting: mp.isReconnecting,
            roomPlayers: mp.roomUpdate?.players ?? [],
            onMakeBid: mp.makeBid,
            onChallenge: mp.challenge,
            onCalza: mp.calza,
          }}
        />
      )}
      {/* Reconnecting overlay */}
      {mp.isReconnecting && currentScreen === 'online-game' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white font-bold">Reconnecting...</p>
            <p className="text-white/50 text-sm mt-1">Please wait</p>
          </div>
        </div>
      )}
    </GameProvider>
  )
}

export default App
