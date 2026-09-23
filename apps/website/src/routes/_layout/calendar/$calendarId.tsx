import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { RssIcon } from 'lucide-react';
import { EventList } from '#/components/event-list';
import { MonthCalendar } from '#/components/month-calendar';
import { civilToday, monthOf } from '#/lib/calendar-month';
import {
	monthEventsQueryOptions,
	publicCalendarQueryOptions,
	upcomingEventsQueryOptions,
} from '#/lib/calendar-opts';
import { monthSearchSchema } from '#/lib/month-search';
import { calendarPath, monthPath } from '#/lib/paths';
import { seo } from '#/lib/seo';

/**
 * One calendar, with the link that matters: **Subscribe**, which hands the
 * visitor off to `apps/calendar` to serve the `.ics`.
 *
 * A calendar nothing on the site references is a 404 here, not an empty page —
 * `getPublicCalendar` applies the same rule the index list does, so the id is
 * not a back door around it (§8).
 */
export const Route = createFileRoute('/_layout/calendar/$calendarId')({
	validateSearch: monthSearchSchema,
	loaderDeps: ({ search }) => ({ month: search.month }),
	loader: async ({ context, params, deps }) => {
		const month = deps.month ?? monthOf(civilToday());
		const scope = { scope: 'calendar', calendarId: params.calendarId } as const;

		const [calendar] = await Promise.all([
			context.queryClient.ensureQueryData(
				publicCalendarQueryOptions(params.calendarId),
			),
			context.queryClient.ensureQueryData(
				monthEventsQueryOptions(scope, month),
			),
			context.queryClient.ensureQueryData(upcomingEventsQueryOptions(scope)),
		]);

		if (!calendar) throw notFound();

		return {
			name: calendar.name,
			path: monthPath(calendarPath(params.calendarId), deps.month),
		};
	},
	head: ({ loaderData }) =>
		seo({
			title: loaderData?.name || undefined,
			description: loaderData
				? `Schedule and subscription link for ${loaderData.name || 'this calendar'}.`
				: undefined,
			path: loaderData?.path,
		}),
	component: CalendarPage,
	notFoundComponent: () => (
		<div className='mx-auto w-full max-w-4xl px-4 py-12'>
			<h1 className='font-bold text-3xl'>Calendar not found</h1>
			<p className='mt-2 text-muted-foreground'>
				There is no published calendar at this address.
			</p>
			<Link
				to='/calendar'
				className='mt-4 inline-block text-muted-foreground text-sm hover:text-foreground'
			>
				See the full calendar
			</Link>
		</div>
	),
});

function CalendarPage() {
	const { calendarId } = Route.useParams();
	const { month: requested } = Route.useSearch();
	const month = requested ?? monthOf(civilToday());
	const scope = { scope: 'calendar', calendarId } as const;

	const { data: calendar } = useSuspenseQuery(
		publicCalendarQueryOptions(calendarId),
	);
	const { data: monthEvents } = useSuspenseQuery(
		monthEventsQueryOptions(scope, month),
	);
	const { data: upcoming } = useSuspenseQuery(
		upcomingEventsQueryOptions(scope),
	);

	// The loader has already 404'd a calendar that is not public.
	if (!calendar) return null;

	return (
		<div className='mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12'>
			<div className='flex flex-wrap items-end justify-between gap-3'>
				<div>
					{/* `exact`, or the router counts `/calendar` as active while we are
					    on a child of it and marks this `aria-current="page"`. */}
					<Link
						to='/calendar'
						activeOptions={{ exact: true }}
						className='text-muted-foreground text-sm hover:text-foreground'
					>
						All calendars
					</Link>
					<h1 className='font-bold text-3xl'>
						{calendar.name || 'Untitled calendar'}
					</h1>
				</div>
				{/* A plain anchor: the destination is the calendar worker, on another
				    origin, and handing the URL to a calendar app is the point. */}
				<a
					href={calendar.subscribeUrl}
					className='flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
				>
					<RssIcon aria-hidden='true' className='size-4' />
					Subscribe
				</a>
			</div>

			<MonthCalendar month={month} events={monthEvents} />

			<EventList
				events={upcoming}
				emptyMessage='Nothing scheduled in the next year.'
			/>
		</div>
	);
}
