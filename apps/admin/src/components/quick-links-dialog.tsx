import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@morgan-wrestling/ui/components/ui/dialog';
import { ScrollArea } from '@morgan-wrestling/ui/components/ui/scroll-area';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { LinkIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import {
	quickLinksQueryOptions,
	teamQuickLinksQueryOptions,
} from '#/lib/quick-links-opts';
import {
	deleteQuickLink,
	deleteTeamQuickLink,
	insertQuickLink,
	insertTeamQuickLink,
	updateQuickLink,
	updateTeamQuickLink,
} from '#/lib/team-fns';

type QuickLink = {
	id: number;
	title: string;
	url: string;
	active: boolean;
};

type QuickLinkValues = {
	title: string;
	url: string;
	active: boolean;
};

const quickLinkValidator = z.object({
	title: z.string().min(1, 'Title is required'),
	url: z.string().min(1, 'URL is required'),
	active: z.boolean(),
});

type QuickLinksDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	scope: 'site' | 'team';
	teamId?: string;
};

const ADD_TOAST = 'quick-link-add';
const UPDATE_TOAST = 'quick-link-update';
const DELETE_TOAST = 'quick-link-delete';

export const QuickLinksButton = ({ onClick }: { onClick?: () => void }) => (
	<Button variant='ghost' className='justify-start' onClick={onClick}>
		<LinkIcon />
		Edit Quick Links
	</Button>
);

export const QuickLinksDialog = ({
	open,
	onOpenChange,
	scope,
	teamId,
}: QuickLinksDialogProps) => {
	const queryClient = useQueryClient();

	const insertQuickLinkFn = useServerFn(insertQuickLink);
	const insertTeamQuickLinkFn = useServerFn(insertTeamQuickLink);
	const updateLink = useServerFn(
		scope === 'team' ? updateTeamQuickLink : updateQuickLink,
	);
	const deleteLink = useServerFn(
		scope === 'team' ? deleteTeamQuickLink : deleteQuickLink,
	);

	const queryOptions =
		scope === 'team'
			? teamQuickLinksQueryOptions(teamId ?? '')
			: quickLinksQueryOptions;
	const { data } = useSuspenseQuery(queryOptions);
	const links = (data ?? []) as QuickLink[];

	const [adding, setAdding] = useState(false);

	const invalidate = () => {
		void queryClient.invalidateQueries({
			queryKey:
				scope === 'team' ? ['team-quick-links', teamId] : ['quick-links'],
		});
	};

	const createLink = useMutation({
		mutationFn: async (values: QuickLinkValues) => {
			if (scope === 'team') {
				return await insertTeamQuickLinkFn({
					data: { teamId: teamId ?? '', ...values },
				});
			}
			return await insertQuickLinkFn({ data: values });
		},
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Adding quick link',
				id: ADD_TOAST,
			}),
		onSuccess: () => {
			toast.update(ADD_TOAST, {
				type: 'success',
				description: 'Quick link added',
			});
			setAdding(false);
		},
		onError: (e) =>
			toast.update(ADD_TOAST, {
				type: 'error',
				description: `Failed to add: ${e.message}`,
			}),
		onSettled: invalidate,
	});

	const saveLink = useMutation({
		mutationFn: async ({
			id,
			values,
		}: {
			id: number;
			values: QuickLinkValues;
		}) => await updateLink({ data: { id, values } }),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Saving quick link',
				id: UPDATE_TOAST,
			}),
		onSuccess: () =>
			toast.update(UPDATE_TOAST, {
				type: 'success',
				description: 'Quick link saved',
			}),
		onError: (e) =>
			toast.update(UPDATE_TOAST, {
				type: 'error',
				description: `Failed to save: ${e.message}`,
			}),
		onSettled: invalidate,
	});

	const removeLink = useMutation({
		mutationFn: async (id: number) => await deleteLink({ data: { id } }),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Deleting quick link',
				id: DELETE_TOAST,
			}),
		onSuccess: () =>
			toast.update(DELETE_TOAST, {
				type: 'success',
				description: 'Quick link deleted',
			}),
		onError: (e) =>
			toast.update(DELETE_TOAST, {
				type: 'error',
				description: `Failed to delete: ${e.message}`,
			}),
		onSettled: invalidate,
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle className='text-lg'>Edit Quick Links</DialogTitle>
				</DialogHeader>
				<ScrollArea className='max-h-[55vh]'>
					<div className='flex flex-col gap-3 pr-3'>
						{links.length === 0 && !adding && (
							<p className='text-muted-foreground text-sm'>
								No quick links yet.
							</p>
						)}
						{links.map((link) => (
							<QuickLinkRow
								key={link.id}
								link={link}
								mode='update'
								onSave={(values) => saveLink.mutate({ id: link.id, values })}
								onDelete={() => removeLink.mutate(link.id)}
							/>
						))}
						{adding && (
							<QuickLinkRow
								link={{ id: -1, title: '', url: '', active: true }}
								mode='create'
								onSave={(values) => createLink.mutate(values)}
								onCancel={() => setAdding(false)}
							/>
						)}
					</div>
				</ScrollArea>
				<DialogFooter>
					{!adding && (
						<Button
							variant='outline'
							type='button'
							onClick={() => setAdding(true)}
						>
							<PlusIcon />
							Add Link
						</Button>
					)}
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

const QuickLinkRow = ({
	link,
	mode,
	onSave,
	onDelete,
	onCancel,
}: {
	link: QuickLink;
	mode: 'update' | 'create';
	onSave: (values: QuickLinkValues) => void;
	onDelete?: () => void;
	onCancel?: () => void;
}) => {
	const form = useAppForm({
		defaultValues: {
			title: mode === 'create' ? '' : link.title,
			url: mode === 'create' ? '' : link.url,
			active: mode === 'create' ? true : link.active,
		},
		onSubmit: ({ value }) => onSave(value),
		validators: {
			onSubmit: quickLinkValidator,
		},
	});

	return (
		<form
			className='flex flex-col gap-2 rounded-lg border p-3'
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.AppField
				name='title'
				children={(field) => <field.FormInput label='Title' />}
			/>
			<form.AppField
				name='url'
				children={(field) => <field.FormInput label='URL' />}
			/>
			<div className='flex items-center justify-between gap-2'>
				<form.AppField
					name='active'
					children={(field) => <field.FormSwitch label='Active' />}
				/>
				<div className='flex items-center gap-2'>
					<form.Subscribe
						selector={(formState) => [formState.canSubmit, formState.isDirty]}
					>
						{([canSubmit, isDirty]) => (
							<Button
								type='submit'
								size='sm'
								disabled={!canSubmit || (mode === 'update' && !isDirty)}
							>
								Save
							</Button>
						)}
					</form.Subscribe>
					{mode === 'update' ? (
						<Button
							type='button'
							variant='ghost'
							size='icon-sm'
							onClick={onDelete}
							aria-label='Delete quick link'
						>
							<TrashIcon />
						</Button>
					) : (
						<Button type='button' variant='ghost' size='sm' onClick={onCancel}>
							Cancel
						</Button>
					)}
				</div>
			</div>
		</form>
	);
};
