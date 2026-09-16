#!/usr/bin/env bun
/**
 * Wraps `auth generate` so its output compiles against drizzle-orm 1.0.
 *
 * better-auth declares `drizzle-orm: ^0.45.2` as a peer dep, so its generator
 * unconditionally emits the v0 relations API (`relations()`, one block per
 * table) with no flag to disable it. drizzle-orm 1.0.0-rc dropped that export
 * in favour of `defineRelations`/`defineRelationsPart`.
 *
 * The emitted blocks still carry every naming decision better-auth made, so
 * rather than hand-porting after each run we generate to a temp file and
 * rewrite those blocks into a single `defineRelationsPart` before writing
 * src/schema.ts. Nothing in that file is hand-maintained.
 */
import { $ } from 'bun';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Pinned to the installed better-auth so the generator can't drift ahead of
// the runtime that consumes the schema.
const CLI_VERSION = '1.6.26';

const PKG_DIR = join(import.meta.dirname, '..');
const OUTPUT = join(PKG_DIR, 'src/schema.ts');
const TEMP = join(tmpdir(), 'better-auth-schema.gen.ts');

/** `k: one(Target, { fields: [Src.col], references: [Target.col] })` */
interface ForwardOne {
	key: string;
	target: string;
	fromColumn: string;
	toColumn: string;
	alias?: string;
}

/** `k: many(Target)` / `k: one(Target)` — no columns; the other side has them. */
interface Reverse {
	key: string;
	target: string;
	cardinality: 'one' | 'many';
	alias?: string;
}

interface Block {
	table: string;
	forwards: ForwardOne[];
	reverses: Reverse[];
}

const BLOCK_RE =
	/^export const \w+Relations = relations\(\s*(\w+),\s*\([^)]*\)\s*=>\s*\(\{([\s\S]*?)^\}\)\);$/gm;

const FORWARD_RE =
	/(\w+):\s*one\(\s*(\w+),\s*\{\s*fields:\s*\[\s*\w+\.(\w+)\s*\],\s*references:\s*\[\s*\w+\.(\w+)\s*\],\s*(?:relationName:\s*["']([^"']+)["'],?\s*)?\}\s*\)/g;

const REVERSE_RE =
	/(\w+):\s*(one|many)\(\s*(\w+)\s*(?:,\s*\{\s*relationName:\s*["']([^"']+)["'],?\s*\}\s*)?\)/g;

const TABLE_RE = /^export const (\w+) = \w+Table\(/gm;

function parseBlocks(source: string): Block[] {
	const blocks: Block[] = [];

	for (const [, table, body] of source.matchAll(BLOCK_RE)) {
		const forwards: ForwardOne[] = [];

		// Blank out forward relations before scanning for reverses so the
		// looser reverse pattern can't re-match their `one(Target, ...)` head.
		const remaining = body.replace(
			FORWARD_RE,
			(_match, key, target, fromColumn, toColumn, alias) => {
				forwards.push({ key, target, fromColumn, toColumn, alias });
				return '';
			},
		);

		const reverses = [...remaining.matchAll(REVERSE_RE)].map(
			([, key, cardinality, target, alias]): Reverse => ({
				key,
				target,
				cardinality: cardinality as 'one' | 'many',
				alias,
			}),
		);

		blocks.push({ table, forwards, reverses });
	}

	return blocks;
}

/**
 * A reverse relation carries no columns — resolve them from the matching
 * forward relation declared on the table it points at, then invert.
 */
function resolveReverse(
	source: Block,
	reverse: Reverse,
	blocks: Block[],
): { from: string; to: string } {
	const target = blocks.find((block) => block.table === reverse.target);
	const candidates =
		target?.forwards.filter(
			(forward) =>
				forward.target === source.table && forward.alias === reverse.alias,
		) ?? [];

	if (candidates.length !== 1) {
		throw new Error(
			`Cannot resolve ${source.table}.${reverse.key} -> ${reverse.target}: ` +
				`expected exactly 1 matching relation on ${reverse.target}, found ${candidates.length}. ` +
				`If better-auth added a second foreign key between these tables it needs a ` +
				`relationName to disambiguate; port this relation by hand.`,
		);
	}

	const [forward] = candidates;
	return {
		from: `r.${source.table}.${forward.toColumn}`,
		to: `r.${reverse.target}.${forward.fromColumn}`,
	};
}

function renderRelation(
	key: string,
	accessor: string,
	from: string,
	to: string,
	alias?: string,
): string {
	const fields = [`from: ${from},`, `to: ${to},`];
	if (alias) fields.push(`alias: '${alias}',`);
	return `\t\t\t${key}: ${accessor}({\n${fields.map((f) => `\t\t\t\t${f}`).join('\n')}\n\t\t\t}),`;
}

function renderRelationsPart(blocks: Block[], tables: string[]): string {
	const bodies = blocks.map((block) => {
		const entries = [
			...block.forwards.map((forward) =>
				renderRelation(
					forward.key,
					`r.one.${forward.target}`,
					`r.${block.table}.${forward.fromColumn}`,
					`r.${forward.target}.${forward.toColumn}`,
					forward.alias,
				),
			),
			...block.reverses.map((reverse) => {
				const { from, to } = resolveReverse(block, reverse, blocks);
				return renderRelation(
					reverse.key,
					`r.${reverse.cardinality}.${reverse.target}`,
					from,
					to,
					reverse.alias,
				);
			}),
		];

		return `\t\t${block.table}: {\n${entries.join('\n')}\n\t\t},`;
	});

	return [
		'export const authRelations = defineRelationsPart(',
		'\t{',
		...tables.map((table) => `\t\t${table},`),
		'\t},',
		'\t(r) => ({',
		...bodies,
		'\t}),',
		');',
	].join('\n');
}

function transform(source: string): string {
	const blocks = parseBlocks(source);
	if (blocks.length === 0) {
		throw new Error(
			'No `relations()` blocks found in the generated schema. The better-auth ' +
				'generator output has changed shape — re-check scripts/generate-schema.ts.',
		);
	}

	const tables = [...source.matchAll(TABLE_RE)].map(([, name]) => name);
	const relationsPart = renderRelationsPart(blocks, tables);

	// Strip the emitted blocks, then swap `relations` out of the root import.
	const withoutBlocks = source.replace(BLOCK_RE, '').trimEnd();
	const rewritten = withoutBlocks.replace(
		/import\s*\{([^}]*)\}\s*from\s*["']drizzle-orm["'];/,
		(_match, named: string) => {
			const specifiers = named
				.split(',')
				.map((specifier) => specifier.trim())
				.filter((specifier) => specifier && specifier !== 'relations');
			specifiers.unshift('defineRelationsPart');
			return `import { ${specifiers.join(', ')} } from 'drizzle-orm';`;
		},
	);

	if (rewritten.includes('relations(')) {
		throw new Error('Leftover `relations()` call after transform.');
	}

	return `${rewritten}\n\n${relationsPart}\n`;
}

const generate =
	await $`bun x auth@${CLI_VERSION} generate --config ./auth.config.ts --output ${TEMP} -y`
		.cwd(PKG_DIR)
		.nothrow();

if (generate.exitCode !== 0) {
	process.exit(generate.exitCode);
}

await Bun.write(OUTPUT, transform(await Bun.file(TEMP).text()));
await $`bun x biome check --write ${OUTPUT}`.cwd(PKG_DIR).quiet().nothrow();

console.log(`Wrote ${OUTPUT}`);
