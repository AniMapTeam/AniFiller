import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ShowFull } from '$core';
import { paths } from '$utils';

export async function save_readme(shows: ShowFull[]) {
	const path = join(paths.root, 'README.md');
	const exists = existsSync(path);
	const readme_template = await Bun.file(join(paths.root, '.github/README_template.md')).text();
	const readme_content = readme_template
		.replace('{show_count}', shows.length.toLocaleString('en-US'))
		.replace('{shows_table}', _shows_table(shows));
	await Bun.write(path, readme_content);
	console.log(`${exists ? 'Updated' : 'Created'} README.md.`);
}

const _markdown_table = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');

function _shows_table(shows: ShowFull[]) {
	const header = ['| filename | title | mal_id | episodes |', '| --- | --- | ---: | ---: |'];

	const rows = shows.map((show) => {
		const filename = `${show.slug}.json`;
		const filename_link = `[\`${filename}\`](./data/shows/${show.slug}.json)`;
		const title = _markdown_table(show.title);
		const mal_id = show.mappings.mal_id;
		const episodes = show.episodes.length;
		return `| ${filename_link} | ${title} | ${mal_id} | ${episodes} |`;
	});

	return [...header, ...rows].join('\n');
}
