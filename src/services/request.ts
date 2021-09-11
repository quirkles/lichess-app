import axios, { AxiosRequestConfig, Method, ResponseType } from 'axios';
import { loadEnv } from './env';

const BASE_URL = 'https://lichess.org';

loadEnv();

export interface IGetGameParams {
  until?: number;
  since?: number;
  max?: number;
  username: string;
  shouldStreamResults: boolean;
}

export const getGames = (getGameParams: IGetGameParams): Promise<unknown> => {
  const { until, max, since, username, shouldStreamResults } = getGameParams;
  let queryString = '?evals=true';
  if (until) {
    queryString += `&until=${until}`;
  }
  if (max) {
    queryString += `&max=${max}`;
  }
  if (since) {
    queryString += `&since=${since}`;
  }
  const axiosConfig: AxiosRequestConfig = {
    baseURL: BASE_URL,
    url: `api/games/user/${username}${queryString}`,
    method: 'GET',
    responseType: shouldStreamResults ? 'stream' : 'json',
    headers: {
      Authorization: `Bearer ${process.env.LICHESS_TOKEN}`,
      Accept: 'application/x-ndjson'
    }
  };
  return axios.request(axiosConfig).then((result) => result.data);
};

export const getSingleGame = (gameId: string): Promise<unknown> => {
  const axiosConfig: AxiosRequestConfig = {
    baseURL: BASE_URL,
    url: `game/export/${gameId}?evals=true`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.LICHESS_TOKEN}`,
      Accept: 'application/json'
    }
  };
  return axios.request(axiosConfig).then((result) => result.data);
};

export const getAccount = (): Promise<unknown> => {
  const axiosConfig: AxiosRequestConfig = {
    baseURL: BASE_URL,
    url: `api/account`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.LICHESS_TOKEN}`
    }
  };
  return axios.request(axiosConfig).then((result) => result.data);
};
