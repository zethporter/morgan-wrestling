import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@morgan-wrestling/ui/components/ui/alert-dialog';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import { Spinner } from '@morgan-wrestling/ui/components/ui/spinner';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useServerFn } from '@tanstack/react-start';
import { CircleSmallIcon } from 'lucide-react';
import { useState } from 'react';
import {
	insertCalendarEventType,
	insertCalendarEventTypeSchema,
} from '#/lib/calendar-fns';

export const NewEventTypePopover = ({
	calendarId,
	refetch,
}: {
	calendarId: string;
	refetch: () => void;
}) => {
	const [open, setOpen] = useState(false);
	const addEventType = useServerFn(insertCalendarEventType);
	const form = useAppForm({
		defaultValues: {
			calendarId,
			name: '',
			color: '',
		},
		validators: {
			onSubmit: insertCalendarEventTypeSchema,
		},
		onSubmit: async ({ value }) => {
			await addEventType({
				data: value,
			});
			refetch();
			setOpen(false);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger
				render={<Button variant='outline' className='w-full' size='sm' />}
			>
				Create New Event Type
			</AlertDialogTrigger>
			<AlertDialogContent
				// This dialog is a React child of the Select popup that renders it, so
				// keydowns bubble into the Select's typeahead, which preventDefaults
				// every character key. Stop printable keys here; leave Escape/Tab/arrows
				// alone so the dialog's own dismiss and focus handling still work.
				onKeyDown={(e) => {
					if (e.key.length === 1) {
						e.stopPropagation();
					}
				}}
			>
				<AlertDialogTitle>New Event Type</AlertDialogTitle>
				<AlertDialogDescription className='flex flex-row gap-2 items-center'>
					{form.state.isSubmitting ? (
						<>
							<Spinner /> Creating
						</>
					) : (
						'Create a new event type'
					)}
				</AlertDialogDescription>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className='flex flex-col gap-2'
				>
					<form.AppField
						name='name'
						children={(field) => <field.FormInput label='Name' />}
					/>
					<form.AppField
						name='color'
						children={(field) => (
							<field.FormCalendarColor label='Color' Icon={CircleSmallIcon} />
						)}
					/>
					<AlertDialogFooter>
						<form.SubmitButton>Create Event Type</form.SubmitButton>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
};
