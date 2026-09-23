import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SiteFooter } from '#/components/site-footer';
import { SiteHeader } from '#/components/site-header';
import { teamNavQueryOptions } from '#/lib/team-opts';

export const Route = createFileRoute('/_layout')({
	// The header nav is on every page, so the team list is loaded here once
	// rather than per route.
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(teamNavQueryOptions);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className='flex min-h-screen flex-col'>
			<SiteHeader />
			<main className='flex-1'>
				<Outlet />
			</main>
			<SiteFooter />
		</div>
	);
}
