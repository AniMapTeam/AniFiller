import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { AniFillerError, type ShowFull, schema_show_full, show } from '$base';
import { proj_root } from '$utils';

const data_dir = join(proj_root, 'data');
const out_dir = join(proj_root, 'dist');
const out_path = join(out_dir, 'anifiller.json');
const out_min_path = join(out_dir, 'anifiller.min.json');

console.log(`Reading shows from ${data_dir}...`);
const files = await readdir(data_dir).then((x) =>
	x.toSorted((a, b) => {
		const a_name = basename(a, '.json');
		const b_name = basename(b, '.json');
		return a_name.localeCompare(b_name);
	}),
);
for (const x of files) console.log(x);
console.log();

const shows: ShowFull[] = [];

for (const file of files) {
	if (!file.endsWith('.json')) continue;
	const slug = basename(file, '.json');
	let mod: { default: ReturnType<JSON['parse']> };
	try {
		mod = await import(`${join(data_dir, file)}`);
	} catch (e) {
		throw new Error(`Failed to import file ${file}: ${(e as Error).message}`);
	}
	const data = mod.default;
	if (!('$schema' in data)) throw new Error(`File ${file} does not have a $schema property`);
	delete data.$schema;

	const x = show(data, slug);

	const existing = shows.find(
		(s) => s.mappings.anilist_id === x.mappings.anilist_id || s.mappings.mal_id === x.mappings.mal_id,
	);
	if (existing)
		throw new AniFillerError(
			`Duplicate mapping found in file ${file} for show ${x.title} (Anilist ID: ${x.mappings.anilist_id}, MAL ID: ${x.mappings.mal_id})`,
			slug,
		);
	const first_ep = x.episodes[0];
	if (first_ep.episode !== 1)
		throw new AniFillerError(`First episode is not episode 1. Found episode ${first_ep.episode} instead.`, slug);

	shows.push(
		schema_show_full.assert({
			slug,
			title: x.title,
			mappings: {
				anilist_id: x.mappings.anilist_id,
				mal_id: x.mappings.mal_id,
			},
			episodes: x.episodes.map((e) => ({
				episode: e.episode,
				title: e.title,
				type: e.type,
				aired_date: e.aired_date,
				...(e.override_date ? { override_date: e.override_date } : {}),
			})),
		}),
	);
}

// now to validate the shows have episode 1->n with no duplicates or missing episodes, and that the aired_date is in ascending order
for (const show of shows) {
	const seen_episodes = new Set<number>();
	let previous_episode = show.episodes[0];
	for (const ep of show.episodes) {
		if (seen_episodes.has(ep.episode))
			throw new AniFillerError(`Duplicate episode number ${ep.episode} found in show ${show.title}`, show.slug);

		if (
			ep !== previous_episode &&
			!ep.override_date &&
			!previous_episode.override_date &&
			ep.aired_date < previous_episode.aired_date
		) {
			console.log({ ep, previous_episode });
			throw new AniFillerError(
				`Episode ${ep.episode} has aired_date ${ep.aired_date}, which is earlier than episode ${previous_episode.episode}'s aired_date ${previous_episode.aired_date}`,
				show.slug,
			);
		}

		seen_episodes.add(ep.episode);
		previous_episode = ep;
	}
	const max_episode = Math.max(...seen_episodes);
	for (let i = 1; i <= max_episode; i++) {
		if (!seen_episodes.has(i))
			throw new AniFillerError(`Missing episode number ${i} in show ${show.title}`, show.slug);
	}
}

await Bun.write(out_path, JSON.stringify(shows, null, 4));
await Bun.write(out_min_path, JSON.stringify(shows));

const readme_template = await Bun.file(join(proj_root, '.github/README_template.md')).text();
const readme_content = readme_template.replace('{show_count}', shows.length.toLocaleString('en-US'));
await Bun.write(join(proj_root, 'README.md'), readme_content);

await Bun.$`bun check --fix ${data_dir}`.quiet();
console.log(`Wrote ${shows.length} shows to ${basename(out_path)} and ${basename(out_min_path)}`);
