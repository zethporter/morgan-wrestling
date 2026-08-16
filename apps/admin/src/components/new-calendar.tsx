import { CalendarColorInput } from '@morgan-wrestling/ui/components/form/calendar-color.js';
import { FormInput } from '@morgan-wrestling/ui/components/form/input';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@morgan-wrestling/ui/components/ui/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@morgan-wrestling/ui/components/ui/tooltip';
import type { ServerFormState } from '@tanstack/react-form';
import {
	mergeForm,
	useForm,
	useSelector,
	useTransform,
} from '@tanstack/react-form-start';
import { CalendarPlusIcon } from 'lucide-react';
import {
	handleNewCalendarSubmit,
	newCalendarFormOptions,
	newCalendarValidator,
} from '#/form-handlers/calendar';

export const NewCalendarDialog = ({
	state,
}: {
	state: ServerFormState<any, undefined>;
}) => {
	const form = useForm({
		...newCalendarFormOptions,
		validators: {
			onSubmit: (form) => newCalendarValidator.parse(form),
		},
		transform: useTransform((baseForm) => mergeForm(baseForm, state), [state]),
	});

	return (
		<form
			action={handleNewCalendarSubmit.url}
			method={'POST'}
			encType={'multipart/form-data'}
		>
			<Dialog>
				<DialogTrigger render={<Button size='icon' />}>
					<CalendarPlusIcon />
				</DialogTrigger>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle className='text-lg'>Add New Calendar</DialogTitle>
					</DialogHeader>
					<form.Field
						name='name'
						children={(field) => (
							<FormInput field={field} label='Calendar Name' />
						)}
					/>
					<form.Field
						name='color'
						children={(field) => (
							<CalendarColorInput field={field} label='Color' />
						)}
					/>
					<DialogFooter>
						<form.Subscribe selector={(formState) => [formState.canSubmit]}>
							{([canSubmit]) => (
								<DialogClose
									render={
										<Button type='submit' size='default' disabled={!canSubmit}>
											Create
										</Button>
									}
								/>
							)}
						</form.Subscribe>
						<DialogClose
							onClick={() => form.reset()}
							render={
								<Button variant='outline' size='default'>
									Cancel
								</Button>
							}
						/>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form>
	);
};
