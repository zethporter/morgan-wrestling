import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import {
	FormCalendarColor,
	FormCombobox,
	DatePicker as FormDatePicker,
	FormInput,
	FormSwitch,
	FormTextArea,
	GoogleSignInButton,
} from '../components/form';
import { Button } from '../components/ui/button';

const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
	fieldComponents: {
		FormCalendarColor,
		FormCombobox,
		FormInput,
		FormDatePicker,
		FormTextArea,
		FormSwitch,
	},
	formComponents: {
		SubmitButton: (props) => <Button type='submit' {...props} />,
		GoogleSignInButton,
	},
	fieldContext,
	formContext,
});

export { useAppForm, useFieldContext };
