import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@morgan-wrestling/ui/components/ui/dialog';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useParams, useRouteContext } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import {
	type UpdateCalendarValues,
	updateCalendar,
	updateCalendarValues,
} from '#/lib/calendar-fns';
import { calendarQueryOptions } from '#/lib/calendar-opts';

export const EditCalendarDialog = ({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) => {
	const { queryClient } = useRouteContext({
		from: '/_protected/_layout/calendars/$calendarId',
	});
	const { calendarId } = useParams({
		from: '/_protected/_layout/calendars/$calendarId',
	});

	const uc = useServerFn(updateCalendar);
	const { data } = useSuspenseQuery(calendarQueryOptions(calendarId));

	const editCalendar = useMutation({
		mutationFn: async (values: UpdateCalendarValues) =>
			await uc({
				data: {
					id: calendarId,
					values,
				},
			}),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Updating Calendar',
				id: 'new-calendar',
			}),
		onSuccess: () =>
			toast.update('new-calendar', {
				type: 'success',
				description: 'Calendar Updated',
			}),
		onError: (e) =>
			toast.update('new-calendar', {
				type: 'error',
				description: `Failed to Update: ${e.message}`,
			}),
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['calendars'] }),
	});

	const form = useAppForm({
		defaultValues: data,
		onSubmit: ({ value }) => {
			editCalendar.mutate(value);
		},
		validators: {
			onSubmit: updateCalendarValues,
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
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
					<DialogTitle className='text-lg'>Edit Calendar</DialogTitle>
				</DialogHeader>
				<form.AppField
					name='name'
					children={(field) => <field.FormInput label='Calendar Name' />}
				/>
				<form.AppField
					name='color'
					children={(field) => <field.FormCalendarColor label='Color' />}
				/>
				<DialogFooter>
					<form.Subscribe selector={(formState) => [formState.canSubmit]}>
						{([canSubmit]) => (
							<DialogClose
								render={
									<Button type='submit' size='default' disabled={!canSubmit}>
										Save
									</Button>
								}
							/>
						)}
					</form.Subscribe>
					<DialogClose
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
