// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.

import { cn } from '@morgan-wrestling/ui/lib/utils';
import { CalendarIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useFieldContext } from '../../hooks/use-form';
import { calendarColors } from '../calendar/calendar-utils';
import { Field, FieldError, FieldLabel } from '../ui/field';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';

type CalendarColorInputProps = {
	className?: string;
	inputClassName?: string;
	label?: string;
	Icon?: typeof CalendarIcon;
} & Omit<
	ComponentProps<typeof Select>,
	'id' | 'name' | 'onBlur' | 'onChange' | 'className'
>;

export const FormCalendarColor = ({
	Icon = CalendarIcon,
	...props
}: CalendarColorInputProps) => {
	const field = useFieldContext<keyof typeof calendarColors>();
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	const items = Object.keys(calendarColors).map((key) => ({
		value: key,
		label: key,
	}));

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
			<Select
				id={field.name}
				name={field.name}
				value={field.state.value}
				onValueChange={(value) =>
					field.handleChange(value as keyof typeof calendarColors)
				}
				items={items}
				disabled={props.disabled}
				data-invalid={isInvalid}
			>
				<SelectTrigger className={cn('w-full', props.inputClassName)}>
					<SelectValue
						children={(value) => (
							<div className='flex gap-2 items-center'>
								<Icon
									className={cn(
										calendarColors[value as keyof typeof calendarColors],
									)}
								/>
								<span>{value}</span>
							</div>
						)}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								<Icon
									className={cn(
										calendarColors[item.value as keyof typeof calendarColors],
									)}
								/>
								<span>{item.value}</span>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
};
