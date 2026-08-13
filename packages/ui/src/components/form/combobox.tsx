import { Field, FieldError, FieldLabel } from '../ui/field';
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxList,
	ComboboxItem,
} from '../ui/combobox';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { ComponentProps } from 'react';
// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.
import { cn } from '@ui/lib/utils';

type FormInputProps = {
	field: AnyFieldApi;
	className?: string;
	inputClassName?: string;
	label?: string;
	items: Array<{ value: string; label: string }>;
	placeholder?: string;
} & Omit<
	ComponentProps<typeof Combobox>,
	'id' | 'name' | 'onBlur' | 'onChange' | 'className'
>;

export const FormInput = (props: FormInputProps) => {
	const isInvalid =
		props.field.state.meta.isTouched && !props.field.state.meta.isValid;

	return (
		<Field
			className={cn(props.className)}
			data-invalid={isInvalid}
			data-disabled={props.disabled}
		>
			<FieldLabel
				htmlFor={props.field.name}
				className={cn(!props.label && 'sr-only')}
			>
				{props.label ?? props.field.name}
			</FieldLabel>
			<Combobox
				aria-invalid={isInvalid}
				items={props.items}
				id={props.field.name}
				value={props.field.state.value}
				onValueChange={props.field.handleChange}
			>
				<ComboboxInput
					className={cn(props.inputClassName)}
					aria-invalid={isInvalid}
					placeholder={props.placeholder}
					onBlur={props.field.handleBlur}
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
			{isInvalid && <FieldError errors={props.field.state.meta.errors} />}
		</Field>
	);
};
