import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { EventList } from '#/components/event-list';
import { RichContent } from '#/components/rich-content';
import { upcomingEventsQueryOptions } from '#/lib/calendar-opts';
import { teamPath } from '#/lib/paths';
import { seo } from '#/lib/seo';
import { teamQueryOptions } from '#/lib/team-opts';

/**
 * A team's home content, plus what is next on its calendar. The heading, page
 * nav and quick links are the parent layout's.
 */
export const Route = createFileRoute('/_layout/teams/$teamSlug/')({
	loader: async ({ context, params }) => {
		await Promise.all([
			// A cache hit — the parent layout's loader has already fetched this.
			// Kept so the route names the data it renders.
			context.queryClient.ensureQueryData(teamQueryOptions(params.teamSlug)),
			context.queryClient.ensureQueryData(
				upcomingEventsQueryOptions({
					scope: 'team',
					teamSlug: params.teamSlug,
				}),
			),
		]);
	},
	// Only the canonical: the team layout above already set the title and the
	// description, and this route has nothing to add to either.
	head: ({ params }) => seo({ path: teamPath(params.teamSlug) }),
	component: TeamHome,
});

function TeamHome() {
	const { teamSlug } = Route.useParams();
	const { data: team } = useSuspenseQuery(teamQueryOptions(teamSlug));
	const { data: upcoming } = useSuspenseQuery(
		upcomingEventsQueryOptions({ scope: 'team', teamSlug }),
	);

	// The layout's loader 404s an unknown slug, so this is the narrowing.
	if (!team) return null;

	return (
		<div className='flex flex-col gap-8'>
			{team.homeContent ? (
				<RichContent html={team.homeContent} />
			) : (
				<p className='text-muted-foreground'>
					There is nothing on this page yet.
				</p>
			)}
			{/* Both teams have a null `default_calendar_id` today, so this is
			    hidden until someone wires one up in the admin. */}
			{upcoming.length > 0 && (
				<div>
					<EventList events={upcoming} title={`${team.name} schedule`} />
					{team.defaultCalendarId && (
						<Link
							to='/calendar/$calendarId'
							params={{ calendarId: team.defaultCalendarId }}
							className='mt-3 inline-block text-muted-foreground text-sm hover:text-foreground'
						>
							See the full calendar
						</Link>
					)}
				</div>
			)}
		</div>
	);
}
