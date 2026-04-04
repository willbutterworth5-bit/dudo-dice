export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_game',       name: 'First Roll',             icon: '🎲', description: 'Play your first game' },
  { id: 'getting_hang',     name: 'Getting the Hang of It', icon: '📈', description: 'Play 10 games' },
  { id: 'dice_devotee',     name: 'Dice Devotee',           icon: '🎰', description: 'Play 100 games' },
  { id: 'first_win',        name: 'Perudo Prodigy',         icon: '🏆', description: 'Win your first game' },
  { id: 'seasoned_gambler', name: 'Seasoned Gambler',       icon: '🃏', description: 'Win 25 games' },
  { id: 'master_of_bluff',  name: 'Master of Bluff',        icon: '👑', description: 'Win 100 games' },
  { id: 'bold_bluffer',     name: 'Bold Bluffer',           icon: '😏', description: 'Successfully bluff 5 times' },
  { id: 'cold_blooded',     name: 'Cold-Blooded Caller',    icon: '🧊', description: 'Successfully call Dudo 10 times' },
  { id: 'mind_reader',      name: 'Mind Reader',            icon: '🔮', description: 'Correctly call a bluff 3 times in a row' },
  { id: 'calculated_risk',  name: 'Calculated Risk',        icon: '🎯', description: 'Make a bid that is exactly correct' },
  { id: 'impossible_odds',  name: 'Impossible Odds',        icon: '💪', description: 'Win a game with only 1 die left' },
  { id: 'dice_whisperer',   name: 'Dice Whisperer',         icon: '🌟', description: 'Win a game after being down to 1 die' },
  { id: 'friendly_face',    name: 'Friendly Face',          icon: '😊', description: 'Play online with 5 different players' },
  { id: 'social_butterfly', name: 'Social Butterfly',       icon: '🦋', description: 'Play online with 20 different players' },
  { id: 'hot_streak',       name: 'Hot Streak',             icon: '🔥', description: 'Win 3 games in a row' },
  { id: 'unstoppable',      name: 'Unstoppable',            icon: '⚡', description: 'Win 7 games in a row' },
  { id: 'perfect_game',     name: 'Perfect Game',           icon: '✨', description: 'Win a game without losing a single die' },
  { id: 'comeback_king',    name: 'Comeback King',          icon: '👊', description: 'Win a game after being behind by 3+ dice' },
  { id: 'night_owl',        name: 'Night Owl',              icon: '🦉', description: 'Play a game between 2am–5am' },
  { id: 'early_bird',       name: 'Early Bird',             icon: '🐦', description: 'Play a game between 5am–7am' },
  { id: 'the_oracle',       name: 'The Oracle',             icon: '🪄', description: 'Make 5 valid bids in a row that are challenged' },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
