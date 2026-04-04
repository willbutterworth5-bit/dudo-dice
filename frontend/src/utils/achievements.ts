export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_game',    name: 'First Roll',    icon: '🎲', description: 'Play your first game' },
  { id: 'first_win',     name: 'First Win',     icon: '🏆', description: 'Win your first game' },
  { id: 'first_dudo',    name: 'Dudo!',         icon: '📣', description: 'Make a successful Dudo call' },
  { id: 'survivor',      name: 'Last Stand',    icon: '💪', description: 'Win a game from 1 die' },
  { id: 'untouchable',   name: 'Untouchable',   icon: '✨', description: 'Win without losing any dice' },
  { id: 'calza',         name: 'Calza!',        icon: '⚖️', description: 'Make a successful Calza call' },
  { id: 'sharp_shooter', name: 'Sharp Shooter', icon: '🎯', description: '5 successful Dudos in one game' },
  { id: 'hard_mode',     name: 'Hard Mode',     icon: '💀', description: 'Win on Hard difficulty' },
  { id: 'on_a_roll',     name: 'On A Roll',     icon: '🔥', description: 'Win 3 games in a row' },
  { id: 'champion',      name: 'Champion',      icon: '👑', description: 'Win 10 games' },
  { id: 'dudo_master',   name: 'Dudo Master',   icon: '🌟', description: 'Make 25 successful Dudo calls' },
  { id: 'veteran',       name: 'Veteran',       icon: '🎖️', description: 'Play 50 games' },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
