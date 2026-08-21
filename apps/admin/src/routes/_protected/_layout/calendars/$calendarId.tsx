import { createFileRoute } from '@tanstack/react-router';
import { NewCalendarDialog } from '#/components/new-calendar.tsx';
import { CalendarDaysIcon, CalendarIcon } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { LAST_CALENDAR_KEY, calendarsQueryOptions } from '#/lib/calendar-opts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@morgan-wrestling/ui/components/ui/select';
import { cn } from '@morgan-wrestling/ui';
import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';


export const Route = createFileRoute(
  '/_protected/_layout/calendars/$calendarId',
)({
	component: RouteComponent,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(calendarsQueryOptions);

		if (typeof window === 'undefined') return;
		localStorage.setItem(LAST_CALENDAR_KEY, params.calendarId);
	},
})

function RouteComponent() {
	const { calendarId } = Route.useParams();
	const router = Route.useNavigate();
	const { data: calendars } = useSuspenseQuery(calendarsQueryOptions);

	return (
		<div className='p-5 flex flex-col w-full gap-5'>
			<div className='flex justify-between container mx-auto'>
				<div className='flex gap-2 items-center'>
					<CalendarDaysIcon />
					<h1 className='text-2xl font-bold'>Calendars</h1>
					<Select value={calendarId} onValueChange={(value) => router({ to: '/calendars/$calendarId', params: { calendarId: value ?? '' }})}>
						<SelectTrigger>
							<SelectValue children={(value) => {
								const currCal = calendars.find(calendar => calendar.id === value);
								if (!!currCal) {
									return (<div className='flex gap-2 items-center'><CalendarIcon className={cn(calendarColors[currCal.color as keyof typeof calendarColors])} />
										<span>{currCal.name}</span></div>);
								}
								return null;
							}} />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{calendars.map(({ id, name, color }) => (
								<SelectItem key={id} value={id}>
									<CalendarIcon className={cn(calendarColors[color as keyof typeof calendarColors])} />
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<NewCalendarDialog />
			</div>
			<div>Hello "/_protected/_layout/calendars/<span>{calendarId}</span>"!</div>
		</div>
	)
}
