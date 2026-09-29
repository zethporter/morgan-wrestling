import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@morgan-wrestling/ui/components/ui/dialog';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { EventDetails, eventAnchorId } from '#/components/event-details';
import { eventColorClass } from '#/components/event-list';
import type { PublicEvent } from '#/lib/calendar-fns';
import {
	buildMonthWeeks,
	type CivilDate,
	type CivilMonth,
	civilToday,
	type EventBar,
	formatEventWhen,
	monthLabel,
	monthOf,
	shiftMonth,
	WEEKDAY_LABELS,
} from '#/lib/calendar-month';

/** The height of one row of bars, and of the row of date numbers above them. */
const ROW_HEIGHT = '1.5rem';

/**
 * A month grid where each event is one bar spanning the days it covers, the
 * colour coming from `calendar_event_types.color`.
 *
 * ## Why this is not `react-day-picker`
 *
 * `packages/ui` has a day-picker-based `Calendar`, and `apps/admin`'s
 * `big-calendar.tsx` scaffolds a month grid on top of it. Both are *input*
 * components: they hold a selection in React state and move months with
 * buttons. This site has nothing to select and has to work with JavaScript off
 * (§1), so the month is a URL search param and the arrows are links — which
 * also means each month is its own cacheable URL at the edge, and a crawler can
 * walk the schedule. The admin's scaffold is left alone, per §8.
 *
 * ## Why this is not a `<table>`
 *
 * It was one, when an event was a dot on each of its days. A bar that spans
 * Wednesday to Saturday cannot be: no single element can cross `<td>`
 * boundaries, and `colSpan` would mean lifting the bars out into rows of their
 * own, which breaks the day borders the grid is made of.
 *
 * So each week is a seven-column CSS grid, twice over. The day cells are laid
 * out at `grid-row: 1 / -1` and draw the borders, the tint on adjacent-month
 * days and the date number; the bars are placed in the same grid at
 * `grid-column: <start> / span <n>`, one lane per row, and paint over the cells
 * because they come later in the DOM. {@link buildMonthWeeks} does the clipping
 * and the lane packing.
 *
 * The weekday labels are `aria-hidden`: without a table there is no header
 * association to carry them, so a bar says its own dates instead — the full
 * range, once, rather than a mark on each of four squares.
 *
 * ## Clicking a bar
 *
 * A bar is an `<a href='#event-<id>'>` pointing at a details panel below the
 * grid, and every panel is server-rendered and hidden until `:target` matches
 * it. With JavaScript the click is intercepted and the same details open in a
 * dialog instead; without it the browser follows the link and reveals the panel
 * in place. Nothing about the event is fetched either way — it is already here,
 * and §1's "readable with JavaScript off" holds with no second copy of the
 * markup to keep in step.
 */
export const MonthCalendar = ({
	month,
	events,
	showCalendar = false,
	className,
}: {
	month: CivilMonth;
	events: PublicEvent[];
	showCalendar?: boolean;
	className?: string;
}) => {
	const today = civilToday();
	const weeks = buildMonthWeeks({ month, events, today });
	const [openEvent, setOpenEvent] = useState<PublicEvent | null>(null);

	// The events the grid actually draws, once each. `events` is what the month
	// window returned, which is padded by a couple of days on both sides (§8),
	// and a multi-day event has a bar per week — so neither the prop nor the
	// bars can be mapped straight to panels.
	const onGrid = [
		...new Map(
			weeks
				.flatMap((week) => week.bars)
				.map((bar) => [bar.event.id, bar.event]),
		).values(),
	];

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

			<div className='mt-3 overflow-hidden rounded-lg border border-border'>
				<div
					aria-hidden='true'
					className='grid grid-cols-7 border-border border-b'
				>
					{WEEKDAY_LABELS.map((weekday) => (
						<div
							key={weekday}
							className='py-1.5 text-center font-medium text-muted-foreground text-xs uppercase'
						>
							{weekday}
						</div>
					))}
				</div>

				{weeks.map((week) => (
					// A week is identified by the day it starts on.
					<div
						key={week.days.at(0)?.date}
						className='grid min-h-20 grid-cols-7 border-border border-b last:border-b-0'
						// The trailing `1fr` is what lets `min-h-20` work: the lane rows
						// are fixed, so without a row to absorb the slack the day cells
						// would stop short of the bottom of the week and take their
						// borders with them.
						style={{
							gridTemplateRows: `${ROW_HEIGHT} repeat(${week.lanes}, ${ROW_HEIGHT}) 1fr`,
						}}
					>
						{week.days.map((day, index) => (
							<div
								key={day.date}
								{...(day.isToday ? { 'aria-current': 'date' } : {})}
								style={{ gridColumn: index + 1, gridRow: '1 / -1' }}
								className={cn(
									'border-border px-1 pt-1',
									// Not on the seventh: that edge is the container's.
									index < 6 && 'border-r',
									day.inMonth ? '' : 'bg-muted/40 text-muted-foreground',
								)}
							>
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
							</div>
						))}

						{week.bars.map((bar) => (
							<EventBarLink
								// A week's bars are unique by event, and an event can have a
								// bar in more than one week.
								key={bar.event.id}
								bar={bar}
								today={today}
								onOpen={setOpenEvent}
							/>
						))}
					</div>
				))}
			</div>

			{/* The fallback the bars link to, and where a shared `#event-<id>` URL
			    lands. Siblings rather than a list: one is visible at a time at most,
			    so there is nothing for a list to enumerate. */}
			{onGrid.map((event) => (
				<div
					key={event.id}
					id={eventAnchorId(event.id)}
					className='mt-3 hidden rounded-lg border border-border p-4 target:block'
				>
					<h3 className='font-medium'>{event.title}</h3>
					<EventDetails
						event={event}
						today={today}
						showCalendar={showCalendar}
						className='mt-2'
					/>
				</div>
			))}

			<Dialog
				open={openEvent !== null}
				onOpenChange={(open) => {
					if (!open) setOpenEvent(null);
				}}
			>
				<DialogContent>
					{openEvent && (
						<>
							<DialogHeader>
								<DialogTitle>{openEvent.title}</DialogTitle>
							</DialogHeader>
							<EventDetails
								event={openEvent}
								today={today}
								showCalendar={showCalendar}
							/>
						</>
					)}
				</DialogContent>
			</Dialog>
		</section>
	);
};

/**
 * One event's span within one week.
 *
 * The colour class is a `text-calendar-*` token, which the fill and the left
 * edge then borrow through `currentColor` — so a new colour in
 * `calendarColors` needs nothing here, and an unknown one degrades to the muted
 * foreground rather than an unresolved class name. The title is in the
 * foreground colour on a tinted ground, not in the event's own colour, because
 * the pale end of the palette is unreadable as text.
 */
const EventBarLink = ({
	bar,
	today,
	onOpen,
}: {
	bar: EventBar<PublicEvent>;
	today: CivilDate;
	onOpen: (event: PublicEvent) => void;
}) => {
	const when = formatEventWhen(bar.event, today);

	return (
		<a
			href={`#${eventAnchorId(bar.event.id)}`}
			title={`${bar.event.title} — ${when}`}
			onClick={(click) => {
				// A modified click is the browser's business: opening the details
				// panel in a new tab is a reasonable thing to ask for, and a middle
				// click never reaches this handler as a left one anyway.
				if (
					click.metaKey ||
					click.ctrlKey ||
					click.shiftKey ||
					click.altKey ||
					click.button !== 0
				) {
					return;
				}

				click.preventDefault();
				onOpen(bar.event);
			}}
			style={{
				gridColumn: `${bar.column + 1} / span ${bar.span}`,
				// Row 1 is the date numbers.
				gridRow: bar.lane + 2,
			}}
			className={cn(
				'my-px mr-0.5 ml-0.5 flex items-center overflow-hidden rounded-sm border-current border-l-2 bg-current/15 px-1 text-[0.6875rem] transition-colors hover:bg-current/30',
				eventColorClass(bar.event.eventTypeColor),
				// A cut end is square and runs into the day border, so that a bar
				// continuing across weeks does not read as two separate events.
				// `ml-*`/`mr-*` rather than `mx-*` above: same conflict group, so
				// `cn` resolves these to the last one rather than leaving both to
				// the stylesheet's order.
				bar.continuesBefore && 'ml-0 rounded-l-none border-l-0',
				bar.continuesAfter && 'mr-0 rounded-r-none',
			)}
		>
			<span className='truncate text-foreground'>{bar.event.title}</span>
			{/* The bar is the whole visual; this is what it says out loud. */}
			<span className='sr-only'>, {when}</span>
		</a>
	);
};

/**
 * `to='.'` keeps whichever calendar route is rendering this — the grid is on
 * both `/calendar` and `/calendar/$calendarId`, and only the search param
 * changes.
 *
 * ## Why `rel='nofollow'`
 *
 * Previous and next always go somewhere, so `?month=` is an unbounded corridor:
 * a crawler that follows these walks it forever, and every step is a Worker
 * invocation and a Turso query for a month that has never had an event in it.
 * The pages themselves are fine to index — the point of putting the month in
 * the URL was that each one is a real, cacheable, linkable address — so this
 * asks crawlers not to *discover* months by walking, rather than asking them
 * not to index the ones they are sent to. `sitemap.xml` lists `/calendar`
 * itself and nothing beyond it, for the same reason.
 *
 * The "Today" link is deliberately left followable: it points at `/calendar`,
 * which is already in the nav and the sitemap.
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
		rel='nofollow'
		aria-label={`${label}, ${monthLabel(month)}`}
		className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
	>
		{children}
	</Link>
);
