import axios, {AxiosRequestConfig, Method, ResponseType} from 'axios'
import {loadEnv} from "./env";

const BASE_URL = 'https://lichess.org'

loadEnv()

export const getGames = (username: string, shouldStreamResults: boolean = false): Promise<unknown> => {
    let axiosConfig: AxiosRequestConfig = {
        baseURL: BASE_URL,
        url: `api/games/user/${username}?evals=true`,
        method: 'GET',
        responseType: 'stream',
        headers: {
            Authorization: `Bearer ${process.env.LICHESS_TOKEN}`,
            'Accept': 'application/x-ndjson'
        }
    };
    return axios.request(axiosConfig).then(result => result.data)
}

export const getAccount = (): Promise<unknown> => {
    let axiosConfig: AxiosRequestConfig = {
        baseURL: BASE_URL,
        url: `api/account`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.LICHESS_TOKEN}`
        }
    };
    return axios.request(axiosConfig).then(result => result.data)
}
