import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { RichContent } from '#/components/rich-content';
import { teamPageQueryOptions } from '#/lib/team-opts';

/**
 * One of a team's sub-pages, addressed by a slug derived from its title —
 * `team_pages` has no slug column, so `getTeamPage` matches on the normalized
 * title (§6 of the README, option B).
 *
 * An unknown title and an unpublished one are the same 404: `active` is
 * fail-closed, so a page nobody has published does not exist as far as this
 * route is concerned.
 */
export const Route = createFileRoute('/_layout/teams/$teamSlug/$pageSlug')({
	loader: async ({ context, params }) => {
		const page = await context.queryClient.ensureQueryData(
			teamPageQueryOptions(params.teamSlug, params.pageSlug),
		);

		if (!page) throw notFound();
	},
	component: TeamPage,
	// Handled here rather than bubbling to the team layout, so a bad page slug
	// still shows the team's heading and nav to recover from.
	notFoundComponent: () => (
		<div>
			<h2 className='font-semibold text-2xl'>Page not found</h2>
			<p className='mt-2 text-muted-foreground'>
				This team has no published page at this address.
			</p>
		</div>
	),
});

function TeamPage() {
	const { teamSlug, pageSlug } = Route.useParams();
	const { data: page } = useSuspenseQuery(
		teamPageQueryOptions(teamSlug, pageSlug),
	);

	// The loader has already 404'd a missing page; this is the narrowing.
	if (!page) return null;

	return (
		<div className='flex flex-col gap-4'>
			<h2 className='font-semibold text-2xl'>{page.title}</h2>
			{page.content ? (
				<RichContent html={page.content} />
			) : (
				<p className='text-muted-foreground'>
					There is nothing on this page yet.
				</p>
			)}
		</div>
	);
}
