import { cn } from '@morgan-wrestling/ui/lib/utils';
import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { EventDot } from '#/components/event-list';
import type { PublicEvent } from '#/lib/calendar-fns';
import {
	buildMonthGrid,
	type CivilMonth,
	civilToday,
	formatEventWhen,
	monthLabel,
	monthOf,
	shiftMonth,
	WEEKDAY_LABELS,
} from '#/lib/calendar-month';

/**
 * A month grid with a coloured dot per event, the colour coming from
 * `calendar_event_types.color`.
 *
 * ## Why this is not `react-day-picker`
 *
 * `packages/ui` has a day-picker-based `Calendar`, and `apps/admin`'s
 * `big-calendar.tsx` scaffolds a month grid on top of it. Both are *input*
 * components: they hold a selection in React state and move months with
 * buttons. This site has nothing to select and has to work with JavaScript off
 * (§1), so the month is a URL search param and the arrows are links — which
 * also means each month is its own cacheable URL at the edge, and a crawler can
 * walk the schedule.
 *
 * It renders as a `<table>` because that is what it is: seven columns of dates
 * with a header row. The admin's scaffold is left alone, per §8.
 */
export const MonthCalendar = ({
	month,
	events,
	className,
}: {
	month: CivilMonth;
	events: PublicEvent[];
	className?: string;
}) => {
	const today = civilToday();
	const weeks = buildMonthGrid({ month, events, today });

	return (
		<section className={cn('w-full', className)}>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h2 className='font-semibold text-xl'>{monthLabel(month)}</h2>
				<nav
					aria-label='Change month'
					className='flex items-center gap-1 text-sm'
				>
					<MonthLink month={shiftMonth(month, -1)} label='Previous month'>
						<ChevronLeftIcon aria-hidden='true' className='size-4' />
					</MonthLink>
					{/* Only when it would go somewhere. No `month` in the search params
					    is "whatever month it is now", so this needs no date of its own
					    — and on the current month the router would match the link to
					    the location and mark it `aria-current="page"`, which is a lie
					    the moment a visitor has paged forward. */}
					{monthOf(today) !== month && (
						<Link
							to='.'
							search={{ month: undefined }}
							// Without `explicitUndefined` the router reads this link's
							// empty search as a subset of `?month=2026-08` and calls it
							// active; this makes the absent `month` part of the match.
							activeOptions={{ explicitUndefined: true }}
							className='rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
						>
							Today
						</Link>
					)}
					<MonthLink month={shiftMonth(month, 1)} label='Next month'>
						<ChevronRightIcon aria-hidden='true' className='size-4' />
					</MonthLink>
				</nav>
			</div>

			<table className='mt-3 w-full table-fixed border-collapse'>
				<caption className='sr-only'>
					Events in {monthLabel(month)}, by day
				</caption>
				<thead>
					<tr>
						{WEEKDAY_LABELS.map((weekday) => (
							<th
								key={weekday}
								scope='col'
								className='pb-2 font-medium text-muted-foreground text-xs uppercase'
							>
								{weekday}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{weeks.map((week) => (
						// A week is identified by the day it starts on.
						<tr key={week[0]?.date}>
							{week.map((day) => (
								<td
									key={day.date}
									{...(day.isToday ? { 'aria-current': 'date' } : {})}
									className={cn(
										'h-16 border border-border align-top',
										day.inMonth ? '' : 'bg-muted/40 text-muted-foreground',
									)}
								>
									<div className='flex h-full flex-col gap-1 p-1'>
										<span
											className={cn(
												'text-xs',
												day.isToday &&
													'w-fit rounded-full bg-primary px-1.5 font-semibold text-primary-foreground',
												!day.inMonth && 'opacity-60',
											)}
										>
											{day.dayOfMonth}
										</span>
										{day.events.length > 0 && (
											<ul className='flex flex-wrap gap-0.5'>
												{day.events.map((event) => (
													<li key={event.id} className='flex'>
														<EventDot
															color={event.eventTypeColor}
															className='size-2.5'
														/>
														{/* The dot is the whole visual; the text is for
														    screen readers and the hover title. */}
														<span className='sr-only'>
															{event.title} — {formatEventWhen(event)}
														</span>
													</li>
												))}
											</ul>
										)}
									</div>
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};

/**
 * `to='.'` keeps whichever calendar route is rendering this — the grid is on
 * both `/calendar` and `/calendar/$calendarId`, and only the search param
 * changes.
 */
const MonthLink = ({
	month,
	label,
	children,
}: {
	month: CivilMonth;
	label: string;
	children: React.ReactNode;
}) => (
	<Link
		to='.'
		search={{ month }}
		aria-label={`${label}, ${monthLabel(month)}`}
		className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
	>
		{children}
	</Link>
);
