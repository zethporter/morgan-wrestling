import {
	Tabs,
	TabsList,
	TabsTrigger,
} from '@morgan-wrestling/ui/components/ui/tabs';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useLocation } from '@tanstack/react-router';
import { env } from '#/env';
import { CALENDAR_PATH, teamPath } from '#/lib/paths';
import { teamNavQueryOptions } from '#/lib/team-opts';

/**
 * The nav is the team list, which is why `/teams` has no index page — a
 * visitor who lands there is sent home to pick one from here.
 *
 * The data comes from `_layout`'s loader, so this resolves during SSR and the
 * nav is in the first response rather than appearing after hydration.
 */
export const SiteHeader = () => {
	const { data: teams } = useSuspenseQuery(teamNavQueryOptions);
	const { pathname } = useLocation();

	// Same shadcn `Tabs`, same reasoning as the team page sub-nav (see
	// `$teamSlug.tsx`): each trigger's `render` is a real `Link` so this keeps
	// navigating and working with JavaScript off, and `value` is derived from
	// the current pathname rather than `Tabs`' own click-tracking so the
	// active tab is correct on the first server-rendered paint. `undefined`
	// when the current page is neither the calendar nor a team page — no tab
	// then, matching the old `activeProps` behaviour.
	const isCalendar =
		pathname === CALENDAR_PATH || pathname.startsWith(`${CALENDAR_PATH}/`);
	const activeValue = isCalendar
		? 'calendar'
		: teams.find(
				(team) =>
					pathname === teamPath(team.slug) ||
					pathname.startsWith(`${teamPath(team.slug)}/`),
			)?.slug;

	return (
		<header className='border-border border-b'>
			{/* `max-w-6xl`, not `max-w-4xl`: the calendar pages are `PageContainer
			    width='wide'` and the nav has to line up with the widest page, not
			    the narrowest — see `RESPONSIVE.md` §3.1. */}
			<nav className='mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-x-6 sm:gap-y-2 sm:px-6 lg:px-8'>
				<Link to='/' className='font-semibold text-lg'>
					{env.VITE_APP_TITLE}
				</Link>
				<Tabs value={activeValue}>
					<TabsList
						variant='default'
						aria-label='Site'
						className='bg-transparent -mx-4 h-auto w-full snap-x flex-nowrap justify-start overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-fit sm:overflow-visible sm:px-0'
					>
						<TabsTrigger
							value='calendar'
							className='snap-start coarse:py-2.5 data-active:shadow-xl data-active:border-primary'
							render={<Link to='/calendar' />}
						>
							Calendar
						</TabsTrigger>
						{teams.map((team) => (
							<TabsTrigger
								key={team.id}
								value={team.slug}
								className='snap-start coarse:py-2.5 data-active:shadow-xl data-active:border-primary'
								render={
									<Link
										to='/teams/$teamSlug'
										params={{ teamSlug: team.slug }}
									/>
								}
							>
								{team.name}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</nav>
		</header>
	);
};
