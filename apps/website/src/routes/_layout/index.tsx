import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { EventList } from '#/components/event-list';
import { QuickLinks } from '#/components/quick-links';
import { RichContent } from '#/components/rich-content';
import { env } from '#/env';
import type { EventScope } from '#/lib/calendar-fns';
import { upcomingEventsQueryOptions } from '#/lib/calendar-opts';
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
		await Promise.all([
			context.queryClient.ensureQueryData(siteContentQueryOptions),
			context.queryClient.ensureQueryData(siteQuickLinksQueryOptions),
			context.queryClient.ensureQueryData(upcomingEventsQueryOptions(SCOPE)),
		]);
	},
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
