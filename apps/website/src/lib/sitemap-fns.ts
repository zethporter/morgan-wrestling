import { asc, eq } from '@morgan-wrestling/db/sql';
import { calendars, getDb, teamPages, teams } from '#/db';
import { isPublicCalendar } from './calendar-fns';
import {
	CALENDAR_PATH,
	calendarPath,
	HOME_PATH,
	teamPagePath,
	teamPath,
} from './paths';
import { toSlug } from './slug';

/**
 * Every address on this site, for `sitemap.xml`.
 *
 * A plain async function rather than a `createServerFn`, because its one caller
 * is a server route handler that is already on the server — going out through
 * the RPC boundary and back would buy nothing but a serialization round trip.
 * It is the same shape the server-routes guidance recommends: the read lives in
 * a module, and the HTTP contract is a thin wrapper over it.
 *
 * The rules that decide what is public are not restated here. Team pages come
 * back through the same fail-closed `active = true` filter and the same
 * `toSlug` the nav uses, and calendars through `isPublicCalendar` — so a URL in
 * the sitemap is a URL the route actually serves. A sitemap listing a page the
 * site 404s is worse than a short sitemap.
 *
 * Month URLs are not listed. `?month=` is an unbounded space (see the note on
 * the month links in `month-calendar.tsx`), and `/calendar` already renders the
 * month a visitor arriving with no opinion should see.
 */
export const getSitemapPaths = async (): Promise<Array<string>> => {
	const db = getDb();

	const [teamRows, pageRows, calendarRows] = await Promise.all([
		db
			.select({ slug: teams.normalizedName })
			.from(teams)
			.orderBy(asc(teams.name)),

		db
			.select({
				teamSlug: teams.normalizedName,
				title: teamPages.title,
			})
			.from(teamPages)
			.innerJoin(teams, eq(teamPages.teamId, teams.id))
			.where(eq(teamPages.active, true))
			.orderBy(
				asc(teams.name),
				asc(teamPages.sequenceNumber),
				asc(teamPages.id),
			),

		db
			.select({ id: calendars.id })
			.from(calendars)
			.where(isPublicCalendar(db, calendars.id))
			.orderBy(asc(calendars.name)),
	]);

	const paths = [
		HOME_PATH,
		CALENDAR_PATH,
		...calendarRows.map((row) => calendarPath(row.id)),
	];

	for (const team of teamRows) {
		paths.push(teamPath(team.slug));

		for (const page of pageRows) {
			if (page.teamSlug !== team.slug) continue;

			const slug = toSlug(page.title);
			// A whitespace-only title has no path segment, and two titles that
			// slug alike are one address — the nav shows both entries and the
			// route resolves the first, so the sitemap lists it once.
			if (slug === '') continue;

			const path = teamPagePath(team.slug, slug);
			if (!paths.includes(path)) paths.push(path);
		}
	}

	return paths;
};

/**
 * `robots.txt`, whole. Everything is crawlable — this is a public read-only
 * site with no private tree to fence off — so its one job is pointing at the
 * sitemap.
 */
export const robotsTxt = (sitemapUrl: string): string =>
	`User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;
