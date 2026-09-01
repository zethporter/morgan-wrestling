import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@morgan-wrestling/ui/components/ui/dialog';
import { Spinner } from '@morgan-wrestling/ui/components/ui/spinner.js';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { MapPinIcon } from 'lucide-react';
import {
	type CalendarEventCardProps,
	updateCalendarEvent,
	updateCalendarEventSchema,
} from '#/lib/calendar-fns';
import { CalendarEventType } from './admin-form/calendar-event-type';

export const EditEventDialog = ({
	event,
	open,
	setOpen,
}: {
	event: CalendarEventCardProps;
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const queryClient = useQueryClient();
	const updateEvent = useServerFn(updateCalendarEvent);

	const mutation = useMutation({
		mutationFn: updateEvent,
		onSuccess: () => {
			setOpen(false);
			toast.add({ type: 'success', description: 'Event created successfully' });
			queryClient.invalidateQueries({
				queryKey: ['calendar-events', { calendarId: event.calendarId }],
			});
		},
		onError: (err) => toast.add({ type: 'error', description: err.message }),
	});

	const form = useAppForm({
		formId: 'new-calendar-event',
		defaultValues: {
			calendarId: event.calendarId,
			title: event.title,
			description: event.description,
			location: event.location,
			startTime: event.startTime,
			endTime: event.endTime,
			allDay: event.allDay,
			eventTypeId: event.eventTypeId,
		},
		onSubmit: async ({ value, formApi }) => {
			await mutation.mutateAsync({
				data: {
					id: event.id,
					values: value,
				},
			});
			formApi.reset();
		},
		validators: {
			onSubmit: updateCalendarEventSchema,
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				showCloseButton={false}
				render={
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					/>
				}
			>
				<DialogHeader>
					<DialogTitle className='text-lg'>Add New Event</DialogTitle>
				</DialogHeader>
				<DialogDescription>
					<form.Subscribe
						selector={(form) => [form.isSubmitting]}
						children={([isSubmitting]) => {
							isSubmitting ? (
								<>
									<Spinner /> <span>Creating Event...</span>
								</>
							) : (
								<span></span>
							);
						}}
					/>
				</DialogDescription>
				<form.AppField
					name='title'
					children={(field) => <field.FormInput label='Title' />}
				/>
				<form.AppField
					name='eventTypeId'
					children={() => (
						<CalendarEventType
							label='Event Type'
							calendarId={event.calendarId}
						/>
					)}
				/>
				<form.AppField
					name='description'
					children={(field) => <field.FormTextArea label='Description' />}
				/>
				<form.Subscribe
					selector={(state) => [state.values.allDay]}
					children={([isAllDay]) => {
						return (
							<form.AppField
								name='startTime'
								children={(field) => (
									<field.FormDatePicker
										label='Start Date'
										labelAction={
											<form.AppField
												name='allDay'
												children={(field) => (
													<field.FormSwitch className='w-fit' label='All Day' />
												)}
											/>
										}
										showTime={!isAllDay}
									/>
								)}
							/>
						);
					}}
				/>
				<form.Subscribe
					selector={(state) => [state.values.allDay]}
					children={([isAllDay]) => {
						return (
							<form.AppField
								name='endTime'
								children={(field) => (
									<field.FormDatePicker label='End Date' showTime={!isAllDay} />
								)}
							/>
						);
					}}
				/>
				<form.AppField
					name='location'
					children={(field) => (
						<field.FormInput label='Location' prefix={<MapPinIcon />} />
					)}
				/>
				<DialogFooter>
					<form.Subscribe selector={(formState) => [formState.canSubmit]}>
						{([canSubmit]) => (
							<Button type='submit' size='default' disabled={!canSubmit}>
								Create
							</Button>
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
	);
};
