import { type Type, type } from 'arktype';
import type { defineConfig } from 'drizzle-kit';
import type { ColumnsSelection } from 'drizzle-orm';
import {
	type BaseSQLiteDatabase,
	type SQLiteTable,
	type SubqueryWithSelection,
	integer,
	sqliteTable,
	text,
} from 'drizzle-orm/sqlite-core';

type DrizzleConfig = ReturnType<typeof defineConfig>;

type ColumnDescriptions<T extends Record<string, SQLiteTable>> = {
	[K in keyof T]: {
		[C in keyof T[K]['_']['columns']]: string;
	};
};

type View<
	T extends string,
	TSelection extends ColumnsSelection,
	TSchema extends Record<string, SQLiteTable>,
	TDatabase extends BaseSQLiteDatabase<'sync' | 'async', TSchema>,
> = {
	name: T;
	definition: (db: TDatabase) => SubqueryWithSelection<TSelection, string>;
};

export interface Adapter<
	TSchema extends Record<string, SQLiteTable> = Record<string, SQLiteTable>,
	TDatabase extends BaseSQLiteDatabase<
		'sync' | 'async',
		TSchema
	> = BaseSQLiteDatabase<'sync' | 'async', TSchema>,
	TParserShape extends Type = Type,
	TParsed = TParserShape['infer'],
> {
	/**
	 * User-facing name
	 * @example "Reddit Adapter"
	 */
	name: string;

	/** Database schema */
	schema: TSchema;

	/** Column descriptions for every table/column */
	metadata: ColumnDescriptions<TSchema>;

	/**
	 * ArkType schema for parsing/validation
	 *
	 * This will be used by the MCP server to validate data returned from the `parse` method.
	 */
	parseSchema: TParserShape;

	/**
	 * Predefined views/CTEs
	 *
	 * Should be used for common queries that a user will want to query for. This is especially helpful if the data storage format is complex/unintuitive.
	 *
	 * @example
	 * "recently_played": {
	 * 	description: "Recently played songs",
	 * 	definition: (db) => db.select().from(songs).where(...)
	 * }
	 */
	views?: {
		[Alias in string]: View<Alias, ColumnsSelection, TSchema, TDatabase>;
	};

	/**
	 * Drizzle config
	 *
	 * @example
	 * defineConfig({
	 * 	dialect: 'sqlite',
	 * 	schema: './src/schema.ts',
	 * 	out: './migrations',
	 * 	migrations: {
	 * 		table: 'test_migrations',
	 * 	},
	 * })
	 */
	drizzleConfig: DrizzleConfig;

	// Lifecycle hooks

	/**
	 * Parse a blob into a parsed representation
	 * @example
	 * const text = await b.text();
	 * return JSON.parse(text);
	 */
	parse: (file: Blob) => Promise<unknown>;

	/** Upsert data into the database */
	upsert: (db: TDatabase, data: TParsed) => Promise<void>;
}

export function defineAdapter<
	TDatabase extends BaseSQLiteDatabase<'sync' | 'async', TSchema>,
	TSchema extends Record<string, SQLiteTable>,
	TParserShape extends Type,
	TParsed = TParserShape['infer'],
>(
	adapter: Adapter<TSchema, TDatabase, TParserShape, TParsed>,
): Adapter<TSchema, TDatabase, TParserShape, TParsed> {
	return adapter;
}

// Example
// TODO remove

const songs = sqliteTable('songs', {
	id: integer('id').primaryKey(),
	title: text('title'),
	artist: text('artist'),
	album: text('album'),
	year: integer('year'),
});

const testAdapter = defineAdapter({
	name: 'Test Adapter',
	parseSchema: type({
		id: 'number',
		title: 'string',
		artist: 'string',
		album: 'string',
		year: 'number',
	}),
	schema: {
		songs,
	},
	drizzleConfig: {
		dialect: 'sqlite',
		schema: './src/schema.ts',
		casing: 'snake_case',
		strict: true,
		out: './migrations',
		migrations: {
			table: 'test_migrations',
		},
	},
	parse: (file) => file.text().then(JSON.parse),
	upsert: (db, data) =>
		db
			.insert(songs)
			.values(data)
			.onConflictDoUpdate({
				target: songs.id,
				set: {
					title: data.title,
					artist: data.artist,
					album: data.album,
					year: data.year,
				},
			})
			.then(() => undefined),
	metadata: {
		songs: {
			id: 'Unique identifier for the song',
			title: 'Title of the song',
			artist: 'Artist of the song',
			album: 'Album of the song',
			year: 'Year of release',
		},
	},
});
