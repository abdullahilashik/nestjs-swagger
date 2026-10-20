import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
// import {LibSQLDatabase} from 'drizzle-orm/libsql';

// export type SqliteDatabase = LibSQLDatabase<typeof schema>;
export type DatabaseDriverPg = NodePgDatabase<typeof schema>;