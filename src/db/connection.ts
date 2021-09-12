import { Connection, connect, createConnection } from 'mongoose';
import { loadEnv } from '../services/env';

loadEnv();

let connection: Connection;

export async function initConnection(): Promise<Connection> {
  if (connection) {
    return connection;
  }
  const mongoose = await connect(process.env.MONGODB_STRING as string);
  return mongoose.connection;
}
