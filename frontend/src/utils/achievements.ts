export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  nameEs: string;
  descriptionEs: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_game',       name: 'First Roll',             icon: '🎲', description: 'Play your first game',                             nameEs: 'Primera tirada',         descriptionEs: 'Juega tu primera partida' },
  { id: 'getting_hang',     name: 'Getting the Hang of It', icon: '📈', description: 'Play 10 games',                                    nameEs: 'Cogiendo el truco',      descriptionEs: 'Juega 10 partidas' },
  { id: 'dice_devotee',     name: 'Dice Devotee',           icon: '🎰', description: 'Play 100 games',                                   nameEs: 'Devoto de los dados',    descriptionEs: 'Juega 100 partidas' },
  { id: 'first_win',        name: 'Perudo Prodigy',         icon: '🏆', description: 'Win your first game',                             nameEs: 'Prodigio del Perudo',    descriptionEs: 'Gana tu primera partida' },
  { id: 'seasoned_gambler', name: 'Seasoned Gambler',       icon: '🃏', description: 'Win 25 games',                                    nameEs: 'Jugador experimentado', descriptionEs: 'Gana 25 partidas' },
  { id: 'master_of_bluff',  name: 'Master of Bluff',        icon: '👑', description: 'Win 100 games',                                   nameEs: 'Maestro del farol',      descriptionEs: 'Gana 100 partidas' },
  { id: 'bold_bluffer',     name: 'Bold Bluffer',           icon: '😏', description: 'Successfully bluff 5 times',                     nameEs: 'Farolero audaz',         descriptionEs: 'Haz un farol con éxito 5 veces' },
  { id: 'cold_blooded',     name: 'Cold-Blooded Caller',    icon: '🧊', description: 'Successfully call Dudo 10 times',                 nameEs: 'Sangre fría',            descriptionEs: 'Llama Dudo con éxito 10 veces' },
  { id: 'mind_reader',      name: 'Mind Reader',            icon: '🔮', description: 'Correctly call a bluff 3 times in a row',         nameEs: 'Lector de mentes',       descriptionEs: 'Adivina un farol 3 veces seguidas' },
  { id: 'calculated_risk',  name: 'Calculated Risk',        icon: '🎯', description: 'Make a bid that is exactly correct',              nameEs: 'Riesgo calculado',       descriptionEs: 'Haz una apuesta exactamente correcta' },
  { id: 'impossible_odds',  name: 'Impossible Odds',        icon: '💪', description: 'Win a game with only 1 die left',                 nameEs: 'Contra todo pronóstico', descriptionEs: 'Gana una partida con solo 1 dado' },
  { id: 'dice_whisperer',   name: 'Dice Whisperer',         icon: '🌟', description: 'Win a game after being down to 1 die',            nameEs: 'Susurrador de dados',    descriptionEs: 'Gana una partida tras quedar con 1 dado' },
  { id: 'friendly_face',    name: 'Friendly Face',          icon: '😊', description: 'Play online with 5 different players',            nameEs: 'Cara amigable',          descriptionEs: 'Juega en línea con 5 jugadores distintos' },
  { id: 'social_butterfly', name: 'Social Butterfly',       icon: '🦋', description: 'Play online with 20 different players',           nameEs: 'Mariposa social',        descriptionEs: 'Juega en línea con 20 jugadores distintos' },
  { id: 'hot_streak',       name: 'Hot Streak',             icon: '🔥', description: 'Win 3 games in a row',                            nameEs: 'Racha ganadora',         descriptionEs: 'Gana 3 partidas seguidas' },
  { id: 'unstoppable',      name: 'Unstoppable',            icon: '⚡', description: 'Win 7 games in a row',                            nameEs: 'Imparable',              descriptionEs: 'Gana 7 partidas seguidas' },
  { id: 'perfect_game',     name: 'Perfect Game',           icon: '✨', description: 'Win a game without losing a single die',          nameEs: 'Partida perfecta',       descriptionEs: 'Gana una partida sin perder ningún dado' },
  { id: 'comeback_king',    name: 'Comeback King',          icon: '👊', description: 'Win a game after being behind by 3+ dice',        nameEs: 'Rey de la remontada',    descriptionEs: 'Gana una partida tras ir por detrás en 3+ dados' },
  { id: 'night_owl',        name: 'Night Owl',              icon: '🦉', description: 'Play a game between 2am–5am',                     nameEs: 'Noctámbulo',             descriptionEs: 'Juega una partida entre las 2–5 de la madrugada' },
  { id: 'early_bird',       name: 'Early Bird',             icon: '🐦', description: 'Play a game between 5am–7am',                     nameEs: 'Madrugador',             descriptionEs: 'Juega una partida entre las 5–7 de la mañana' },
  { id: 'the_oracle',       name: 'The Oracle',             icon: '🪄', description: 'Make 5 valid bids in a row that are challenged',  nameEs: 'El oráculo',             descriptionEs: 'Haz 5 apuestas válidas seguidas que sean desafiadas' },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
