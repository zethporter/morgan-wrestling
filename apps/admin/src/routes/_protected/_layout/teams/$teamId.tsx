import { Button } from '@morgan-wrestling/ui/components/ui/button.js';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@morgan-wrestling/ui/components/ui/dropdown-menu';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@morgan-wrestling/ui/components/ui/select.js';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import {
	BlocksIcon,
	Edit2Icon,
	EllipsisVerticalIcon,
	PlusIcon,
	TrashIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { deleteTeam } from '#/lib/team-fns';
import {
	LAST_TEAM_KEY,
	NO_TEAMS,
	teamPagesQueryOptions,
	teamQueryOptions,
	teamsQueryOptions,
} from '#/lib/teams-opts';

export const Route = createFileRoute('/_protected/_layout/teams/$teamId')({
	component: RouteComponent,
	loader: async ({ context, params }) => {
		if (params.teamId !== NO_TEAMS) {
			await context.queryClient.query(teamQueryOptions(params.teamId));
			await context.queryClient.query(teamPagesQueryOptions(params.teamId));
		} else {
			return;
		}

		if (typeof window === 'undefined') return;
		localStorage.setItem(LAST_TEAM_KEY, params.teamId);
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const { queryClient } = Route.useRouteContext();
	const router = Route.useNavigate();

	const dt = useServerFn(deleteTeam);
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => await dt({ data: { id } }),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Deleting Team',
				id: 'del-team',
			}),
		onSuccess: () =>
			toast.update('del-team', {
				type: 'success',
				description: 'Deleted Team',
			}),
		onError: (e) =>
			toast.update('del-team', {
				type: 'error',
				description: `Failed to delete toast: ${e.message}`,
			}),
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
	});

	const { data: teams } = useSuspenseQuery(teamsQueryOptions);
	// useSuspenseQuery forces enabled: true, so this has to be useQuery for the
	// `enabled` guard in teamPagesQueryOptions to keep NO_TEAMS off the wire.
	const { data: pages } = useQuery(teamPagesQueryOptions(params.teamId));
	const teamSelectItems = useMemo(() => {
		return teams.map((team) => ({ label: team.name, value: team.id }));
	}, [teams]);

	return (
		<div className='p-5 flex flex-col w-full gap-5'>
			<div className='w-full flex justify-between container mx-auto gap-4 items-center'>
				<div className='flex justify-start gap-2 items-center'>
					<BlocksIcon />
					<h1 className='text-2xl font-bold'>Teams</h1>
					<Select
						items={teamSelectItems}
						value={params.teamId}
						onValueChange={(value) =>
							router({
								to: '/teams/$teamId',
								params: { teamId: value ?? '' },
							})
						}
					>
						<SelectTrigger className='w-xs'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{teamSelectItems.map((team) => (
								<SelectItem key={team.value} value={team.value}>
									{team.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='flex justify-end gap-2'>
					<Button className='justify-self-end'>
						<PlusIcon /> Add Team
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button variant='ghost'>
								<EllipsisVerticalIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className='w-fit'>
							<DropdownMenuItem>
								<Edit2Icon /> Edit Team Info
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => deleteMutation.mutate(params.teamId)}
								variant='destructive'
							>
								<TrashIcon /> Delete Team
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
