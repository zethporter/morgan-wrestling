import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/_layout')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<span>layout</span>

			<main>
				<Outlet />
			</main>
		</div>
	);
}
