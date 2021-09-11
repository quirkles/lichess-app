import { Readable } from 'stream';
import { TextDecoder } from 'util';

import { GameResponse, getGameStream } from '../api/getGameStream';
import { initConnection } from '../db/connection';
import { IGame, Game } from '../db/Entities/game';
import { IGameScan, GameScan } from '../db/Entities/gameScans';
import { getSingleGameDetails } from '../api/getSingleGame';

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

const savePlayerAnalyses = (game: IGame) => {
  Game.findOneAndUpdate({ lichessId: game.id }, { players: game.players });
};

const pullGames = () => {
  let gamesSaved: string[];
  return Game.findOne()
    .sort('lastMoveAt')
    .then((game) => {
      const until = (game?.createdAt || Date.now()) - 1;
      return getGameStream({ until, max: 100 });
    })
    .then(createReadStream(gameHandler))
    .then((gameScanData) => {
      gamesSaved = gameScanData.games;
      const gameScan = new GameScan(gameScanData);
      return gameScan.save();
    })
    .then(() =>
      Promise.all(
        gamesWithAnalysisIds.map((gameId) =>
          getSingleGameDetails(gameId).catch(() => {
            console.log('failed to save individual analysis', gameId);
            return null;
          })
        )
      )
    )
    .then((gamesWithAnalysis) =>
      Promise.all(
        gamesWithAnalysis.map((game) =>
          game ? savePlayerAnalyses(game) : null
        )
      )
    )
    .then(() => gamesSaved)
    .catch((err) => {
      console.log(err);
      return null;
    });
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const pollGames = async () => {
  let allGamesSaved = 0;
  let gamesInserted = await pullGames();
  while (gamesInserted?.length) {
    allGamesSaved += gamesInserted?.length;
    console.log(`saved ${gamesInserted.length} games ${allGamesSaved} total. Pulling again in 3 minutes.`) //eslint-disable-line
    await sleep(1000 * 60 * 3);
    gamesInserted = await pullGames();
  }
  console.log(`Saved ${allGamesSaved} games, none more found. Exiting!`) //eslint-disable-line
  process.exit();
};

pollGames();
