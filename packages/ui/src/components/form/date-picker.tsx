import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import { format } from 'date-fns';
import { CalendarSearchIcon, Clock2Icon } from 'lucide-react';
import {
	type ComponentProps,
	type ReactElement,
	type ReactNode,
	useRef,
	useState,
} from 'react';
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
} from '../ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/** Matches react-day-picker's range shape: `to` is unset until the second click. */
type DateRange = {
	to?: Date | undefined;
	from: Date | undefined;
};

type DatePickerValue = Date | DateRange | null | undefined;

const TIME_FORMAT = 'HH:mm:ss';

const toTimeValue = (date?: Date) => (date ? format(date, TIME_FORMAT) : '');

/** Copy of `date` with the h/m/s of `time` ('HH:mm' or 'HH:mm:ss') applied. */
const withTime = (date: Date, time: string) => {
	const [hours, minutes, seconds] = time.split(':');
	if (!hours || !minutes) return date;

	const next = new Date(date);
	next.setHours(Number(hours), Number(minutes), Number(seconds ?? 0), 0);
	return next;
};

interface DatePickerProps
	extends Omit<
		ComponentProps<'input'>,
		'value' | 'id' | 'name' | 'onBlur' | 'onChange' | 'className'
	> {
	dateFormat?: string;
	className?: string;
	label?: string | ReactElement;
	/**
	 * Rendered on the label's row, beside it rather than inside it. Use for
	 * controls that modify the field (an "all day" switch, a "clear" button) —
	 * nesting them in the label would tie them to this field's `htmlFor` and
	 * trip `FieldLabel`'s selectable-card styling.
	 */
	labelAction?: ReactNode;
	placeholder?: string;
	mode?: 'single' | 'range';
	/** Renders the time setter below the calendar. */
	showTime?: boolean;
}

export function DatePicker(props: DatePickerProps) {
	const field = useFieldContext<DatePickerValue>();

	// Times typed before a date exists to hang them on, so picking a day
	// afterwards keeps what the user entered instead of snapping to midnight.
	const pendingTime = useRef({ from: '', to: '' });

	const value = field.state.value;
	const rangeValue = value instanceof Date ? undefined : (value ?? undefined);
	const fromDate = value instanceof Date ? value : rangeValue?.from;
	const toDate = rangeValue?.to;

	const dateFormat =
		props.dateFormat ?? (props.showTime ? 'MM/dd/yyyy h:mm a' : 'MM/dd/yyyy');

	const displayValue = fromDate
		? props.mode === 'range'
			? `${format(fromDate, dateFormat)} - ${toDate ? format(toDate, dateFormat) : ''}`
			: format(fromDate, dateFormat)
		: '';

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	const timeFor = (key: 'from' | 'to', current?: Date) =>
		toTimeValue(current) || pendingTime.current[key];

	// The calendar always hands back a day at midnight, so re-apply whatever
	// time the field is already carrying.
	const handleSelect = (selected: DatePickerValue) => {
		if (!selected) {
			field.handleChange(selected);
			return;
		}

		if (selected instanceof Date) {
			field.handleChange(withTime(selected, timeFor('from', fromDate)));
			return;
		}

		field.handleChange({
			from: selected.from && withTime(selected.from, timeFor('from', fromDate)),
			to: selected.to && withTime(selected.to, timeFor('to', toDate)),
		});
	};

	const handleTimeChange = (key: 'from' | 'to') => (time: string) => {
		pendingTime.current[key] = time;

		const target = key === 'from' ? fromDate : toDate;
		if (!time || !target) return;

		if (value instanceof Date) {
			field.handleChange(withTime(target, time));
			return;
		}

		field.handleChange(
			key === 'from'
				? { from: withTime(target, time), to: toDate }
				: { from: fromDate, to: withTime(target, time) },
		);
	};

	return (
		<Field
			className={cn(props.className)}
			data-invalid={isInvalid}
			data-disabled={props.disabled}
		>
			{props.labelAction ? (
				<div className='flex items-center justify-between gap-2'>
					<FieldLabel
						htmlFor={field.name}
						className={cn(!props.label && 'sr-only')}
					>
						{props.label ?? field.name}
					</FieldLabel>
					{props.labelAction}
				</div>
			) : (
				<FieldLabel
					htmlFor={field.name}
					className={cn(!props.label && 'sr-only')}
				>
					{props.label ?? field.name}
				</FieldLabel>
			)}
			<InputGroup className='px-2'>
				<InputGroupText className='grow'>{displayValue}</InputGroupText>
				<InputGroupAddon align='inline-end'>
					<Popover>
						<PopoverTrigger
							render={
								<InputGroupButton>
									<CalendarSearchIcon />
								</InputGroupButton>
							}
						/>
						<PopoverContent className='w-fit' render={<Card size='sm' />}>
							<CardContent>
								{props.mode === 'range' ? (
									<Calendar
										mode='range'
										onSelect={handleSelect}
										selected={rangeValue}
										numberOfMonths={2}
										captionLayout='label'
										showOutsideDays={false}
									/>
								) : (
									<Calendar
										mode='single'
										onSelect={handleSelect}
										selected={fromDate}
										captionLayout='dropdown'
									/>
								)}
							</CardContent>
							{props.showTime && (
								<CardFooter className='border-t bg-card'>
									<FieldGroup
										className={cn(props.mode === 'range' && 'flex-row gap-4')}
									>
										<TimeField
											id={`${field.name}-time-from`}
											label={props.mode === 'range' ? 'Start Time' : undefined}
											value={toTimeValue(fromDate)}
											disabled={props.disabled}
											onTimeChange={handleTimeChange('from')}
										/>
										{props.mode === 'range' && (
											<TimeField
												id={`${field.name}-time-to`}
												label='End Time'
												value={toTimeValue(toDate)}
												disabled={props.disabled}
												onTimeChange={handleTimeChange('to')}
											/>
										)}
									</FieldGroup>
								</CardFooter>
							)}
						</PopoverContent>
					</Popover>
				</InputGroupAddon>
			</InputGroup>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

interface TimeFieldProps {
	id: string;
	label?: string;
	/** 'HH:mm:ss' held by the form field, or '' when no date is set yet. */
	value: string;
	disabled?: boolean;
	onTimeChange: (time: string) => void;
}

function TimeField(props: TimeFieldProps) {
	// The input owns its own text while it is being edited so a half-typed
	// segment is never yanked back by a re-render of the form field.
	const [draft, setDraft] = useState(props.value);
	const [synced, setSynced] = useState(props.value);

	if (props.value !== synced) {
		setSynced(props.value);
		setDraft(props.value);
	}

	return (
		<Field>
			<FieldLabel htmlFor={props.id} className={cn(!props.label && 'sr-only')}>
				{props.label ?? 'Time'}
			</FieldLabel>
			<InputGroup>
				<InputGroupInput
					id={props.id}
					type='time'
					step='1'
					value={draft}
					disabled={props.disabled}
					onChange={(e) => {
						setDraft(e.target.value);
						props.onTimeChange(e.target.value);
					}}
					className='appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
				/>
				<InputGroupAddon>
					<Clock2Icon className='text-muted-foreground' />
				</InputGroupAddon>
			</InputGroup>
		</Field>
	);
}
