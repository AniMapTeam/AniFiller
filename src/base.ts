import { regex, TraversalError, type } from 'arktype';

const _schema_manga_canon = type("'manga-canon'").describe(
	'The episode is based on the manga, and is considered canon.',
);
const _schema_filler = type("'filler'").describe('The episode is not based on the manga, and is considered filler.');
const _schema_mixed_manga = type("'mixed-manga'").describe(
	'The episode is based on the manga, but also contains filler content.',
);
const _schema_anime_canon = type("'anime-canon'").describe(
	'The episode is not based on the manga, but is considered canon by the anime adaptation.',
);

const schema_episode_type = _schema_anime_canon.or(_schema_filler).or(_schema_manga_canon).or(_schema_mixed_manga);

const _date_type = regex('^(\\d{4})-(\\d{2})-(\\d{2})$');

const schema_episode = type({
	episode: type.number.atLeast(1).describe('The episode number.'),
	title: type.string.describe('The episode title.'),
	type: schema_episode_type,
	aired_date: type(_date_type).describe('The air date of the episode, in YYYY-MM-DD format.'),
	override_date: type
		.enumerated(true)
		.describe('Whether to ignore the aired_date when validating sorting of dates.')
		.optional(),
});

const schema_mapping = type({
	anilist_id: type.number.atLeast(1).describe("The show's Anilist ID."),
	mal_id: type.number.atLeast(1).or(type.null).describe("The show's MyAnimeList ID."),
});

export const schema_show = type({
	title: type.string.describe('The show title.'),
	comments: type.string
		.array()
		.describe(
			'Leave some notes about the show, for editorial purposes. This field is not required, and will not be included in the output.',
		)
		.optional(),
	mappings: schema_mapping.describe('IDs for the show on various anime databases.'),
	episodes: schema_episode.array().atLeastLength(1).describe('An array of episodes for the show.'),
});
export type Show = typeof schema_show.infer;

export class AniFillerError extends Error {
	constructor(message: string, slug: string) {
		super(`error in ${slug}.json:\n${message}`);
		this.name = 'AniFillerError';
	}
}

export function show(data: Show, slug: string) {
	try {
		return schema_show.assert(data);
	} catch (e) {
		if (e instanceof TraversalError) throw new AniFillerError(e.message, slug);
		throw e;
	}
}

export const schema_show_full = type({
	'+': 'delete',
	slug: type.string.describe('a slug for the show, used in the URL and as the filename (without .json)'),
	title: schema_show.get('title'),
	mappings: schema_show.get('mappings'),
	episodes: schema_show.get('episodes'),
});
export type ShowFull = typeof schema_show_full.infer;
