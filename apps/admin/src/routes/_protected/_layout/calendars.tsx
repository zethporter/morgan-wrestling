import {
	Calendar,
	CalendarDayButton,
} from '@morgan-wrestling/ui/components/ui/calendar';
import { Card, CardContent } from '@morgan-wrestling/ui/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';
import { addDays } from 'date-fns';
import { CircleIcon } from 'lucide-react';
import * as React from 'react';
import { type DateRange } from 'react-day-picker';
import { NewCalendarDialog } from '#/components/new-calendar.tsx';
import { getCalendarFormDataFromServer } from '#/form-handlers/calendar.ts';

function CalendarCustomDays() {
	const [range, setRange] = React.useState<DateRange | undefined>({
		from: new Date(new Date().getFullYear(), 11, 8),
		to: addDays(new Date(new Date().getFullYear(), 11, 8), 10),
	});

	return (
		<Card className='mx-auto w-fit p-0'>
			<CardContent className='p-0'>
				<Calendar
					mode='range'
					defaultMonth={range?.from}
					selected={range}
					onSelect={setRange}
					numberOfMonths={1}
					captionLayout='dropdown'
					className='[--cell-size:--spacing(15)] md:[--cell-size:--spacing(17)]'
					formatters={{
						formatMonthDropdown: (date) => {
							return date.toLocaleString('default', { month: 'long' });
						},
					}}
					components={{
						DayButton: ({ children, modifiers, day, ...props }) => {
							const isWeekend =
								day.date.getDay() === 0 || day.date.getDay() === 6;

							return (
								<CalendarDayButton day={day} modifiers={modifiers} {...props}>
									{children}
									{!modifiers.outside && (
										<div className='w-full flex flex-wrap justify-center'>
											<CircleIcon className='stroke-transparent fill-cyan-300 size-2' />
											<CircleIcon className='stroke-transparent fill-pink-600 size-2' />
											<CircleIcon className='stroke-transparent fill-pink-600 size-2' />
										</div>
									)}
								</CalendarDayButton>
							);
						},
					}}
				/>
			</CardContent>
		</Card>
	);
}

export const Route = createFileRoute('/_protected/_layout/calendars')({
	component: RouteComponent,
	loader: async () => ({
		state: await getCalendarFormDataFromServer(),
	}),
});

function RouteComponent() {
	const { state } = Route.useLoaderData();

	return (
		<div className='p-5 flex justify-center w-full'>
			<NewCalendarDialog state={state} />
			<CalendarCustomDays />
		</div>
	);
}
