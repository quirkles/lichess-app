import { Readable } from 'stream';
import { TextDecoder } from 'util';

import { GameResponse, getGameStream } from '../api/getGameStream';
import { initConnection } from '../db/connection';
import { IGame, Game } from '../db/Entities/game';
import { IGameScan, GameScan } from '../db/Entities/gameScans';

type CallBack = (arg: GameResponse) => Promise<IGame>;

initConnection();

const gamesWithAnalysisIds: string[] = [];

const createReadStream =
  (cb: CallBack) =>
  (response: Readable): Promise<IGameScan> => {
    const gameScanData: IGameScan = {
      games: [],
      scanBeginTime: Date.now(),
      scanEndTime: null,
      earliestCreatedAtFromScan: null,
      latestLastMoveFromScan: null
    } as IGameScan;
    const matcher = /\r?\n/;
    const decoder = new TextDecoder();
    let buf = '';
    return new Promise((resolve, fail) => {
      const promises: Promise<IGame>[] = [];
      response.on('data', (v: Buffer) => {
        const chunk = decoder.decode(v, { stream: true });
        buf += chunk;

        const parts = buf.split(matcher);
        buf = parts.pop() as string;

        for (const i of parts) {
          const gameResponse: GameResponse = JSON.parse(i);
          gameScanData.earliestCreatedAtFromScan = Math.min(
            gameScanData.earliestCreatedAtFromScan || Number.POSITIVE_INFINITY,
            gameResponse.createdAt
          );
          gameScanData.latestLastMoveFromScan = Math.max(
            gameScanData.latestLastMoveFromScan || Number.NEGATIVE_INFINITY,
            gameResponse.lastMoveAt
          );
          promises.push(cb(gameResponse));
        }
      });
      response.on('end', () => {
        if (buf.length > 0) {
          promises.push(cb(JSON.parse(buf)));
        }
        gameScanData.scanEndTime = Date.now();
        Promise.all(promises)
          .then((games) => {
            gameScanData.games = [
              ...gameScanData.games,
              ...games.map((game) => game.id)
            ];
            resolve(gameScanData);
          })
          .catch(fail);
      });
      response.on('error', fail);
    });
  };

const gameHandler = (game: GameResponse): Promise<IGame> => {
  const { id, ...rest } = game;
  console.log(`saving: ${id}`) //eslint-disable-line
  const gameModel = new Game({
    lichessId: id,
    ...rest
  });
  if (rest.analysis) {
    gamesWithAnalysisIds.push(id);
  }
  Game.updateOne({ lichessId: id }, gameModel, { upsert: true });
  return gameModel
    .save()
    .then((saved) => {
      return saved;
    })
    .catch((err) => {
        console.log(`failed to save game: ${err.message}`) //eslint-disable-line
      throw err;
    });
};

const pullGames = () => {
  let gamesSaved: string[];
  return Game.findOne()
    .sort('-createdAt')
    .then((game) => {
      const since = game?.createdAt || 1356998400070;
      return getGameStream({ since });
    })
    .then(createReadStream(gameHandler))
    .then((gameScanData) => {
      gamesSaved = gameScanData.games;
      const gameScan = new GameScan(gameScanData);
      return gameScan.save();
    })
    .then(() => gamesSaved)
    .catch((err) => {
      console.log(err);
      return null;
    });
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const pollGames = async () => {
  const gamesInserted = await pullGames();
  console.log(`saved ${gamesInserted?.length || 0} games`) //eslint-disable-line
  process.exit();
};

pollGames();
