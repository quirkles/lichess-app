import {getGames, IGetGameParams} from '../services/request';
import { getAccountDetails } from './getAccountDetails';
import { Readable } from 'stream';

export interface GameResponse {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: {
      user: {
        name: string;
        title: string;
        patron: boolean;
        id: string;
      };
      rating: number;
      ratingDiff: number;
    };
    black: {
      user: {
        name: string;
        id: string;
      };
      rating: number;
      ratingDiff: number;
    };
  };
  opening: {
    eco: string;
    name: string;
    ply: number;
  };
  moves: string;
  clock: {
    initial: number;
    increment: number;
    totalTime: number;
  };
  analysis?: {
    eval: number;
    best: string;
    variation: string;
    judgment: {
      name: string;
      comment: string;
    };
  }[];
}

export interface IGameStreamParams {
  until?: number;
  since?: number;
  max?: number;
}

export const getGameStream = async (
  gameStreamParams: IGameStreamParams = {}
): Promise<Readable> => {
  const until = gameStreamParams.until || Date.now();
  const since = gameStreamParams.since || 1356998400070;
  const max = gameStreamParams.max || null;
  const account = await getAccountDetails();
  const getGameParams: IGetGameParams = {
    until,
    since,
    username: account.username,
    shouldStreamResults: true
  };
  if (max) {
    getGameParams.max = max;
  }
  return getGames(getGameParams) as Promise<Readable>;
};
