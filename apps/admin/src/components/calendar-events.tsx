import { cn } from '@morgan-wrestling/ui';
import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';
import { Badge } from '@morgan-wrestling/ui/components/ui/badge';
import { Button } from '@morgan-wrestling/ui/components/ui/button.js';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@morgan-wrestling/ui/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@morgan-wrestling/ui/components/ui/dropdown-menu';
import { Skeleton } from '@morgan-wrestling/ui/components/ui/skeleton';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { format } from 'date-fns';
import {
	CircleSmallIcon,
	EditIcon,
	EllipsisVerticalIcon,
	MapPinIcon,
	TrashIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
	type CalendarEventCardProps,
	deleteCalendarEvent,
	getCalendarEvents,
} from '#/lib/calendar-fns';
import { EditEventDialog } from './edit-event';

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

const CalendarEventCard = ({ event }: { event: CalendarEventCardProps }) => {
	const [editOpen, setEditOpen] = useState(false);
	const { queryClient } = useRouteContext({ strict: false });
	const deleteEvent = useServerFn(deleteCalendarEvent);
	const delMutation = useMutation({
		mutationFn: async (id: number) => await deleteEvent({ data: { id } }),
		onMutate: () => {
			toast.add({
				type: 'loading',
				description: `Deleting event: ${event.title}`,
				id: String(event.id),
			});
		},
		onSuccess: () => {
			toast.update(String(event.id), {
				type: 'success',
				description: `Deleted event: ${event.title}`,
			});
			queryClient?.invalidateQueries({
				queryKey: ['calendar-events', { calendarId: event.calendarId }],
			});
		},
		onError: () => {
			toast.update(String(event.id), {
				type: 'error',
				description: `Error deleting event: ${event.title}`,
			});
		},
	});
	return (
		<Card size='sm' key={event.id}>
			<CardHeader>
				<CardTitle className='flex gap-2 items-end'>
					<span>{event.title}</span>
				</CardTitle>
				<CardDescription>{event.description}</CardDescription>
				<CardAction>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button variant='ghost' size='icon-sm'>
									<EllipsisVerticalIcon />
								</Button>
							}
						/>
						<DropdownMenuContent>
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={() => setEditOpen(true)}>
									<EditIcon /> Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={delMutation.isPending}
									onClick={() => delMutation.mutate(event.id)}
									variant='destructive'
								>
									<TrashIcon /> Delete
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</CardAction>
			</CardHeader>
			<CardContent className='flex gap-2 justify-end flex-wrap'>
				<div className='flex flex-col gap-2 w-full'>
					<span>{`${format(event.startTime, 'M/d/yy hh:mm aaa')} - ${format(event.endTime, 'M/d/yy hh:mm aaa')}`}</span>
					<div className='w-full flex flex-row gap-2 items-center'>
						<MapPinIcon className='size-4 stroke-primary' />
						<span className='grow ext-nowrap truncate text-ellipsis'>
							{event.location}
						</span>
					</div>
				</div>
				<Badge variant='outline' className='place-self-end'>
					<CircleSmallIcon
						className={cn(
							calendarColors[event.eventColor as keyof typeof calendarColors],
						)}
					/>
					<span>{event.eventType}</span>
				</Badge>
			</CardContent>
			<EditEventDialog event={event} open={editOpen} setOpen={setEditOpen} />
		</Card>
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
				<CalendarEventCard event={event} key={event.id} />
			))}
		</div>
	);
};
