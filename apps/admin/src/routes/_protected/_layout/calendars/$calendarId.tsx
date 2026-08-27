import { cn } from '@morgan-wrestling/ui';
import { calendarColors } from '@morgan-wrestling/ui/components/calendar/calendar-utils';
import { Button } from '@morgan-wrestling/ui/components/ui/button.js';
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
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import {
	CalendarCogIcon,
	CalendarDaysIcon,
	CalendarIcon,
	Edit,
	EllipsisVerticalIcon,
	TrashIcon,
} from 'lucide-react';
import { z } from 'zod';
import { EditCalendarDialog } from '#/components/edit-calendar';
import { NewCalendarDialog } from '#/components/new-calendar.tsx';
import { deleteCalendar } from '#/lib/calendar-fns';
import {
	calendarQueryOptions,
	calendarsQueryOptions,
	LAST_CALENDAR_KEY,
} from '#/lib/calendar-opts';

const calendarIdSearchParams = z
	.object({
		editCalendar: z.boolean().default(false).optional(),
	})
	.optional()
	.default({ editCalendar: false });

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
	validateSearch: calendarIdSearchParams,
});

function RouteComponent() {
	const { calendarId } = Route.useParams();
	const { queryClient } = Route.useRouteContext();
	const router = Route.useNavigate();

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

	const openEditCalendar = () =>
		router({
			search: () => ({ editCalendar: true }),
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
			<div>
				Hello "/_protected/_layout/calendars/<span>{calendarId}</span>"!
			</div>

			<EditCalendarDialog />
		</div>
	);
}
