import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SiteFooter } from '#/components/site-footer';
import { SiteHeader } from '#/components/site-header';

export const Route = createFileRoute('/_layout')({
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
