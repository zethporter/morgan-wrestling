// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.

import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';
import {
	Field,
	FieldError,
	FieldLabel,
} from '@morgan-wrestling/ui/components/ui/field';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@morgan-wrestling/ui/components/ui/select';
import { Skeleton } from '@morgan-wrestling/ui/components/ui/skeleton';
import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CircleSmallIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { getEventTypes } from '#/lib/calendar-fns';
import { NewEventTypePopover } from './new-event-type';

type CalendarColorInputProps = {
	className?: string;
	inputClassName?: string;
	label?: string;
	calendarId: string;
} & Omit<
	ComponentProps<typeof Select>,
	'id' | 'name' | 'onBlur' | 'onChange' | 'className'
>;

export const CalendarEventType = ({
	calendarId,
	...props
}: CalendarColorInputProps) => {
	const field = useFieldContext<keyof typeof calendarColors>();
	const getItems = useServerFn(getEventTypes);

	const { data, status, error, refetch } = useQuery({
		queryKey: ['event-types', calendarId],
		queryFn: async () => await getItems({ data: { calendarId } }),
		enabled: !!calendarId,
		staleTime: Infinity,
	});

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
			{status === 'pending' ? (
				<Skeleton className={cn('w-full h-9', props.inputClassName)} />
			) : (
				<Select
					id={field.name}
					name={field.name}
					value={field.state.value}
					onValueChange={(value) =>
						field.handleChange(value as keyof typeof calendarColors)
					}
					items={data}
					disabled={props.disabled}
					data-invalid={isInvalid}
				>
					<SelectTrigger className={cn('w-full', props.inputClassName)}>
						<SelectValue
							children={(value) => {
								const eventType = data?.find((item) => item.value === value);
								return (
									<div className='flex gap-2 items-center'>
										<CircleSmallIcon
											className={cn(
												calendarColors[
													eventType?.color as keyof typeof calendarColors
												],
											)}
										/>
										<span>{eventType?.label}</span>
									</div>
								);
							}}
						/>
					</SelectTrigger>
					<SelectContent alignItemWithTrigger={true}>
						<SelectGroup>
							{status === 'success' &&
								data.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										<CircleSmallIcon
											className={cn(
												'self-center',
												calendarColors[
													item.color as keyof typeof calendarColors
												],
											)}
										/>
										<span>{item.label}</span>
									</SelectItem>
								))}
						</SelectGroup>
						<SelectSeparator />
						<SelectGroup>
							<NewEventTypePopover calendarId={calendarId} refetch={refetch} />
						</SelectGroup>
					</SelectContent>
				</Select>
			)}
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
			{status === 'error' && <FieldError errors={[error]} />}
		</Field>
	);
};
