// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.

import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import type { ComponentProps } from 'react';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Switch } from '../ui/switch';

type FormSwitchProps = {
	className?: string;
	inputClassName?: string;
	label?: string;
} & Omit<
	ComponentProps<typeof Switch>,
	| 'id'
	| 'name'
	| 'onBlur'
	| 'onChange'
	| 'className'
	| 'checked'
	| 'defaultChecked'
	| 'onCheckedChange'
>;

export const FormSwitch = ({
	className,
	inputClassName,
	label,
	...switchProps
}: FormSwitchProps) => {
	const field = useFieldContext<boolean>();
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	return (
		<Field
			className={cn(className)}
			data-invalid={isInvalid}
			data-disabled={switchProps.disabled}
			orientation='horizontal'
		>
			<FieldLabel htmlFor={field.name} className={cn(!label && 'sr-only')}>
				{label ?? field.name}
			</FieldLabel>
			<Switch
				{...switchProps}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onCheckedChange={(e) => field.handleChange(e)}
				checked={field.state.value}
				aria-invalid={isInvalid}
				className={cn(inputClassName)}
			/>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
};
