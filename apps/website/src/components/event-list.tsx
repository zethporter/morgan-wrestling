import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import { CircleIcon, MapPinIcon } from 'lucide-react';
import type { PublicEvent } from '#/lib/calendar-fns';
import { formatEventWhen } from '#/lib/calendar-month';

/**
 * The `--calendar-*` tokens in `packages/styles` as text colours, keyed by the
 * name stored in `calendar_event_types.color`. A colour the map does not know —
 * or a row with none — falls back to the muted foreground rather than rendering
 * an unresolved class name.
 */
export const eventColorClass = (color: string | null): string =>
	calendarColors[color as keyof typeof calendarColors] ??
	'text-muted-foreground';

export const EventDot = ({
	color,
	className,
}: {
	color: string | null;
	className?: string;
}) => (
	<CircleIcon
		aria-hidden='true'
		className={cn(
			'size-2 shrink-0 fill-current stroke-transparent',
			eventColorClass(color),
			className,
		)}
	/>
);

/**
 * An upcoming-events list: when, what, where, and what kind. A plain list of
 * text, so it reads with JavaScript off and is what a crawler sees.
 *
 * `showCalendar` is for the pages that pool several calendars together — on a
 * single calendar's page the name would be on every row and say nothing.
 */
export const EventList = ({
	events,
	title = 'Upcoming events',
	showCalendar = false,
	emptyMessage = 'Nothing on the schedule yet.',
	className,
}: {
	events: PublicEvent[];
	title?: string;
	showCalendar?: boolean;
	emptyMessage?: string;
	className?: string;
}) => (
	<section className={cn('w-full', className)}>
		<h2 className='font-semibold text-muted-foreground text-sm uppercase tracking-wide'>
			{title}
		</h2>
		{events.length === 0 ? (
			<p className='mt-3 text-muted-foreground'>{emptyMessage}</p>
		) : (
			<ul className='mt-3 flex flex-col divide-y divide-border'>
				{events.map((event) => (
					<li key={event.id} className='flex flex-col gap-1 py-3'>
						<div className='flex items-baseline gap-2'>
							<EventDot
								color={event.eventTypeColor}
								className='translate-y-1'
							/>
							<span className='font-medium'>{event.title}</span>
						</div>
						<p className='text-muted-foreground text-sm'>
							{formatEventWhen(event)}
						</p>
						{event.location && (
							<p className='flex items-start gap-1 text-muted-foreground text-sm'>
								<MapPinIcon
									aria-hidden='true'
									className='mt-0.5 size-3.5 shrink-0'
								/>
								{/* Locations are free text in the admin and can be long. */}
								<span className='break-all'>{event.location}</span>
							</p>
						)}
						<p className='text-muted-foreground text-xs'>
							{[event.eventType, showCalendar ? event.calendarName : null]
								.filter((label) => label)
								.join(' · ')}
						</p>
					</li>
				))}
			</ul>
		)}
	</section>
);
