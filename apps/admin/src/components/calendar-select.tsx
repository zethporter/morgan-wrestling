import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@morgan-wrestling/ui/components/ui/select';
import { cn } from '@morgan-wrestling/ui/index';
import { CalendarIcon } from 'lucide-react';

type Calendar = {
	id: string;
	name: string;
	color: string | null;
};

const NO_CALENDAR = '__no_default_calendar__';

export const CalendarSelect = ({
	calendars,
	value,
	onValueChange,
	allowNone = false,
}: {
	calendars: Array<Calendar>;
	value: string | null;
	onValueChange: (value: string | null) => void;
	allowNone?: boolean;
}) => {
	const selected = value ?? NO_CALENDAR;

	return (
		<Select
			value={selected}
			onValueChange={(value) =>
				onValueChange(value === NO_CALENDAR ? null : value)
			}
		>
			<SelectTrigger>
				<SelectValue
					children={(value) => {
						if (value === NO_CALENDAR) {
							return (
								<span className='text-muted-foreground'>
									No default calendar
								</span>
							);
						}
						const currCal = calendars?.find(
							(calendar) => calendar.id === value,
						);
						if (currCal) {
							return (
								<div className='flex items-center gap-2'>
									<CalendarIcon
										className={cn(
											calendarColors[
												currCal.color as keyof typeof calendarColors
											],
										)}
									/>
									<span>{currCal.name}</span>
								</div>
							);
						}
						return null;
					}}
				/>
			</SelectTrigger>
			<SelectContent alignItemWithTrigger={false}>
				{allowNone && (
					<SelectItem value={NO_CALENDAR}>
						<span className='text-muted-foreground'>No default calendar</span>
					</SelectItem>
				)}
				{calendars.map(({ id, name, color }) => (
					<SelectItem key={id} value={id}>
						<CalendarIcon
							className={cn(
								calendarColors[color as keyof typeof calendarColors],
							)}
						/>
						{name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
