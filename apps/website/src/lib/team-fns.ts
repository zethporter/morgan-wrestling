import { and, asc, eq } from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getDb, teamPages, teamQuickLinks, teams } from '#/db';
import { type QuickLink, toQuickLinkHref } from './quick-links';
import { sanitizeHtml } from './sanitize-html';
import { toSlug } from './slug';

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
 * of the read-time gymnastics `team_pages` does below.
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

/**
 * Every team-scoped read is keyed by the slug in the URL rather than by a team
 * id resolved earlier in the route tree. That keeps each server function
 * self-contained — no ordering dependency between the team layout's loader and
 * its children's — at the cost of a join against `teams`, which is a handful of
 * rows.
 */
const teamSlugSchema = z.object({ teamSlug: z.string().min(1) });

export type TeamContent = {
	id: string;
	name: string;
	homeContent: string;
	defaultCalendarId: string | null;
};

/**
 * One team by its slug, or `null` if there is no such team — the route layout
 * turns that into a 404.
 *
 * `home_content_metadata` is never selected: it is the editor's ProseMirror
 * JSON, and nothing public reads it.
 */
export const getTeam = createServerFn({ method: 'GET' })
	.validator(teamSlugSchema)
	.handler(async ({ data }): Promise<TeamContent | null> => {
		const [team] = await getDb()
			.select({
				id: teams.id,
				name: teams.name,
				homeContent: teams.homeContent,
				defaultCalendarId: teams.defaultCalendarId,
			})
			.from(teams)
			.where(eq(teams.normalizedName, data.teamSlug))
			.limit(1);

		if (!team) return null;

		return { ...team, homeContent: sanitizeHtml(team.homeContent) };
	});

export type TeamPageNavItem = {
	id: number;
	title: string;
	slug: string;
};

/**
 * A team's published pages, in the order the admin gave them, for the nav on
 * the team layout.
 *
 * `active` is fail-closed: the column is nullable and has no default, so a page
 * is visible only once someone has explicitly published it.
 *
 * Two pages whose titles slug to the same thing produce two nav entries
 * pointing at one URL — the lower `sequence_number` is the one that resolves.
 * That is the collision the slug column (option C in §6) exists to fix; until
 * someone hits it, duplicating the entry is more honest than hiding a page.
 */
export const getTeamPageNav = createServerFn({ method: 'GET' })
	.validator(teamSlugSchema)
	.handler(async ({ data }): Promise<TeamPageNavItem[]> => {
		const pages = await getDb()
			.select({
				id: teamPages.id,
				title: teamPages.title,
			})
			.from(teamPages)
			.innerJoin(teams, eq(teamPages.teamId, teams.id))
			.where(
				and(
					eq(teams.normalizedName, data.teamSlug),
					eq(teamPages.active, true),
				),
			)
			.orderBy(asc(teamPages.sequenceNumber), asc(teamPages.id));

		return pages.flatMap((page) => {
			const slug = toSlug(page.title);
			// A whitespace-only title has no path segment to link to.
			return slug === '' ? [] : [{ ...page, slug }];
		});
	});

/**
 * A team's published quick links, in insertion order — the table has no
 * sequence column, so the id is the only stable order available. Same
 * fail-closed `active` rule and same dropping of URLs that cannot safely be an
 * `href` as the site-wide links in `site-fns.ts`.
 */
export const getTeamQuickLinks = createServerFn({ method: 'GET' })
	.validator(teamSlugSchema)
	.handler(async ({ data }): Promise<QuickLink[]> => {
		const links = await getDb()
			.select({
				id: teamQuickLinks.id,
				title: teamQuickLinks.title,
				url: teamQuickLinks.url,
			})
			.from(teamQuickLinks)
			.innerJoin(teams, eq(teamQuickLinks.teamId, teams.id))
			.where(
				and(
					eq(teams.normalizedName, data.teamSlug),
					eq(teamQuickLinks.active, true),
				),
			)
			.orderBy(asc(teamQuickLinks.id));

		return links.flatMap((link) => {
			const url = toQuickLinkHref(link.url);
			return url === null ? [] : [{ ...link, url }];
		});
	});

export type TeamPageContent = {
	id: number;
	title: string;
	content: string;
};

/**
 * One team page, resolved by its derived slug, or `null` for an unknown or
 * unpublished one.
 *
 * There is no slug column to filter on in SQL, so the match happens in the
 * Worker: the team's published pages come back in nav order and the first whose
 * title slugs to the requested value wins. On a collision that is the lowest
 * `sequence_number`, which is the entry the visitor clicked.
 *
 * The requested slug is compared as it arrived, not re-slugged. A page has one
 * canonical URL — the one the nav links to — and anything else 404s, which is
 * the same rule `teams.normalized_name` already gives team slugs. Being lenient
 * here would make `/teams/varsity/SCHEDULE` a second URL serving identical
 * content while the equivalent team slug still 404'd.
 *
 * `content` is selected in that same query rather than in a follow-up lookup by
 * id. A team has a handful of pages, so reading a few kilobytes the Worker
 * discards is cheaper than a second serial round trip to Turso on the critical
 * path of every sub-page view. If a team ever has enough pages for that to stop
 * being true, the fix is the slug column, not a second query.
 */
export const getTeamPage = createServerFn({ method: 'GET' })
	.validator(teamSlugSchema.extend({ pageSlug: z.string().min(1) }))
	.handler(async ({ data }): Promise<TeamPageContent | null> => {
		const pages = await getDb()
			.select({
				id: teamPages.id,
				title: teamPages.title,
				content: teamPages.content,
			})
			.from(teamPages)
			.innerJoin(teams, eq(teamPages.teamId, teams.id))
			.where(
				and(
					eq(teams.normalizedName, data.teamSlug),
					eq(teamPages.active, true),
				),
			)
			.orderBy(asc(teamPages.sequenceNumber), asc(teamPages.id));

		const page = pages.find(
			(candidate) => toSlug(candidate.title) === data.pageSlug,
		);
		if (!page) return null;

		return {
			id: page.id,
			title: page.title,
			content: sanitizeHtml(page.content),
		};
	});
