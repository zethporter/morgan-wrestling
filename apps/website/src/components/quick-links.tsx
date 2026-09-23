import { cn } from '@morgan-wrestling/ui/lib/utils';
import { ExternalLinkIcon } from 'lucide-react';
import type { QuickLink } from '#/lib/quick-links';

/** Anything with a scheme, or protocol-relative, leaves the site. */
const isExternal = (url: string) =>
	/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');

/**
 * The published quick links for a page. Rendered as a plain list so it works
 * with JavaScript off; the URLs are scheme-checked server-side by
 * `safeUrl`, so anything that arrives here is safe to put in an `href`.
 */
export const QuickLinks = ({
	links,
	title = 'Quick links',
	className,
}: {
	links: QuickLink[];
	title?: string;
	className?: string;
}) => {
	if (links.length === 0) return null;

	return (
		<nav
			aria-labelledby='quick-links-heading'
			className={cn('w-full', className)}
		>
			<h2
				id='quick-links-heading'
				className='font-semibold text-muted-foreground text-sm uppercase tracking-wide'
			>
				{title}
			</h2>
			<ul className='mt-3 grid gap-2 sm:grid-cols-2'>
				{links.map((link) => {
					const external = isExternal(link.url);
					return (
						<li key={link.id}>
							<a
								href={link.url}
								{...(external
									? { target: '_blank', rel: 'noopener noreferrer' }
									: {})}
								className='flex items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
							>
								<span>{link.title}</span>
								{external && (
									<ExternalLinkIcon
										aria-hidden='true'
										className='size-4 shrink-0 text-muted-foreground'
									/>
								)}
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};
