import { basename, join } from 'node:path';
import { type Comments, type ShowFull, validate } from '$core';
import { paths } from '$utils';
import { save_readme } from './readme';

const comments_path = join(paths.meta, 'comments.json');

const out_path = join(paths.dist, 'anifiller.json');
const out_min_path = join(paths.dist, 'anifiller.min.json');

async function save_dist(shows: ShowFull[]) {
	await Bun.write(out_path, JSON.stringify(shows, null, 4));
	await Bun.write(out_min_path, JSON.stringify(shows));
	console.log(`Wrote ${shows.length} shows to ${basename(out_path)} and ${basename(out_min_path)}`);
}

const save_comments = (comments: Comments) => Bun.write(comments_path, JSON.stringify(comments, null, 4));

const { shows, comments } = await validate();

await save_readme(shows);
await save_comments(comments);

await save_dist(shows);
