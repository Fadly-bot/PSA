import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/tbm_semesta_alam';

export const client = postgres(connectionString);
export const db = drizzle(client, { schema: { ...schema, ...relations } });
export type DB = typeof db;
