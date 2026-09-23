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
			<nav className='mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4'>
				<Link to='/' className='font-semibold text-lg'>
					{env.VITE_APP_TITLE}
				</Link>
				<ul className='flex flex-wrap items-center gap-x-4 gap-y-1'>
					{teams.map((team) => (
						<li key={team.id}>
							<Link
								to='/teams/$teamSlug'
								params={{ teamSlug: team.slug }}
								activeProps={{ className: 'font-medium text-foreground' }}
								className='text-muted-foreground text-sm transition-colors hover:text-foreground'
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
