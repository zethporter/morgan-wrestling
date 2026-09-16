// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.

import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import type { ComponentProps, ReactNode } from 'react';
import { Field, FieldError, FieldLabel } from '../ui/field';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '../ui/input-group';

type FormInputProps = {
	className?: string;
	inputClassName?: string;
	label?: string;
	prefix?: ReactNode;
	suffix?: ReactNode;
} & Omit<
	ComponentProps<typeof InputGroupInput>,
	'id' | 'name' | 'onBlur' | 'onChange' | 'className'
>;

export const FormInput = (props: FormInputProps) => {
	const field = useFieldContext<string>();
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
			<InputGroup>
				<InputGroupAddon align='inline-start'>{props.prefix}</InputGroupAddon>
				<InputGroupInput
					id={field.name}
					name={field.name}
					onBlur={field.handleBlur}
					onChange={(e) => field.handleChange(e.target.value)}
					value={field.state.value}
					disabled={props.disabled}
					aria-invalid={isInvalid}
					className={cn(props.inputClassName)}
					{...props}
				/>
				<InputGroupAddon align='inline-end'>{props.suffix}</InputGroupAddon>
			</InputGroup>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
};
