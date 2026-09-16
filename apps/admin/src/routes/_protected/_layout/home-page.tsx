import {
	type RichTextValue,
	toRichTextValue,
} from '@morgan-wrestling/ui/components/text-editor/types';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ContentEditorForm } from '#/components/content-editor-form';
import { SITE_SETTINGS_ID, updateSettings } from '#/lib/settings-fns';
import { settingsQueryOptions } from '#/lib/settings-opts';

export const Route = createFileRoute('/_protected/_layout/home-page')({
	component: RouteComponent,
});

function RouteComponent() {
	const { queryClient } = Route.useRouteContext();

	const { data } = useSuspenseQuery(settingsQueryOptions);
	const setting = data?.[0];

	const us = useServerFn(updateSettings);
	const saveHomeContent = useMutation({
		mutationFn: async (value: RichTextValue) =>
			await us({
				data: {
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
				id: 'save-site-home-content',
			}),
		onSuccess: () =>
			toast.update('save-site-home-content', {
				type: 'success',
				description: 'Home content saved',
			}),
		onError: (e) =>
			toast.update('save-site-home-content', {
				type: 'error',
				description: `Failed to save: ${e.message}`,
			}),
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
	});

	return (
		<ContentEditorForm
			key={SITE_SETTINGS_ID}
			title='Home'
			description='The landing content for the site home page.'
			value={toRichTextValue(
				setting?.homeContent,
				setting?.homeContentMetadata,
			)}
			onSave={(value) => saveHomeContent.mutate(value)}
		/>
	);
}
