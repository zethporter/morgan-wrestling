import { asc, eq } from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { getDb, quickLinks, settings } from '#/db';
import { type QuickLink, toQuickLinkHref } from './quick-links';
import { sanitizeHtml } from './sanitize-html';

/** `settings` holds exactly one row, keyed by this id. */
export const SITE_SETTINGS_ID = 'site';

export type SiteContent = {
	homeContent: string;
	defaultCalendar: string | null;
};

/**
 * The site home content, sanitized, plus the calendar the home page will pull
 * upcoming events from at M5.
 *
 * `home_content_metadata` is never selected: it is the ProseMirror JSON the
 * editor round-trips, and nothing on the public site reads it.
 */
export const getSiteContent = createServerFn({ method: 'GET' }).handler(
	async (): Promise<SiteContent> => {
		const [site] = await getDb()
			.select({
				homeContent: settings.homeContent,
				defaultCalendar: settings.defaultCalendar,
			})
			.from(settings)
			.where(eq(settings.id, SITE_SETTINGS_ID));

		return {
			homeContent: sanitizeHtml(site?.homeContent),
			defaultCalendar: site?.defaultCalendar ?? null,
		};
	},
);

/**
 * The published site quick links, in insertion order — the table has no
 * sequence column, so the id is the only stable order available.
 *
 * `active` is fail-closed: the column is nullable and the admin does not
 * filter on it, so a row is visible only once someone has explicitly published
 * it. A link whose URL is not safe to put in an `href` is dropped rather than
 * rendered dead.
 */
export const getSiteQuickLinks = createServerFn({ method: 'GET' }).handler(
	async (): Promise<QuickLink[]> => {
		const links = await getDb()
			.select({
				id: quickLinks.id,
				title: quickLinks.title,
				url: quickLinks.url,
			})
			.from(quickLinks)
			.where(eq(quickLinks.active, true))
			.orderBy(asc(quickLinks.id));

		return links.flatMap((link) => {
			const url = toQuickLinkHref(link.url);
			return url === null ? [] : [{ ...link, url }];
		});
	},
);
