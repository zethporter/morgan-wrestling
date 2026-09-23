import { Link } from '@tanstack/react-router';
import { env } from '#/env';

// M3 loads the team list here so the nav is driven by the database rather than
// being empty.
export const SiteHeader = () => {
	return (
		<header className='border-border border-b'>
			<nav className='mx-auto flex w-full max-w-4xl items-center gap-6 px-4 py-4'>
				<Link to='/' className='font-semibold text-lg'>
					{env.VITE_APP_TITLE}
				</Link>
			</nav>
		</header>
	);
};
