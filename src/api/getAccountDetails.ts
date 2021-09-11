import { getAccount } from '../services/request';

interface AccountSettings {
  blocking: boolean;
  completionRate: number;
  count: {
    ai: number;
    all: number;
    bookmark: number;
    draw: number;
    drawH: number;
    import: number;
    loss: number;
    lossH: number;
    me: number;
    playing: number;
    rated: number;
    win: number;
    winH: number;
  };
  createdAt: number;
  followable: boolean;
  following: boolean;
  followsYou: boolean;
  id: string;
  nbFollowers: number;
  nbFollowing: number;
  online: true;
  perfs: {
    blitz: {
      games: number;
      prog: number;
      rating: number;
      rd: number;
    };
    bullet: {
      prov: boolean;
      games: number;
      prog: number;
      rating: number;
      rd: number;
    };
    classical: {
      prov: boolean;
      games: number;
      prog: number;
      rating: number;
      rd: number;
    };
    correspondence: {
      prov: boolean;
      games: number;
      prog: number;
      rating: number;
      rd: number;
    };
    puzzle: {
      games: number;
      prog: number;
      rating: number;
      rd: number;
    };
    rapid: {
      games: number;
      prog: number;
      rating: number;
      rd: number;
    };
  };
  playTime: {
    total: number;
    tv: number;
  };
  profile: {
    country: string;
  };
  seenAt: number;
  url: string;
  username: string;
}

export const getAccountDetails = (): Promise<AccountSettings> => {
  return getAccount() as Promise<AccountSettings>;
};
