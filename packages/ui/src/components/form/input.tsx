import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ComponentProps } from "react";
// import { cva } from "class-variance-authority"; // Possibly could use for more consistent input styling.
import { cn } from "@ui/lib/utils";

type FormInputProps = {
  field: AnyFieldApi;
  className?: string;
  inputClassName?: string;
  label?: string;
} & Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'onBlur' | 'onChange' | 'className'>;;

export const FormInput = (props: FormInputProps) => {
  const isInvalid = props.field.state.meta.isTouched && !props.field.state.meta.isValid;

  return (
    <Field className={cn(props.className)} data-invalid={isInvalid} data-disabled={props.disabled}>
      <FieldLabel htmlFor={props.field.name} className={cn(!props.label && 'sr-only')}>{props.label ?? props.field.name}</FieldLabel>
      <Input
        id={props.field.name}
        name={props.field.name}
        onBlur={props.field.handleBlur}
        onChange={(e) => props.field.handleChange(e.target.value)}
        value={props.field.state.value}
        disabled={props.disabled}
        aria-invalid={isInvalid}
        className={cn(props.inputClassName)}
        placeholder={props.placeholder}
      />
      {isInvalid && <FieldError errors={props.field.state.meta.errors} />}
    </Field>
  )
};
