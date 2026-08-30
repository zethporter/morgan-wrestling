import { cn } from '@morgan-wrestling/ui';
import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';
import { Button } from '@morgan-wrestling/ui/components/ui/button.js';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@morgan-wrestling/ui/components/ui/card';
import { Skeleton } from '@morgan-wrestling/ui/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CircleSmallIcon, EllipsisVerticalIcon, TrashIcon } from 'lucide-react';
import { getCalendarEvents } from '#/lib/calendar-fns';

const EventsSkeleton = () => {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
			{Array(12)
				.fill(0)
				.map((_, key) => (
					<Skeleton className='w-full h-32' key={key} />
				))}
		</div>
	);
};

interface CalendarEventsProps {
	calendarId: string;
	dateRange: {
		to: Date;
		from: Date;
	};
}
export const CalendarEvents = ({
	calendarId,
	dateRange,
}: CalendarEventsProps) => {
	const getEvents = useServerFn(getCalendarEvents);
	const { data, status } = useQuery({
		queryKey: ['calendar-events', { calendarId, dateRange }],
		queryFn: () => getEvents({ data: { calendarId, dateRange } }),
	});

	if (status === 'pending') return <EventsSkeleton />;
	if (status === 'error') return <div>Error Getting Events...</div>;
	if (data?.length === 0)
		return (
			<div className='w-full p-3 text-center'>
				No Events for Time Frame provided
			</div>
		);

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
			{data?.map((event) => (
				<Card size='sm' key={event.id}>
					<CardHeader>
						<CardTitle className='flex gap-2 items-end'>
							<CircleSmallIcon
								className={cn(
									calendarColors[
										event.eventColor as keyof typeof calendarColors
									],
								)}
							/>
							<span>{event.title}</span>
						</CardTitle>
						<CardDescription>{event.description}</CardDescription>
						<CardAction>
							<Button variant='ghost' size='icon-sm'>
								<EllipsisVerticalIcon />
							</Button>
						</CardAction>
					</CardHeader>

					<CardContent>
						<span>Add Event dats and stuff here.</span>
					</CardContent>
				</Card>
			))}
		</div>
	);
};
