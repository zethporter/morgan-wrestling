import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import { format } from 'date-fns';
import { CalendarSearchIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Calendar } from '../ui/calendar';
import { Field, FieldError, FieldLabel } from '../ui/field';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
} from '../ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type DateRange = {
	to: Date;
	from: Date;
};

interface DatePickerProps
	extends Omit<
		ComponentProps<'input'>,
		'value' | 'id' | 'name' | 'onBlur' | 'onChange' | 'className'
	> {
	dateFormat?: string;
	className?: string;
	label?: string;
	placeholder?: string;
	mode?: 'single' | 'range';
}

export function DatePicker(props: DatePickerProps) {
	const field = useFieldContext<Date | DateRange>();

	const displayValue =
		field.state.value instanceof Date
			? format(field.state.value, props.dateFormat ?? 'MM/dd/yyyy')
			: field.state.value
				? `${format(field.state.value.from, props.dateFormat ?? 'MM/dd/yyyy')} - ${format(field.state.value.to, props.dateFormat ?? 'MM/dd/yyyy')}`
				: '';

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	return (
		<Field
			className={cn(props.className)}
			data-invalid={isInvalid}
			data-disabled={props.disabled}
		>
			<FieldLabel
				htmlFor={field.name}
				className={cn(!props.label && 'sr-only')}
			>
				{props.label ?? field.name}
			</FieldLabel>
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
						<PopoverContent className='w-fit'>
							<Calendar
								mode={props.mode ?? 'single'}
								onSelect={field.handleChange}
								selected={field.state.value}
								numberOfMonths={2}
								captionLayout={props.mode === 'range' ? 'label' : 'dropdown'}
								showOutsideDays={props.mode !== 'range'}
							/>
						</PopoverContent>
					</Popover>
				</InputGroupAddon>
			</InputGroup>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}
