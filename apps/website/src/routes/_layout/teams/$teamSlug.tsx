import { useSuspenseQuery } from '@tanstack/react-query';
import {
	createFileRoute,
	Link,
	notFound,
	Outlet,
} from '@tanstack/react-router';
import { QuickLinks } from '#/components/quick-links';
import {
	teamPageNavQueryOptions,
	teamQueryOptions,
	teamQuickLinksQueryOptions,
} from '#/lib/team-opts';

/**
 * The chrome every team page shares: the team's name, the nav over its
 * published pages, and its quick links. The admin edits the quick links next to
 * the team's home content, so they live here rather than in the site chrome —
 * the same placement the site-wide ones get on `/`.
 */
export const Route = createFileRoute('/_layout/teams/$teamSlug')({
	loader: async ({ context, params }) => {
		// All three go out together. An unknown slug wastes the two joins that
		// come back empty, which is cheaper than making every real team page pay
		// a serial round trip to find out the team exists first.
		const [team] = await Promise.all([
			context.queryClient.ensureQueryData(teamQueryOptions(params.teamSlug)),
			context.queryClient.ensureQueryData(
				teamPageNavQueryOptions(params.teamSlug),
			),
			context.queryClient.ensureQueryData(
				teamQuickLinksQueryOptions(params.teamSlug),
			),
		]);

		if (!team) throw notFound();
	},
	component: TeamLayout,
	notFoundComponent: () => (
		<div className='mx-auto w-full max-w-4xl px-4 py-12'>
			<h1 className='font-bold text-3xl'>Team not found</h1>
			<p className='mt-2 text-muted-foreground'>
				There is no team at this address. Pick one from the menu above.
			</p>
		</div>
	),
});

const NAV_LINK_CLASS =
	'text-muted-foreground text-sm transition-colors hover:text-foreground';

function TeamLayout() {
	const { teamSlug } = Route.useParams();
	const { data: team } = useSuspenseQuery(teamQueryOptions(teamSlug));
	const { data: pages } = useSuspenseQuery(teamPageNavQueryOptions(teamSlug));
	const { data: quickLinks } = useSuspenseQuery(
		teamQuickLinksQueryOptions(teamSlug),
	);

	// The loader has already 404'd an unknown slug; this is the narrowing.
	if (!team) return null;

	return (
		<div className='mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12'>
			<div className='flex flex-col gap-4'>
				<h1 className='font-bold text-3xl'>{team.name}</h1>
				{pages.length > 0 && (
					<nav aria-label={`${team.name} pages`}>
						<ul className='flex flex-wrap items-center gap-x-4 gap-y-1 border-border border-b pb-3'>
							<li>
								<Link
									to='/teams/$teamSlug'
									params={{ teamSlug }}
									activeOptions={{ exact: true }}
									activeProps={{ className: 'font-medium text-foreground' }}
									className={NAV_LINK_CLASS}
								>
									Home
								</Link>
							</li>
							{pages.map((page) => (
								<li key={page.id}>
									<Link
										to='/teams/$teamSlug/$pageSlug'
										params={{ teamSlug, pageSlug: page.slug }}
										activeProps={{ className: 'font-medium text-foreground' }}
										className={NAV_LINK_CLASS}
									>
										{page.title}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				)}
			</div>
			<Outlet />
			<QuickLinks links={quickLinks} />
		</div>
	);
}
