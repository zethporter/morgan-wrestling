import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { EventList } from '#/components/event-list';
import { QuickLinks } from '#/components/quick-links';
import { RichContent } from '#/components/rich-content';
import { env } from '#/env';
import type { EventScope } from '#/lib/calendar-fns';
import { upcomingEventsQueryOptions } from '#/lib/calendar-opts';
import { toDescription } from '#/lib/excerpt';
import { HOME_PATH } from '#/lib/paths';
import { seo } from '#/lib/seo';
import {
	siteContentQueryOptions,
	siteQuickLinksQueryOptions,
} from '#/lib/site-opts';

/**
 * `settings.default_calendar`, resolved in SQL by the server function rather
 * than read out of `siteContentQueryOptions` first — the loader should not have
 * to wait on one query to know how to ask for the next.
 */
const SCOPE: EventScope = { scope: 'site' };

export const Route = createFileRoute('/_layout/')({
	loader: async ({ context }) => {
		const [site] = await Promise.all([
			context.queryClient.ensureQueryData(siteContentQueryOptions),
			context.queryClient.ensureQueryData(siteQuickLinksQueryOptions),
			context.queryClient.ensureQueryData(upcomingEventsQueryOptions(SCOPE)),
		]);

		// The one thing `head` needs that the query cache cannot hand it: the
		// description is derived, not stored. Returning it rather than deriving
		// it again in `head` keeps the HTML parse on the server, once.
		return { description: toDescription(site.homeContent) };
	},
	// No `title`, so the tab reads `Morgan Wrestling` and not
	// `Morgan Wrestling | Morgan Wrestling`.
	head: ({ loaderData }) =>
		seo({
			description: loaderData?.description || undefined,
			path: HOME_PATH,
		}),
	component: Home,
});

function Home() {
	const { data: site } = useSuspenseQuery(siteContentQueryOptions);
	const { data: quickLinks } = useSuspenseQuery(siteQuickLinksQueryOptions);
	const { data: upcoming } = useSuspenseQuery(
		upcomingEventsQueryOptions(SCOPE),
	);

	return (
		<div className='mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12'>
			{site.homeContent ? (
				<RichContent html={site.homeContent} />
			) : (
				<div>
					<h1 className='font-bold text-3xl'>{env.VITE_APP_TITLE}</h1>
					<p className='mt-2 text-muted-foreground'>
						There is nothing on the home page yet.
					</p>
				</div>
			)}
			<QuickLinks links={quickLinks} />
			{/* Only shown once there is a calendar wired up in the admin — an empty
			    schedule block on the home page says nothing useful. */}
			{upcoming.length > 0 && (
				<div>
					<EventList events={upcoming} />
					<Link
						to='/calendar'
						className='mt-3 inline-block text-muted-foreground text-sm hover:text-foreground'
					>
						See the full calendar
					</Link>
				</div>
			)}
		</div>
	);
}
