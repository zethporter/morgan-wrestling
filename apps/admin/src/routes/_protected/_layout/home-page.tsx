import {
	type RichTextValue,
	toRichTextValue,
} from '@morgan-wrestling/ui/components/text-editor/types';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { CalendarSelect } from '#/components/calendar-select';
import { ContentEditorForm } from '#/components/content-editor-form';
import {
	QuickLinksButton,
	QuickLinksDialog,
} from '#/components/quick-links-dialog';
import { calendarsQueryOptions } from '#/lib/calendar-opts';
import { SITE_SETTINGS_ID, updateSettings } from '#/lib/settings-fns';
import { settingsQueryOptions } from '#/lib/settings-opts';

export const Route = createFileRoute('/_protected/_layout/home-page')({
	component: RouteComponent,
});

function RouteComponent() {
	const { queryClient } = Route.useRouteContext();

	const { data } = useSuspenseQuery(settingsQueryOptions);
	const setting = data?.[0];

	const { data: calendars } = useSuspenseQuery(calendarsQueryOptions);

	const us = useServerFn(updateSettings);

	const [defaultCalendar, setDefaultCalendar] = useState<string | null>(
		setting?.defaultCalendar ?? null,
	);
	const [quickLinksOpen, setQuickLinksOpen] = useState(false);

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

	const saveDefaultCalendar = useMutation({
		mutationFn: async (defaultCalendar: string | null) =>
			await us({
				data: {
					values: { defaultCalendar },
				},
			}),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Saving default calendar',
				id: 'save-default-calendar',
			}),
		onSuccess: () =>
			toast.update('save-default-calendar', {
				type: 'success',
				description: 'Default calendar saved',
			}),
		onError: (e) =>
			toast.update('save-default-calendar', {
				type: 'error',
				description: `Failed to save: ${e.message}`,
			}),
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
	});

	return (
		<>
			<ContentEditorForm
				key={SITE_SETTINGS_ID}
				title='Home'
				description='The landing content for the site home page.'
				value={toRichTextValue(
					setting?.homeContent,
					setting?.homeContentMetadata,
				)}
				onSave={(value) => saveHomeContent.mutate(value)}
				actions={
					<>
						<CalendarSelect
							calendars={calendars ?? []}
							value={defaultCalendar}
							onValueChange={(value) => {
								setDefaultCalendar(value);
								saveDefaultCalendar.mutate(value);
							}}
							allowNone
						/>
						<QuickLinksButton onClick={() => setQuickLinksOpen(true)} />
					</>
				}
			/>
			<QuickLinksDialog
				open={quickLinksOpen}
				onOpenChange={setQuickLinksOpen}
				scope='site'
			/>
		</>
	);
}
