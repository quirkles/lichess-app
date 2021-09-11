import { getSingleGame } from '../services/request';
import { IGame } from '../db/Entities/game';

export const getSingleGameDetails = (gameId: string): Promise<IGame> =>
  getSingleGame(gameId) as Promise<IGame>;
