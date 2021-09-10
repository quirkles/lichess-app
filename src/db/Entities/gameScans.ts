import * as mongoose from "mongoose";

export interface IGameScan {
    games: string[],
    scanBeginTime: number | null,
    scanEndTime: number | null,
    earliestCreatedAtFromScan: number | null,
    latestLastMoveFromScan: number | null,
}
const gameScanSchema = new mongoose.Schema<IGameScan>({
    games: [String],
    scanBeginTime: Number,
    scanEndTime: Number,
    earliestCreatedAtFromScan: Number,
    latestLastMoveFromScan: Number,
});

export const GameScan = mongoose.model<IGameScan>('GameScan', gameScanSchema);
