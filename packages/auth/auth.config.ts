// CLI-only entrypoint for `bun run auth:generate`.
//
// The better-auth CLI loads this file with c12, which expects an exported
// `auth` *instance*. A default-exported factory gets invoked with no
// arguments instead, which is why pointing the CLI at ./src/config.ts fails
// with "Cannot destructure property 'db' of 'config'".
//
// Schema generation only reads the adapter's `provider`/`schema` options and
// never opens a connection, so a stub `db` is enough — and avoids needing
// TURSO_* env vars just to emit a schema.
import { createAuth } from './src/config';

export const auth = createAuth({
	db: null as unknown as Parameters<typeof createAuth>[0]['db'],
});
