// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.

import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '../ui/combobox';
import { Field, FieldError, FieldLabel } from '../ui/field';

type ComboBoxProps = {
	className?: string;
	inputClassName?: string;
	label?: string;
	items: Array<{ value: string; label: string }>;
	placeholder?: string;
} & Omit<
	ComponentProps<typeof Combobox>,
	'id' | 'name' | 'onBlur' | 'onChange' | 'className'
>;

export const FormCombobox = (props: ComboBoxProps) => {
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
			<Combobox
				aria-invalid={isInvalid}
				items={props.items}
				id={field.name}
				value={field.state.value}
				onValueChange={field.handleChange}
			>
				<ComboboxInput
					className={cn(props.inputClassName)}
					aria-invalid={isInvalid}
					placeholder={props.placeholder}
					onBlur={field.handleBlur}
				/>
				<ComboboxContent>
					<ComboboxEmpty>No Items</ComboboxEmpty>
					<ComboboxList>
						{props.items.map((item) => (
							<ComboboxItem key={item.value} value={item.value}>
								{item.label}
							</ComboboxItem>
						))}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
};
