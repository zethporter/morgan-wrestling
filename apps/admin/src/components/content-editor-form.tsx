import type { RichTextValue } from '@morgan-wrestling/ui/components/text-editor/types';
import { Button } from '@morgan-wrestling/ui/components/ui/button';
import { useAppForm } from '@morgan-wrestling/ui/hooks/use-form';
import { SaveIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type ContentEditorFormProps = {
	title: string;
	description?: string;
	/** Seeds the editor on mount — give this component a `key` per record. */
	value: RichTextValue;
	onSave: (value: RichTextValue) => void;
	actions?: ReactNode;
};

/**
 * Full-height content editor: a heading row with the save action, and a rich
 * text field that takes whatever space is left.
 */
export const ContentEditorForm = ({
	title,
	description,
	value,
	onSave,
	actions,
}: ContentEditorFormProps) => {
	const form = useAppForm({
		defaultValues: { content: value },
		onSubmit: ({ value }) => onSave(value.content),
	});

	return (
		<form
			className='flex h-full min-h-0 w-full flex-col gap-4 p-5'
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className='flex shrink-0 items-start justify-between gap-4'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-xl font-semibold'>{title}</h2>
					{description && (
						<p className='text-sm text-muted-foreground'>{description}</p>
					)}
				</div>
				<div className='flex items-center gap-2'>
					{actions}
					<form.Subscribe
						selector={(formState) => [formState.canSubmit, formState.isDirty]}
					>
						{([canSubmit, isDirty]) => (
							<Button type='submit' disabled={!canSubmit || !isDirty}>
								<SaveIcon />
								Save
							</Button>
						)}
					</form.Subscribe>
				</div>
			</div>
			<form.AppField
				name='content'
				children={(field) => <field.FormRichText className='min-h-0 flex-1' />}
			/>
		</form>
	);
};
