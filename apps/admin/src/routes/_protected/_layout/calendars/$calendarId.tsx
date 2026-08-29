import { cn } from '@morgan-wrestling/ui';
import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@morgan-wrestling/ui/components/ui/dropdown-menu.js';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@morgan-wrestling/ui/components/ui/select';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { addMonths } from 'date-fns';
import {
	CalendarCogIcon,
	CalendarDaysIcon,
	CalendarIcon,
	EllipsisVerticalIcon,
	SearchIcon,
	TicketIcon,
	TrashIcon,
} from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { EditCalendarDialog } from '#/components/edit-calendar';
import { NewCalendarDialog } from '#/components/new-calendar';
import { NewEventDialog } from '#/components/new-event';
import { deleteCalendar } from '#/lib/calendar-fns';
import {
	calendarQueryOptions,
	calendarsQueryOptions,
	LAST_CALENDAR_KEY,
} from '#/lib/calendar-opts';

const calendarSearchParams = z.object({
	dateRange: z.object({
		from: z.date(),
		to: z.date(),
	}),
	search: z.string(),
});

export const Route = createFileRoute(
	'/_protected/_layout/calendars/$calendarId',
)({
	component: RouteComponent,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(calendarsQueryOptions);
		await context.queryClient.ensureQueryData(
			calendarQueryOptions(params.calendarId),
		);

		if (typeof window === 'undefined') return;
		localStorage.setItem(LAST_CALENDAR_KEY, params.calendarId);
	},
});

function RouteComponent() {
	const { calendarId } = Route.useParams();
	const { queryClient } = Route.useRouteContext();
	const router = Route.useNavigate();

	const [editCal, setEditCal] = useState<boolean>(false);

	const dc = useServerFn(deleteCalendar);
	const deleteMutation = useMutation({
		mutationFn: async () => await dc({ data: { id: calendarId } }),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Deleting Calendar',
				id: 'del-calendar',
			}),
		onSuccess: () =>
			toast.update('del-calendar', {
				type: 'success',
				description: 'Deleted Calendar',
			}),
		onError: (e) =>
			toast.update('del-calendar', {
				type: 'error',
				description: `Failed to delete toast: ${e.message}`,
			}),
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['calendars'] }),
	});

	const { data: calendars } = useSuspenseQuery(calendarsQueryOptions);
	const _calendars = calendars ?? [];

	const openEditCalendar = () => setEditCal((curr) => !curr);

	const form = useAppForm({
		defaultValues: {
			dateRange: {
				from: new Date(),
				to: addMonths(new Date(), 1),
			},
			search: '',
		},
		validators: {
			onSubmit: calendarSearchParams,
		},
		onSubmit: ({ value }) => {
			toast.add({
				type: 'success',
				description: `Search submitted from ${value.dateRange.from.toJSON()} to ${value.dateRange.to.toJSON()}`,
			});
		},
	});

	return (
		<div className='p-5 flex flex-col w-full gap-5'>
			<div className='flex justify-between container mx-auto'>
				<div className='flex gap-2 items-center'>
					<CalendarDaysIcon />
					<h1 className='text-2xl font-bold'>Calendars</h1>
					<Select
						value={calendarId}
						onValueChange={(value) =>
							router({
								to: '/calendars/$calendarId',
								params: { calendarId: value ?? '' },
							})
						}
					>
						<SelectTrigger>
							<SelectValue
								children={(value) => {
									const currCal = (_calendars ?? []).find(
										(calendar) => calendar.id === value,
									);
									if (!!currCal) {
										return (
											<div className='flex gap-2 items-center'>
												<CalendarIcon
													className={cn(
														calendarColors[
															currCal.color as keyof typeof calendarColors
														],
													)}
												/>
												<span>{currCal.name}</span>
											</div>
										);
									}
									return null;
								}}
							/>
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{_calendars.map(({ id, name, color }) => (
								<SelectItem key={id} value={id}>
									<CalendarIcon
										className={cn(
											calendarColors[color as keyof typeof calendarColors],
										)}
									/>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<NewCalendarDialog />
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button variant='ghost'>
								<EllipsisVerticalIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className='w-fit'>
							<DropdownMenuItem onClick={openEditCalendar}>
								<CalendarCogIcon /> Edit Calendar
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => deleteMutation.mutate()}
								variant='destructive'
							>
								<TrashIcon /> Delete Calendar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className='flex flex-row flex-wrap justify-between gap-2'
			>
				<div className='grow flex flex-row gap-2'>
					<form.AppField
						name='dateRange'
						children={(field) => (
							<field.FormDatePicker mode='range' className='max-w-sm grow' />
						)}
					/>
					<form.SubmitButton variant='secondary'>
						<SearchIcon />
					</form.SubmitButton>
				</div>
				<NewEventDialog calendarId={calendarId} />
			</form>
			<EditCalendarDialog open={editCal} onOpenChange={openEditCalendar} />
		</div>
	);
}
