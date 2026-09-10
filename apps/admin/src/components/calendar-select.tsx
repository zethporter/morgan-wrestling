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
export const CalendarSelect = ({
	calendars,
	value,
	onValueChange,
}: {
	calendars: Array<Calendar>;
	value: string;
	onValueChange: (value: string | null) => void;
}) => {
	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger>
				<SelectValue
					children={(value) => {
						const currCal = (calendars ?? []).find(
							(calendar) => calendar.id === value,
						);
						if (!!currCal) {
							return (
								<div className='flex gap-2 items-center'>
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
