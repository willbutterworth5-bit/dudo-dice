import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import GameBoard from './components/GameBoard'
import ProfileScreen from './components/ProfileScreen'
import { GameProvider } from './context/GameContext'
import { Difficulty } from './game/AIPlayer'

type Screen = 'home' | 'game' | 'profile'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [playerCount, setPlayerCount] = useState(6)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [startingDice, setStartingDice] = useState(5)
  const [analysisEnabled, setAnalysisEnabled] = useState(false)
  const [palificoEnabled, setPalificoEnabled] = useState(true)
  const [calzaEnabled, setCalzaEnabled] = useState(false)

  const handleStartGame = (count: number, diff: Difficulty, dice: number, analysis: boolean, palifico: boolean, calza: boolean) => {
    setPlayerCount(count)
    setDifficulty(diff)
    setStartingDice(dice)
    setAnalysisEnabled(analysis)
    setPalificoEnabled(palifico)
    setCalzaEnabled(calza)
    setCurrentScreen('game')
  }

  const handleBackToHome = () => {
    setCurrentScreen('home')
  }

  const handleShowProfile = () => {
    setCurrentScreen('profile')
  }

  const handleBackFromProfile = () => {
    setCurrentScreen('home')
  }

  return (
    <GameProvider>
      {currentScreen === 'home' && (
        <HomeScreen
          onStartGame={handleStartGame}
          onShowProfile={handleShowProfile}
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
          onBackToHome={handleBackToHome}
        />
      )}
      {currentScreen === 'profile' && (
        <ProfileScreen onBack={handleBackFromProfile} />
      )}
    </GameProvider>
  )
}

export default App
