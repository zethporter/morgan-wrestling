import { Badge } from '@morgan-wrestling/ui/components/ui/badge';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@morgan-wrestling/ui/components/ui/table';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { checkPermission, removeAdminRole, setAdminRole } from '#/lib/auth-fns';
import { userPageQueryOptions } from '#/lib/auth-opts';

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
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(userPageQueryOptions);
	},
	component: RouteComponent,
});

const RolesBadges = ({ roles }: { roles: string }) => {
	const rolesArray = roles.split(',');
	return (
		<div>
			{rolesArray.map((role) => (
				<Badge variant='secondary' key={role}>
					{role}
				</Badge>
			))}
		</div>
	);
};

function RouteComponent() {
	const { queryClient } = Route.useRouteContext();
	const { data } = useSuspenseQuery(userPageQueryOptions);
	const setAdmin = useServerFn(setAdminRole);
	const revokeAdmin = useServerFn(removeAdminRole);

	const toggleAdmin = async (userId: string, isAdmin: boolean) => {
		const loadingDesc = isAdmin
			? 'Granting admin status...'
			: 'Revoking admin status...';
		const successDesc = isAdmin
			? 'Admin status granted'
			: 'Admin status revoked';
		const failedDesc = isAdmin
			? 'Failed to grant admin status'
			: 'Failed to revoke admin status';
		const toastId = toast.add({
			type: 'loading',
			description: loadingDesc,
			id: userId,
		});
		try {
			if (isAdmin) {
				await setAdmin({ data: { id: userId } });
			} else {
				await revokeAdmin({ data: { id: userId } });
			}
			toast.add({
				type: 'success',
				description: successDesc,
				id: toastId,
			});
		} catch (error) {
			console.error(error);
			toast.add({
				type: 'error',
				title: failedDesc,
				description: error instanceof Error ? error.message : String(error),
				id: toastId,
			});
		} finally {
			queryClient.invalidateQueries({ queryKey: ['users-page'] });
		}
	};

	return (
		<div className='p-4'>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Roles</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.users.map((user) => {
						const isAdmin =
							typeof user.role === 'string' && user.role.includes('admin');
						return (
							<TableRow key={user.id}>
								<TableCell>{user.name}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<RolesBadges roles={user.role ?? ''} />
								</TableCell>
								<TableCell>
									<Button
										variant={isAdmin ? 'destructive' : 'default'}
										onClick={() => toggleAdmin(user.id, isAdmin)}
										size='xs'
									>
										{isAdmin ? 'Remove Admin' : 'Make Admin'}
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
