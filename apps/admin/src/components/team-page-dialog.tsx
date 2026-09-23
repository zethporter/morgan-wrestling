import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@morgan-wrestling/ui/components/ui/dialog';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useMemo, useRef } from 'react';
import { z } from 'zod';
import { insertTeamPage, updateTeamPage } from '#/lib/team-fns';
import { teamPagesQueryOptions } from '#/lib/teams-opts';

export type TeamPageFields = {
	id: number;
	title: string;
	sequenceNumber: number;
	active: boolean | null;
};

type TeamPageDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	teamId: string;
	/** Omit to create a new page, pass a page to edit its settings. */
	page?: TeamPageFields;
	onCreated?: (pageId: number) => void;
};

const CREATE_TOAST = 'team-page-create';
const UPDATE_TOAST = 'team-page-update';

// The order field rides through the form as a string (that's what an input
// gives us), so validate it as one and coerce on submit.
const teamPageValidator = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	sequenceNumber: z
		.string()
		.trim()
		.min(1, 'Order is required')
		.refine(
			(value) => Number.isInteger(Number(value)) && Number(value) >= 0,
			'Order must be a whole number',
		),
	active: z.boolean(),
});

export const TeamPageDialog = ({
	open,
	onOpenChange,
	teamId,
	page,
	onCreated,
}: TeamPageDialogProps) => {
	const queryClient = useQueryClient();
	const mode = page ? 'update' : 'create';

	const createPage = useServerFn(insertTeamPage);
	const savePage = useServerFn(updateTeamPage);

	const { data: pages } = useQuery(teamPagesQueryOptions(teamId));
	const nextSequenceNumber = useMemo(
		() =>
			(pages ?? []).reduce((max, p) => Math.max(max, p.sequenceNumber), 0) + 1,
		[pages],
	);

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['team-pages', teamId] });
		if (page) {
			void queryClient.invalidateQueries({
				queryKey: ['team-page', page.id, teamId],
			});
		}
	};

	const create = useMutation({
		mutationFn: async (values: {
			title: string;
			sequenceNumber: number;
			active: boolean;
		}) => await createPage({ data: { teamId, ...values } }),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Adding page',
				id: CREATE_TOAST,
			}),
		onSuccess: (result) => {
			toast.update(CREATE_TOAST, {
				type: 'success',
				description: 'Page added',
			});
			onOpenChange(false);
			const created = result?.[0];
			if (created) onCreated?.(created.id);
		},
		onError: (e) =>
			toast.update(CREATE_TOAST, {
				type: 'error',
				description: `Failed to add page: ${e.message}`,
			}),
		onSettled: invalidate,
	});

	const save = useMutation({
		mutationFn: async (values: {
			title: string;
			sequenceNumber: number;
			active: boolean;
		}) => await savePage({ data: { id: page?.id ?? -1, values } }),
		onMutate: () =>
			toast.add({
				type: 'loading',
				description: 'Saving page settings',
				id: UPDATE_TOAST,
			}),
		onSuccess: () => {
			toast.update(UPDATE_TOAST, {
				type: 'success',
				description: 'Page settings saved',
			});
			onOpenChange(false);
		},
		onError: (e) =>
			toast.update(UPDATE_TOAST, {
				type: 'error',
				description: `Failed to save: ${e.message}`,
			}),
		onSettled: invalidate,
	});

	const seed = useMemo(
		() => ({
			title: page?.title ?? '',
			sequenceNumber: String(page?.sequenceNumber ?? nextSequenceNumber),
			active: page ? (page.active ?? false) : true,
		}),
		[page, nextSequenceNumber],
	);

	const form = useAppForm({
		defaultValues: seed,
		onSubmit: ({ value }) => {
			const values = {
				title: value.title.trim(),
				sequenceNumber: Number(value.sequenceNumber),
				active: value.active,
			};
			if (mode === 'create') create.mutate(values);
			else save.mutate(values);
		},
		validators: {
			onSubmit: teamPageValidator,
		},
	});

	// The dialog stays mounted between uses, so re-seed the fields each time it
	// opens — otherwise it shows the page (or the next order) it was built with.
	const seedRef = useRef(seed);
	seedRef.current = seed;
	useEffect(() => {
		if (open) form.reset(seedRef.current);
	}, [open, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				render={
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					/>
				}
			>
				<DialogHeader>
					<DialogTitle className='text-lg'>
						{mode === 'create' ? 'Add Page' : 'Page Settings'}
					</DialogTitle>
					<DialogDescription>
						{mode === 'create'
							? 'Create a sub page for this team. You can add its content next.'
							: 'Rename this page, change where it sits in the menu, or hide it.'}
					</DialogDescription>
				</DialogHeader>
				<form.AppField
					name='title'
					children={(field) => <field.FormInput label='Title' />}
				/>
				<form.AppField
					name='sequenceNumber'
					children={(field) => (
						<field.FormInput
							label='Order'
							type='number'
							min={0}
							step={1}
							inputMode='numeric'
						/>
					)}
				/>
				<form.AppField
					name='active'
					children={(field) => <field.FormSwitch label='Active' />}
				/>
				<DialogFooter>
					<form.Subscribe
						selector={(formState) => [formState.canSubmit, formState.isDirty]}
					>
						{([canSubmit, isDirty]) => (
							<Button
								type='submit'
								size='default'
								disabled={!canSubmit || (mode === 'update' && !isDirty)}
							>
								{mode === 'create' ? 'Create' : 'Save'}
							</Button>
						)}
					</form.Subscribe>
					<Button
						type='button'
						variant='outline'
						size='default'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
