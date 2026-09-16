import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@morgan-wrestling/ui/components/ui/dialog';
import {
	FieldGroup,
	FieldLegend,
	FieldSet,
} from '@morgan-wrestling/ui/components/ui/field';
import { Spinner } from '@morgan-wrestling/ui/components/ui/spinner.js';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@morgan-wrestling/ui/components/ui/tooltip';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { MapPinIcon, TicketIcon } from 'lucide-react';
import { useState } from 'react';
import {
	insertCalendarEvent,
	insertCalendarEventSchema,
} from '#/lib/calendar-fns';
import { CalendarEventType } from './admin-form/calendar-event-type';

export const NewEventDialog = ({ calendarId }: { calendarId: string }) => {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const insertEvent = useServerFn(insertCalendarEvent);

	const mutation = useMutation({
		mutationFn: insertEvent,
		onSuccess: () => {
			setOpen(false);
			toast.add({ type: 'success', description: 'Event created successfully' });
			queryClient.invalidateQueries({
				queryKey: ['calendar-events', calendarId],
			});
		},
		onError: (err) => toast.add({ type: 'error', description: err.message }),
	});

	const form = useAppForm({
		formId: 'new-calendar-event',
		defaultValues: {
			calendarId,
			title: '',
			description: '',
			location: '',
			startTime: null,
			endTime: null,
			allDay: false,
			eventTypeId: null,
		},
		onSubmit: async ({ value, formApi }) => {
			await mutation.mutateAsync({ data: value });
			formApi.reset();
		},
		validators: {
			onSubmit: insertCalendarEventSchema,
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger
					render={<DialogTrigger render={<Button variant='outline' />} />}
				>
					<TicketIcon />
					New Event
				</TooltipTrigger>
				<TooltipContent>Add new Event</TooltipContent>
			</Tooltip>
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
						<CalendarEventType label='Event Type' calendarId={calendarId} />
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
