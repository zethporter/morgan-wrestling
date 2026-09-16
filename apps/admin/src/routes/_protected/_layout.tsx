import { SidebarProvider } from '@morgan-wrestling/ui/components/ui/sidebar';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AppSidebar } from '#/components/app-sidebar.tsx';

const sidebarStateAtom = atomWithStorage<boolean>(
	'mw-admin-sidebar',
	true,
	undefined,
	{ getOnInit: true },
);

export const Route = createFileRoute('/_protected/_layout')({
	component: RouteComponent,
});

function RouteComponent() {
	const [open, onOpenChange] = useAtom(sidebarStateAtom);
	return (
		<SidebarProvider open={open} onOpenChange={onOpenChange}>
			<AppSidebar />

			<main className='w-full h-screen overflow-hidden'>
				<Outlet />
			</main>
		</SidebarProvider>
	);
}
