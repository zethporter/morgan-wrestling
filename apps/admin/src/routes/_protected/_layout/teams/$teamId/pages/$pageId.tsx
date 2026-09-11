import {
	type RichTextValue,
	toRichTextValue,
} from '@morgan-wrestling/ui/components/text-editor/types';
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@morgan-wrestling/ui/components/ui/empty';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { FileQuestionIcon } from 'lucide-react';
import { ContentEditorForm } from '#/components/content-editor-form';
import { updateTeamPage } from '#/lib/team-fns';
import { teamPageQueryOptions } from '#/lib/teams-opts';

export const Route = createFileRoute(
	'/_protected/_layout/teams/$teamId/pages/$pageId',
)({
	component: RouteComponent,
	loader: async ({ context, params }) => {
		await context.queryClient.query(
			teamPageQueryOptions(Number(params.pageId), params.teamId),
		);
	},
});

function RouteComponent() {
	const { teamId, pageId: rawPageId } = Route.useParams();
	const { queryClient } = Route.useRouteContext();
	const pageId = Number(rawPageId);

	const { data } = useSuspenseQuery(teamPageQueryOptions(pageId, teamId));
	const page = data?.[0];

	const utp = useServerFn(updateTeamPage);
	const savePageContent = useMutation({
		mutationFn: async (value: RichTextValue) =>
			await utp({
				data: {
					id: pageId,
					values: {
						content: value.html,
						contentMetadata: value.json,
					},
				},
			}),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Saving page content',
				id: 'save-page-content',
			}),
		onSuccess: () =>
			toast.update('save-page-content', {
				type: 'success',
				description: 'Page content saved',
			}),
		onError: (e) =>
			toast.update('save-page-content', {
				type: 'error',
				description: `Failed to save: ${e.message}`,
			}),
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ['team-page', pageId, teamId],
			});
			queryClient.invalidateQueries({ queryKey: ['team-pages', teamId] });
		},
	});

	if (!page) {
		return (
			<Empty className='h-full'>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<FileQuestionIcon />
					</EmptyMedia>
					<EmptyTitle>Page not found</EmptyTitle>
					<EmptyDescription>
						This page no longer belongs to this team.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ContentEditorForm
			key={page.id}
			title={page.title}
			value={toRichTextValue(page.content, page.contentMetadata)}
			onSave={(value) => savePageContent.mutate(value)}
		/>
	);
}
