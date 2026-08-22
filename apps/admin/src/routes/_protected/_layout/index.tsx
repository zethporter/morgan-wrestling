import Tiptap from '@morgan-wrestling/ui/components/text-editor';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
} from '@morgan-wrestling/ui/components/ui/card';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import {
	mergeForm,
	useForm,
	useSelector,
	useTransform,
} from '@tanstack/react-form-start';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { getSessionInfo, giveSelfAdmin } from '#/lib/auth-fns';
// import { newTeamFormOps } from "#/form-options/teams";
// import { getFormDataFromServer } from "#/lib/team-fns";
//
export const userSessionQueryOptions = queryOptions({
	queryKey: ['user-session'],
	queryFn: async () => {
		return await getSessionInfo();
	},
});

export const Route = createFileRoute('/_protected/_layout/')({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(userSessionQueryOptions);
	},
	component: Home,
});

function Home() {
	const { queryClient } = Route.useRouteContext();
	const { data } = useSuspenseQuery(userSessionQueryOptions);

	const setAdmin = async () => {
		if (!data?.user.id) {
			toast.add({
				type: 'error',
				description: 'No user ID found',
			});
			return;
		}
		const toastId = toast.add({
			type: 'loading',
			description: 'Granting admin status...',
		});
		try {
			await giveSelfAdmin({ data: { id: data.user.id } });
			toast.add({
				type: 'success',
				description: 'Admin status granted',
				id: toastId,
			});
		} catch (error) {
			console.error(error);
			toast.add({
				type: 'error',
				title: 'Failed to grant admin status',
				description: error instanceof Error ? error.message : String(error),
				id: toastId,
			});
		} finally {
			queryClient.invalidateQueries({ queryKey: ['user-session'] });
		}
	};

	return (
		<div className='p-4 overflow-auto'>
			<Button onClick={setAdmin}>Set Admin</Button>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	);
}
