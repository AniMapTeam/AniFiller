import { join } from 'node:path';
import { schema_show } from '$base';
import { proj_root } from '$utils';

const schema_file = Bun.file(join(proj_root, '.github/anifiller.schema.json'));

const schema = schema_show.toJsonSchema();
await schema_file.write(JSON.stringify(schema, null, 4));
await Bun.$`bun check --fix ${schema_file.name}`.quiet();
console.log(`Schema written to ${schema_file.name}`);
