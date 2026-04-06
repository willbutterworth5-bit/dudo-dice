import type { Player } from '../../game/GameState';

export const BOARD_BASE = 450;
const MOBILE_VERTICAL_RESERVE = 240;

export function getResponsiveBoardSize(viewportWidth: number, viewportHeight: number): number {
  const isMobile = viewportWidth < 640;
  const widthBased = viewportWidth - 48;
  const heightBased = isMobile ? viewportHeight - MOBILE_VERTICAL_RESERVE : BOARD_BASE;
  return getBoardSizeForAvailableSpace(widthBased, heightBased);
}

export function getBoardSizeForAvailableSpace(availableWidth: number, availableHeight: number): number {
  return Math.min(
    BOARD_BASE,
    Math.max(0, availableWidth),
    Math.max(0, availableHeight),
  );
}

export function getBoardScale(boardSize: number): number {
  return Math.min(1, Math.max(0, boardSize / BOARD_BASE));
}

export function findMyPlayerIndex(
  players: Player[],
  isMultiplayer: boolean,
  playerId?: string | null,
): number {
  return isMultiplayer
    ? players.findIndex(player => player.id === playerId)
    : players.findIndex(player => player.isHuman);
}

export function isMyPlayer(
  players: Player[],
  candidatePlayerId: string,
  isMultiplayer: boolean,
  playerId?: string | null,
): boolean {
  return isMultiplayer
    ? candidatePlayerId === playerId
    : players.find(player => player.id === candidatePlayerId)?.isHuman ?? false;
}

export function buildSectorPlayerIndexes(
  players: Player[],
  isMultiplayer: boolean,
  playerId?: string | null,
): (number | null)[] {
  const myPlayerIndex = findMyPlayerIndex(players, isMultiplayer, playerId);
  const playerCount = players.length;
  const sectorToPlayerIdx: (number | null)[] = [null, null, null, myPlayerIndex, null, null];

  for (let i = 0; i < Math.min(myPlayerIndex, 3); i += 1) {
    sectorToPlayerIdx[2 - i] = ((myPlayerIndex - 1 - i) + playerCount) % playerCount;
  }

  for (let i = 0; i < Math.min(playerCount - 1 - myPlayerIndex, 2); i += 1) {
    sectorToPlayerIdx[4 + i] = myPlayerIndex + 1 + i;
  }

  return sectorToPlayerIdx;
}

export function buildSectorPlayers(
  players: Player[],
  isMultiplayer: boolean,
  playerId?: string | null,
): (Player | null)[] {
  return buildSectorPlayerIndexes(players, isMultiplayer, playerId).map(index =>
    index !== null ? players[index] : null,
  );
}
