import * as schema from './schema';
import {LibSQLDatabase} from 'drizzle-orm/libsql';

export type SqliteDatabase = LibSQLDatabase<typeof schema>;