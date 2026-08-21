import { createFileRoute, redirect } from '@tanstack/react-router';
import { checkPermission } from '#/lib/auth-fns';

export const Route = createFileRoute('/_protected/_layout/users')({
	beforeLoad: async () => {
		// `_protected` already established there is a session, so a failure here
		// is an authorization problem: bounce to the dashboard rather than log-in.
		const canManageUsers = await checkPermission({
			data: { user: ['list'] },
		});

		if (!canManageUsers) {
			throw redirect({ to: '/' });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_protected/_layout/users"!</div>;
}
