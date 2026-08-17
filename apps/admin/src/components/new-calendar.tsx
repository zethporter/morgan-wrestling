import { FormCalendarColor } from '@morgan-wrestling/ui/components/form/calendar-color.js';
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
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@morgan-wrestling/ui/components/ui/tooltip';
import { useForm } from '@tanstack/react-form-start';
import { CalendarPlusIcon } from 'lucide-react';
import {
	handleNewCalendarSubmit,
	newCalendarValidator,
} from '#/form-handlers/calendar';

export const NewCalendarDialog = () => {
	const form = useForm({
		defaultValues: {
			name: '',
			color: 'slate',
		},
		onSubmit: async ({ value }) => {
			// const calToast = toast.add({
			// 	type: 'loading',
			// 	description: 'Adding Calendar',
			// });
			// try {
			// 	const res = await handleNewCalendarSubmit({ data: value });
			// 	toast.add({
			// 		type: 'success',
			// 		description: res,
			// 		id: calToast,
			// 	});
			// } catch (e) {
			// 	toast.add({
			// 		type: 'error',
			// 		description: e instanceof Error ? e.message : String(e),
			// 		id: calToast,
			// 	});
			// }
			await toast.promise(handleNewCalendarSubmit({ data: value }), {
				loading: 'Creating calendar...',
				success: (res) => res,
				error: (err) => (err instanceof Error ? err.message : String(err)),
			});
		},
		validators: {
			onSubmit: newCalendarValidator,
		},
	});

	return (
		<Dialog>
			<DialogTrigger render={<Button size='icon' />}>
				<CalendarPlusIcon />
			</DialogTrigger>
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
				<form.Field
					name='name'
					children={(field) => (
						<FormInput field={field} label='Calendar Name' />
					)}
				/>
				<form.Field
					name='color'
					children={(field) => (
						<FormCalendarColor field={field} label='Color' />
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
	);
};
