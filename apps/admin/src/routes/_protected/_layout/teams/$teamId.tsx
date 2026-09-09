import { createFileRoute } from '@tanstack/react-router';
import {
	LAST_TEAM_KEY,
	NO_TEAMS,
	teamPagesQueryOptions,
	teamQueryOptions,
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

	return (
		<div>
			<pre>{JSON.stringify(params, null, 2)}</pre>
		</div>
	);
}
