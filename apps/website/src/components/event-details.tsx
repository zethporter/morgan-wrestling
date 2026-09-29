import { cn } from '@morgan-wrestling/ui/lib/utils';
import { ClockIcon, MapPinIcon } from 'lucide-react';
import { EventDot } from '#/components/event-list';
import type { PublicEvent } from '#/lib/calendar-fns';
import { type CivilDate, formatEventWhen } from '#/lib/calendar-month';

/**
 * The id of an event's details panel on a calendar page.
 *
 * A month bar links to this, and the panel below the grid answers to it. That
 * makes the same id the dialog's fallback and a shareable address for one
 * event — see the note in `month-calendar.tsx`.
 */
export const eventAnchorId = (eventId: number): string => `event-${eventId}`;

/**
 * When, where and what kind, for one event. The body of both the month grid's
 * dialog and the `:target` panel behind it, so the two cannot drift.
 *
 * The title is the caller's to render: in the dialog it is the `DialogTitle`,
 * and in the panel it is a heading.
 */
export const EventDetails = ({
	event,
	today,
	showCalendar = false,
	className,
}: {
	event: PublicEvent;
	today?: CivilDate;
	showCalendar?: boolean;
	className?: string;
}) => {
	const kind = [event.eventType, showCalendar ? event.calendarName : null]
		.filter((label) => label)
		.join(' · ');

	return (
		<div className={cn('flex flex-col gap-1.5 text-sm', className)}>
			<p className='flex items-start gap-1.5'>
				<ClockIcon
					aria-hidden='true'
					className='mt-0.5 size-3.5 shrink-0 text-muted-foreground'
				/>
				{formatEventWhen(event, today)}
			</p>
			{event.location && (
				<p className='flex items-start gap-1.5'>
					<MapPinIcon
						aria-hidden='true'
						className='mt-0.5 size-3.5 shrink-0 text-muted-foreground'
					/>
					{/* Locations are free text in the admin and can be long. */}
					<span className='break-all'>{event.location}</span>
				</p>
			)}
			{kind && (
				<p className='flex items-center gap-1.5 text-muted-foreground text-xs'>
					<EventDot color={event.eventTypeColor} />
					{kind}
				</p>
			)}
		</div>
	);
};
