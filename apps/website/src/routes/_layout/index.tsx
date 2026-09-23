import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/')({
	component: Home,
});

// M3 replaces this with the site's `settings.home_content`, the active quick
// links, and the upcoming events from `settings.default_calendar`.
function Home() {
	return (
		<div className='mx-auto w-full max-w-4xl px-4 py-12'>
			<h1 className='font-bold text-3xl'>Morgan Wrestling</h1>
			<p className='mt-2 text-muted-foreground'>Coming soon...</p>
		</div>
	);
}
