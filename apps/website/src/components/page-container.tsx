import { cn } from '@morgan-wrestling/ui/lib/utils';

const WIDTHS = {
	/** The reading measure — home, team pages. */
	prose: 'max-w-4xl',
	/** The calendar grid wants the pixels a reading measure would waste. */
	wide: 'max-w-6xl',
} as const;

/**
 * The one page shell, replacing what was seven hand-written copies of
 * `mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12` (see
 * `RESPONSIVE.md` §2.2). A route picks `wide` when it needs the extra pixels
 * — today, only the calendar — everything else gets the prose measure.
 *
 * `site-header.tsx` and `site-footer.tsx` do not use this: they are chrome,
 * not a page, and align to `wide` unconditionally so the nav lines up with
 * the widest page rather than the narrowest.
 */
export const PageContainer = ({
	width = 'prose',
	className,
	children,
}: {
	width?: keyof typeof WIDTHS;
	className?: string;
	children: React.ReactNode;
}) => (
	<div
		className={cn(
			'mx-auto flex w-full flex-col px-4 sm:px-6 lg:px-8',
			'gap-8 py-8 sm:gap-10 sm:py-12 lg:py-16',
			WIDTHS[width],
			className,
		)}
	>
		{children}
	</div>
);

/**
 * The page-level `<h1>`. Fixed at `text-3xl` it is fine on a phone and
 * undersized on a desktop monitor; this scales with the viewport instead.
 * Section headings (`$pageSlug`'s `<h2>`, the uppercase labels on
 * `EventList`/`QuickLinks`) are already small enough to be safe at every
 * width and stay as they are.
 */
export const PageTitle = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<h1 className={cn('font-bold text-2xl sm:text-3xl lg:text-4xl', className)}>
		{children}
	</h1>
);
