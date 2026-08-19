import { createFileRoute, Outlet } from '@tanstack/react-router';
import { NewCalendarDialog } from '#/components/new-calendar.tsx';
import { CalendarDaysIcon } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { calendarsQueryOptions } from '#/lib/calendar-opts';

export const Route = createFileRoute('/_protected/_layout/calendars/_calendarLayout')({
    loader: ({ context }) => {
        context.queryClient.ensureQueryData(
            calendarsQueryOptions
        );
	},
    component: RouteComponent
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
			<Outlet />
			{/*{calendars.map(({ id, name, color }) => <CalendarCard key={id} name={name} color={color as keyof typeof calendarColors} id={id}  />)}*/}
		</div>
	);
}
