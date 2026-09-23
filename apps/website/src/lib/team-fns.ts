import { asc } from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { getDb, teams } from '#/db';

export type TeamNavItem = {
	id: string;
	name: string;
	slug: string;
};

/**
 * Every team, for the header nav. Loaded by `_layout`, so it is on every page.
 *
 * Teams have no `active` flag — a team exists or it does not — and
 * `normalized_name` is written by the admin on create, so the slug needs none
 * of the read-time gymnastics `team_pages` will need at M4.
 */
export const getTeamNav = createServerFn({ method: 'GET' }).handler(
	async (): Promise<TeamNavItem[]> =>
		await getDb()
			.select({
				id: teams.id,
				name: teams.name,
				slug: teams.normalizedName,
			})
			.from(teams)
			.orderBy(asc(teams.name)),
);
