import {
	Tabs,
	TabsList,
	TabsTrigger,
} from '@morgan-wrestling/ui/components/ui/tabs';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
	createFileRoute,
	Link,
	notFound,
	Outlet,
	useLocation,
} from '@tanstack/react-router';
import { PageContainer, PageTitle } from '#/components/page-container';
import { QuickLinks } from '#/components/quick-links';
import { toDescription } from '#/lib/excerpt';
import { teamPagePath } from '#/lib/paths';
import { seo } from '#/lib/seo';
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

		return { name: team.name, description: toDescription(team.homeContent) };
	},
	/**
	 * Title and description for the whole team subtree, so `/teams/$teamSlug/`
	 * below needs nothing but a canonical. No `path` here: this route has
	 * children, and `links` are concatenated rather than deduped, so a canonical
	 * at this level would follow every sub-page around (see `seo.ts`).
	 */
	head: ({ loaderData }) =>
		seo({
			title: loaderData?.name,
			description: loaderData?.description || undefined,
		}),
	component: TeamLayout,
	notFoundComponent: () => (
		<PageContainer className='gap-0'>
			<PageTitle>Team not found</PageTitle>
			<p className='mt-2 text-muted-foreground'>
				There is no team at this address. Pick one from the menu above.
			</p>
		</PageContainer>
	),
});

function TeamLayout() {
	const { teamSlug } = Route.useParams();
	const { data: team } = useSuspenseQuery(teamQueryOptions(teamSlug));
	const { data: pages } = useSuspenseQuery(teamPageNavQueryOptions(teamSlug));
	const { data: quickLinks } = useSuspenseQuery(
		teamQuickLinksQueryOptions(teamSlug),
	);
	const { pathname } = useLocation();

	// The loader has already 404'd an unknown slug; this is the narrowing.
	if (!team) return null;

	// `Tabs`/`TabsTrigger` are the same shadcn `Tabs` used everywhere else,
	// with each trigger's `render` swapped for a real `Link` — these have to
	// navigate to a distinct page, not switch a same-page panel, and the site
	// works with JavaScript off. `value` is driven from the current pathname
	// rather than left to `Tabs`' own click-tracking, so the active tab (and
	// its `aria-selected`) is correct on the very first server-rendered paint.
	const activeValue =
		pages.find((page) => pathname === teamPagePath(teamSlug, page.slug))
			?.slug ?? 'home';

	return (
		<PageContainer>
			<div className='flex flex-col gap-4'>
				<PageTitle>{team.name}</PageTitle>
				{pages.length > 0 && (
					<Tabs value={activeValue}>
						<TabsList
							variant='default'
							aria-label={`${team.name} pages`}
							className='bg-transparent -mx-4 h-auto w-full snap-x flex-nowrap justify-start overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-fit sm:overflow-visible sm:px-0'
						>
							<TabsTrigger
								value='home'
								className='snap-start coarse:py-2.5 data-active:shadow-xl data-active:border-primary'
								render={<Link to='/teams/$teamSlug' params={{ teamSlug }} />}
							>
								Home
							</TabsTrigger>
							{pages.map((page) => (
								<TabsTrigger
									key={page.id}
									value={page.slug}
									className='snap-start coarse:py-2.5 data-active:shadow-xl data-active:border-primary'
									render={
										<Link
											to='/teams/$teamSlug/$pageSlug'
											params={{ teamSlug, pageSlug: page.slug }}
										/>
									}
								>
									{page.title}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				)}
			</div>
			<Outlet />
			<QuickLinks links={quickLinks} />
		</PageContainer>
	);
}
