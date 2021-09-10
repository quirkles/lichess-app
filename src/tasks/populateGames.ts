import {Readable} from "stream";
import {TextDecoder} from "util";

import {GameResponse, getGameStream} from "../api/getGameStream";
import {initConnection} from "../db/connection";
import {IGame, Game} from "../db/Entities/game";
import {IGameScan, GameScan} from "../db/Entities/gameScans";

type CallBack = (arg: GameResponse) => Promise<IGame>

initConnection()

const gameScanData: IGameScan = {
    games: [],
    scanBeginTime: Date.now(),
    scanEndTime: null,
    earliestCreatedAtFromScan: null,
    latestLastMoveFromScan: null
} as IGameScan

const readStream = (cb: CallBack) => (response: Readable) => {
    const matcher = /\r?\n/;
    const decoder = new TextDecoder();
    let buf: string = '';
    return new Promise((resolve, fail) => {
        const promises:Promise<IGame>[] = []
        response.on('data', (v: Buffer) => {
            const chunk = decoder.decode(v, { stream: true });
            buf += chunk;

            const parts = buf.split(matcher);
            buf = parts.pop() as string;


            for (const i of parts) {
                const gameResponse: GameResponse = JSON.parse(i)
                gameScanData.earliestCreatedAtFromScan = Math.min(
                    gameScanData.earliestCreatedAtFromScan || Number.POSITIVE_INFINITY,
                    gameResponse.createdAt
                )
                gameScanData.latestLastMoveFromScan = Math.max(
                    gameScanData.latestLastMoveFromScan || Number.NEGATIVE_INFINITY,
                    gameResponse.lastMoveAt
                )
                promises.push(cb(gameResponse));
            }
        });
        response.on('end', () => {
            if (buf.length > 0) {
                promises.push(cb(JSON.parse(buf)));
            }
            gameScanData.scanEndTime = Date.now()
            Promise.all(promises).then(games => {
                gameScanData.games = [...gameScanData.games, ...games.map(game => game.id)]
                resolve(null)
            }).catch(fail)
        });
        response.on('error', fail);
    });
};

const gameHandler = (game: GameResponse): Promise<IGame> => {
    const {id, ...rest} = game
    const gameModel = new Game({
        lichessId: id,
        ...rest
    })
    return gameModel.save().then((saved) => {
        console.log('saved game') //eslint-disable-line
        return saved
    }).catch(err => {
        console.log(`failed to save game: ${err.message}`) //eslint-disable-line
        throw err
    })
}

getGameStream()
    .then(readStream(gameHandler))
    .then(() => {
        const gameScan = new GameScan(gameScanData)
        return gameScan.save()
    })
    .then(() => {
        process.exit()
    })
    .catch(err => console.log(err))

