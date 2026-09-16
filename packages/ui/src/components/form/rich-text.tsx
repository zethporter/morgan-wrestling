import { useFieldContext } from '@morgan-wrestling/ui/hooks/use-form';
import { cn } from '@morgan-wrestling/ui/lib/utils';
import { lazy, Suspense } from 'react';
import { EMPTY_RICH_TEXT, type RichTextValue } from '../text-editor/types';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Skeleton } from '../ui/skeleton';

// Tiptap is heavy and this field is registered on every form, so the editor
// only loads for the forms that actually render one.
const TextEditor = lazy(() => import('../text-editor'));

type FormRichTextProps = {
	className?: string;
	editorClassName?: string;
	toolbarClassName?: string;
	contentClassName?: string;
	label?: string;
	disabled?: boolean;
	showPreview?: boolean;
};

/**
 * A rich text field. Its value is a `RichTextValue`, so one field carries both
 * the rendered HTML and the ProseMirror doc — map them onto your `content` /
 * `contentMetadata` columns on submit.
 *
 * The editor seeds itself from the field value on mount only; give the form a
 * `key` when you swap to a different record.
 */
export const FormRichText = ({
	className,
	editorClassName,
	toolbarClassName,
	contentClassName,
	label,
	disabled,
	showPreview,
}: FormRichTextProps) => {
	const field = useFieldContext<RichTextValue>();
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	const labelId = `${field.name}-label`;

	return (
		<Field
			className={cn('min-h-0', className)}
			data-invalid={isInvalid}
			data-disabled={disabled}
		>
			<FieldLabel id={labelId} className={cn(!label && 'sr-only')}>
				{label ?? field.name}
			</FieldLabel>
			<Suspense fallback={<Skeleton className='min-h-40 flex-1 rounded-xl' />}>
				<TextEditor
					value={field.state.value ?? EMPTY_RICH_TEXT}
					onChange={field.handleChange}
					onBlur={field.handleBlur}
					editable={!disabled}
					className={cn('min-h-0 flex-1', editorClassName)}
					toolbarClassName={toolbarClassName}
					contentClassName={contentClassName}
					showPreview={showPreview}
					aria-labelledby={labelId}
					aria-invalid={isInvalid}
				/>
			</Suspense>
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
};
