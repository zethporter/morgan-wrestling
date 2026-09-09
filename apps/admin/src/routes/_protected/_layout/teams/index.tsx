import { createFileRoute, redirect } from '@tanstack/react-router';
import { LAST_TEAM_KEY, NO_TEAMS, teamsQueryOptions } from '#/lib/teams-opts';

export const Route = createFileRoute('/_protected/_layout/teams/')({
	loader: async ({ context }) => {
		const teams = (await context.queryClient.query(teamsQueryOptions)) ?? [];

		const storage = typeof window !== 'undefined' ? localStorage : null;
		const lastId = storage?.getItem(LAST_TEAM_KEY);
		const match = teams.find((t) => t.id === lastId);
		const target = match ?? teams[0];

		throw redirect({
			to: '/teams/$teamId',
			params: { teamId: target ? target.id : NO_TEAMS },
		});
	},
});
