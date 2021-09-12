import * as mongoose from 'mongoose';

export interface IGame {
  id: string;
  lichessId: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  pgn: string,
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
      analysis?: {
        inaccuracy: number;
        mistake: number;
        blunder: number;
        acpl: number;
      };
    };
    black: {
      user: {
        name: string;
        id: string;
      };
      rating: number;
      ratingDiff: number;
      analysis?: {
        inaccuracy: number;
        mistake: number;
        blunder: number;
        acpl: number;
      };
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

const gameSchema = new mongoose.Schema<IGame>({
  lichessId: String,
  rated: Boolean,
  variant: String,
  speed: String,
  perf: String,
  pgn: String,
  createdAt: Number,
  lastMoveAt: Number,
  status: String,
  players: {
    white: {
      user: {
        name: String,
        title: String,
        patron: Boolean,
        id: String
      },
      rating: Number,
      ratingDiff: Number,
      analysis: {
        inaccuracy: Number,
        mistake: Number,
        blunder: Number,
        acpl: Number
      }
    },
    black: {
      user: {
        name: String,
        id: String
      },
      rating: Number,
      ratingDiff: Number,
      analysis: {
        inaccuracy: Number,
        mistake: Number,
        blunder: Number,
        acpl: Number
      }
    }
  },
  opening: {
    eco: String,
    name: String,
    ply: Number
  },
  moves: String,
  clock: {
    initial: Number,
    increment: Number,
    totalTime: Number
  },
  analysis: [
    {
      eval: Number,
      best: String,
      variation: String,
      judgment: {
        name: String,
        comment: String
      }
    }
  ]
});

export const Game = mongoose.model<IGame>('Game', gameSchema);
