import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { RssIcon } from 'lucide-react';
import { EventDot, EventList } from '#/components/event-list';
import { MonthCalendar } from '#/components/month-calendar';
import { PageContainer, PageTitle } from '#/components/page-container';
import { env } from '#/env';
import type { EventScope } from '#/lib/calendar-fns';
import { civilToday, monthOf } from '#/lib/calendar-month';
import {
	monthEventsQueryOptions,
	publicCalendarsQueryOptions,
	upcomingEventsQueryOptions,
} from '#/lib/calendar-opts';
import { monthSearchSchema } from '#/lib/month-search';
import { CALENDAR_PATH, monthPath } from '#/lib/paths';
import { seo } from '#/lib/seo';

/** Everything public, pooled — the index is the whole-program schedule. */
const SCOPE: EventScope = { scope: 'public' };

export const Route = createFileRoute('/_layout/calendar/')({
	validateSearch: monthSearchSchema,
	// The month is part of the cache key, so each month is its own entry — and
	// its own edge-cacheable URL.
	loaderDeps: ({ search }) => ({ month: search.month }),
	loader: async ({ context, deps }) => {
		const month = deps.month ?? monthOf(civilToday());

		await Promise.all([
			context.queryClient.ensureQueryData(publicCalendarsQueryOptions),
			context.queryClient.ensureQueryData(
				monthEventsQueryOptions(SCOPE, month),
			),
			context.queryClient.ensureQueryData(upcomingEventsQueryOptions(SCOPE)),
		]);

		// `deps.month`, not the resolved `month`: the canonical address of the
		// current month is `/calendar` with no param at all.
		return { path: monthPath(CALENDAR_PATH, deps.month) };
	},
	head: ({ loaderData }) =>
		seo({
			title: 'Calendar',
			description: `Every published schedule for ${env.VITE_APP_TITLE}, month by month.`,
			path: loaderData?.path ?? CALENDAR_PATH,
		}),
	component: CalendarIndex,
});

function CalendarIndex() {
	const { month: requested } = Route.useSearch();
	const month = requested ?? monthOf(civilToday());

	const { data: calendars } = useSuspenseQuery(publicCalendarsQueryOptions);
	const { data: monthEvents } = useSuspenseQuery(
		monthEventsQueryOptions(SCOPE, month),
	);
	const { data: upcoming } = useSuspenseQuery(
		upcomingEventsQueryOptions(SCOPE),
	);

	return (
		<PageContainer>
			<div>
				<PageTitle>Calendar</PageTitle>
				{calendars.length > 1 && (
					<p className='mt-2 text-muted-foreground'>
						Every published calendar, together. Pick one below to see it on its
						own or subscribe to it.
					</p>
				)}
			</div>

			<MonthCalendar
				month={month}
				events={monthEvents}
				showCalendar={calendars.length > 1}
			/>

			<EventList
				events={upcoming}
				showCalendar={calendars.length > 1}
				emptyMessage='Nothing scheduled in the next year.'
			/>

			{calendars.length > 0 && (
				<nav aria-labelledby='calendars-heading'>
					<h2
						id='calendars-heading'
						className='font-semibold text-muted-foreground text-sm uppercase tracking-wide'
					>
						Calendars
					</h2>
					<ul className='mt-3 flex flex-col divide-y divide-border'>
						{calendars.map((calendar) => (
							// `flex-col` below `sm`, not `flex-wrap`: an unplanned wrap put
							// "Subscribe" directly under the name with the same weight and
							// spacing the two normally share, so the pair read as one line
							// of text rather than a name and its action.
							<li
								key={calendar.id}
								className='flex flex-col items-start gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2'
							>
								<Link
									to='/calendar/$calendarId'
									params={{ calendarId: calendar.id }}
									className='flex items-center gap-2 font-medium hover:underline'
								>
									<EventDot color={calendar.color} />
									{/* `calendars.name` is `NOT NULL` but not non-empty, and
									    there is a nameless row in the database today. */}
									{calendar.name || 'Untitled calendar'}
								</Link>
								<a
									href={calendar.subscribeUrl}
									className='flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground'
								>
									<RssIcon aria-hidden='true' className='size-3.5' />
									Subscribe
								</a>
							</li>
						))}
					</ul>
				</nav>
			)}
		</PageContainer>
	);
}
