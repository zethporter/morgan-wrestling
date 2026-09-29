import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { env } from '#/env';
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

	return (
		<header className='border-border border-b'>
			{/* `max-w-6xl`, not `max-w-4xl`: the calendar pages are `PageContainer
			    width='wide'` and the nav has to line up with the widest page, not
			    the narrowest — see `RESPONSIVE.md` §3.1. */}
			<nav className='mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-x-6 sm:gap-y-2 sm:px-6 lg:px-8'>
				<Link to='/' className='font-semibold text-lg'>
					{env.VITE_APP_TITLE}
				</Link>
				{/* Below `sm` this scrolls horizontally instead of wrapping, so the
				    header never grows past two rows no matter how many teams there
				    are — see `RESPONSIVE.md` §5. */}
				<ul className='-mx-4 flex flex-nowrap items-center gap-x-4 overflow-x-auto px-4 [scrollbar-width:none] snap-x sm:mx-0 sm:flex-wrap sm:gap-y-1 sm:overflow-visible sm:px-0'>
					<li className='snap-start'>
						<Link
							to='/calendar'
							activeProps={{ className: 'font-medium text-foreground' }}
							className='block whitespace-nowrap py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground coarse:py-2.5'
						>
							Calendar
						</Link>
					</li>
					{teams.map((team) => (
						<li key={team.id} className='snap-start'>
							<Link
								to='/teams/$teamSlug'
								params={{ teamSlug: team.slug }}
								activeProps={{ className: 'font-medium text-foreground' }}
								className='block whitespace-nowrap py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground coarse:py-2.5'
							>
								{team.name}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</header>
	);
};
