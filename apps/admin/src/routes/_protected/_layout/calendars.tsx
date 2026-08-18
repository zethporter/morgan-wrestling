import { createFileRoute, Link } from '@tanstack/react-router';
import { NewCalendarDialog } from '#/components/new-calendar.tsx';
import { getCalendars } from '#/lib/calendar-fns.ts';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@morgan-wrestling/ui/components/ui/card';
import { Button } from '@morgan-wrestling/ui/components/ui/button.js';
import { CalendarIcon } from '@morgan-wrestling/ui/components/calendar/calendar-icon';
import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils.js';
import { CalendarDaysIcon } from 'lucide-react';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

const calendarsQueryOptions = queryOptions({
	queryKey: ['calendars'],
	queryFn: async () => {
		return await getCalendars();
	},
});

export const Route = createFileRoute('/_protected/_layout/calendars')({
	component: RouteComponent,
	loader: ({ context }) => {
		context.queryClient.ensureQueryData(calendarsQueryOptions)
	}
});

function RouteComponent() {
	const { data: calendars } = useSuspenseQuery(calendarsQueryOptions);

	return (
		<div className='p-5 flex flex-col w-full gap-5'>
			<div className='flex justify-between container mx-auto'>
				<div className='flex gap-2 items-center'>
					<CalendarDaysIcon />
					<h1 className='text-2xl font-bold'>Calendars</h1>
				</div>
				<NewCalendarDialog />
			</div>
			{calendars.map(({ id, name, color }) => <CalendarCard key={id} name={name} color={color as keyof typeof calendarColors} id={id}  />)}
		</div>
	);
}

function CalendarCard({id, name, color}: {
    id: string;
    name: string;
    color: keyof typeof calendarColors | null;
}) {
	return (
		<Card className='w-52'>
			<CardContent className='flex gap-2 items-center'>
				<CalendarIcon color={color} />
				<CardTitle>{name}</CardTitle>
				<Button variant='default' size='sm' render={<Link  to='/calendars/$calendarId' params={{ calendarId: id }}>View</Link> } />
			</CardContent>
		</Card>
	);
}
