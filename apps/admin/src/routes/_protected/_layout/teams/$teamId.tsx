import { Button } from '@morgan-wrestling/ui/components/ui/button.js';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@morgan-wrestling/ui/components/ui/dropdown-menu';
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@morgan-wrestling/ui/components/ui/empty';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@morgan-wrestling/ui/components/ui/select.js';
import {
	SidebarInset,
	SidebarProvider,
} from '@morgan-wrestling/ui/components/ui/sidebar';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import {
	BlocksIcon,
	Edit2Icon,
	EllipsisVerticalIcon,
	TrashIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { NewTeamDialog } from '#/components/new-team';
import { TeamSidebar } from '#/components/team-sidebar';
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

	const hasTeam = params.teamId !== NO_TEAMS;

	return (
		<div className='p-5 flex flex-col w-full h-full min-h-0 gap-5'>
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
					<NewTeamDialog />
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
			{hasTeam ? (
				<SidebarProvider
					nested
					className='container mx-auto flex-1 overflow-hidden rounded-xl border bg-background'
					width='14rem'
				>
					<TeamSidebar teamId={params.teamId} pages={pages ?? []} />
					<SidebarInset>
						<Outlet />
					</SidebarInset>
				</SidebarProvider>
			) : (
				<Empty className='container mx-auto flex-1 rounded-xl border'>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<BlocksIcon />
						</EmptyMedia>
						<EmptyTitle>No teams yet</EmptyTitle>
						<EmptyDescription>
							Create a team to start adding pages and content.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</div>
	);
}
