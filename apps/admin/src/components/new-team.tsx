import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@morgan-wrestling/ui/components/ui/dialog';
import { toast } from '@morgan-wrestling/ui/components/ui/toast';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@morgan-wrestling/ui/components/ui/tooltip';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Grid2X2PlusIcon } from 'lucide-react';
import { createTeam, createTeamSchema } from '#/lib/team-fns';

export const NewTeamDialog = () => {
	const queryClient = useQueryClient();
	const insertTeamFn = useServerFn(createTeam);

	const form = useAppForm({
		defaultValues: {
			name: '',
		},
		onSubmit: async ({ value }) => {
			await toast.promise(insertTeamFn({ data: value }), {
				loading: `Creating team ${value.name}`,
				success: (res) => {
					queryClient.invalidateQueries({ queryKey: ['teams'] });
					return res;
				},
				error: (err) => (err instanceof Error ? err.message : String(err)),
			});
		},
		validators: {
			onSubmit: createTeamSchema,
		},
	});

	return (
		<Dialog>
			<Tooltip>
				<TooltipTrigger render={<DialogTrigger render={<Button />} />}>
					<Grid2X2PlusIcon />
					New Team
				</TooltipTrigger>
				<TooltipContent>Add new Team</TooltipContent>
			</Tooltip>
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
					<DialogTitle className='text-lg'>Add New Team</DialogTitle>
				</DialogHeader>
				<form.AppField
					name='name'
					children={(field) => <field.FormInput label='Team Name' />}
				/>
				<DialogFooter>
					<form.Subscribe selector={(formState) => [formState.canSubmit]}>
						{([canSubmit]) => (
							<DialogClose
								render={
									<Button type='submit' size='default' disabled={!canSubmit}>
										Create
									</Button>
								}
							/>
						)}
					</form.Subscribe>
					<DialogClose
						onClick={() => form.reset()}
						render={
							<Button variant='outline' size='default'>
								Cancel
							</Button>
						}
					/>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
