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
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@morgan-wrestling/ui/components/ui/tooltip';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarPlusIcon } from 'lucide-react';
import { insertCalendar, newCalendarValidator } from '#/lib/calendar-fns';

export const NewCalendarDialog = () => {
	const queryClient = useQueryClient();

	const form = useAppForm({
		defaultValues: {
			name: '',
			color: 'slate',
		},
		onSubmit: async ({ value }) => {
			await toast.promise(insertCalendar({ data: value }), {
				loading: 'Creating calendar...',
				success: (res) => {
					queryClient.invalidateQueries({ queryKey: ['calendars'] });
					return res;
				},
				error: (err) => (err instanceof Error ? err.message : String(err)),
			});
		},
		validators: {
			onSubmit: newCalendarValidator,
		},
	});

	return (
		<Dialog>
			<Tooltip>
				<TooltipTrigger render={<DialogTrigger render={<Button />} />}>
					<CalendarPlusIcon className='stroke-3' />
					New Calendar
				</TooltipTrigger>
				<TooltipContent>Add new Calendar</TooltipContent>
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
					<DialogTitle className='text-lg'>Add New Calendar</DialogTitle>
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
