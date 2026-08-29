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
import { TicketIcon } from 'lucide-react';
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
			queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] });
		},
		onError: (err) => toast.add({ type: 'error', description: err.message }),
	});

	const form = useAppForm({
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
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync({ data: value });
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
					<DialogTitle className='text-lg'>
						Add New Event <span>{calendarId}</span>
					</DialogTitle>
				</DialogHeader>
				<DialogDescription>
					{form.state.isSubmitting ? (
						<>
							<Spinner /> <span>Creating Event...</span>
						</>
					) : (
						<span></span>
					)}
				</DialogDescription>
				<form.AppField
					name='name'
					children={(field) => <field.FormInput label='Calendar Name' />}
				/>
				<form.AppField
					name='eventTypeId'
					children={() => <CalendarEventType calendarId={calendarId} />}
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
	);
};
