import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { type ShowFull, schema_show_full, show } from '$base';
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
console.log(files);

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
		throw new Error(
			`Duplicate mapping found in file ${file} for show ${x.title} (Anilist ID: ${x.mappings.anilist_id}, MAL ID: ${x.mappings.mal_id})`,
		);

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
			})),
		}),
	);
}

await Bun.write(out_path, JSON.stringify(shows, null, 4));
await Bun.write(out_min_path, JSON.stringify(shows));

const readme_template = await Bun.file(join(proj_root, '.github/README_template.md')).text();
const readme_content = readme_template.replace('{show_count}', shows.length.toLocaleString('en-US'));
await Bun.write(join(proj_root, 'README.md'), readme_content);

await Bun.$`bun check --fix ${data_dir}`.quiet();
console.log(`Wrote ${shows.length} shows to ${basename(out_path)} and ${basename(out_min_path)}`);
