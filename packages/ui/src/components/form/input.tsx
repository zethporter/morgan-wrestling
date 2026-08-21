// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.

import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import type { ComponentProps } from 'react';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';

type FormInputProps = {
	className?: string;
	inputClassName?: string;
	label?: string;
} & Omit<
	ComponentProps<typeof Input>,
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
			<Input
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
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
};
