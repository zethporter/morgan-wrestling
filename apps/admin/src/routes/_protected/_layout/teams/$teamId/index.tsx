import {
	type RichTextValue,
	toRichTextValue,
} from '@morgan-wrestling/ui/components/text-editor/types';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ContentEditorForm } from '#/components/content-editor-form';
import { updateTeam } from '#/lib/team-fns';
import { teamQueryOptions } from '#/lib/teams-opts';

export const Route = createFileRoute('/_protected/_layout/teams/$teamId/')({
	component: RouteComponent,
});

function RouteComponent() {
	const { teamId } = Route.useParams();
	const { queryClient } = Route.useRouteContext();

	const { data } = useSuspenseQuery(teamQueryOptions(teamId));
	const team = data?.[0];

	const ut = useServerFn(updateTeam);
	const saveHomeContent = useMutation({
		mutationFn: async (value: RichTextValue) =>
			await ut({
				data: {
					id: teamId,
					values: {
						homeContent: value.html,
						homeContentMetadata: value.json,
					},
				},
			}),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Saving home content',
				id: 'save-home-content',
			}),
		onSuccess: () =>
			toast.update('save-home-content', {
				type: 'success',
				description: 'Home content saved',
			}),
		onError: (e) =>
			toast.update('save-home-content', {
				type: 'error',
				description: `Failed to save: ${e.message}`,
			}),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: ['team', teamId] }),
	});

	return (
		<ContentEditorForm
			key={teamId}
			title='Home'
			description={`The landing content for ${team?.name ?? 'this team'}.`}
			value={toRichTextValue(team?.homeContent, team?.homeContentMetadata)}
			onSave={(value) => saveHomeContent.mutate(value)}
		/>
	);
}
