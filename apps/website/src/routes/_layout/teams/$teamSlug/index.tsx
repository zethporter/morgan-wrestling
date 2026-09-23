import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { RichContent } from '#/components/rich-content';
import { teamQueryOptions } from '#/lib/team-opts';

/**
 * A team's home content. The heading, page nav and quick links are the parent
 * layout's; this route is only the authored HTML.
 */
export const Route = createFileRoute('/_layout/teams/$teamSlug/')({
	// A cache hit — the parent layout's loader has already fetched this. Kept so
	// the route names the data it renders.
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			teamQueryOptions(params.teamSlug),
		);
	},
	component: TeamHome,
});

// M5 adds the upcoming-events list, from `teams.default_calendar_id`.
function TeamHome() {
	const { teamSlug } = Route.useParams();
	const { data: team } = useSuspenseQuery(teamQueryOptions(teamSlug));

	// The layout's loader 404s an unknown slug, so this is the narrowing.
	if (!team) return null;

	if (!team.homeContent) {
		return (
			<p className='text-muted-foreground'>
				There is nothing on this page yet.
			</p>
		);
	}

	return <RichContent html={team.homeContent} />;
}
