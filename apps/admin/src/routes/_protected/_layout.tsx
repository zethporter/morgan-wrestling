import { SidebarProvider } from '@morgan-wrestling/ui/components/ui/sidebar';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AppSidebar } from '#/components/app-sidebar.tsx';

export const Route = createFileRoute('/_protected/_layout')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar />

			<main className='w-full h-screen overflow-hidden'>
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
