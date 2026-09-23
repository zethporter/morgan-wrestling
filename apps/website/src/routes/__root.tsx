import { ThemeProvider } from '@morgan-wrestling/ui/components/theme-provider';
import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import {
	DOCUMENT_CACHE_CONTROL,
	NOT_FOUND_CACHE_CONTROL,
} from '#/lib/cache-control';
import { isNotFoundRender, rootSeo, seo } from '#/lib/seo';
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';
import appCss from '../styles.css?url';

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	/**
	 * The site-wide defaults. Every other route adds only what is specific to
	 * it, because `HeadContent` lets the deepest match win per `name`/`property`
	 * — a nested route that restated these would overwrite its parent's real
	 * title with a generic one. See `seo.ts`.
	 */
	head: ({ matches }) => {
		const base = rootSeo();
		// The app stylesheet is a build artifact, so its URL is only knowable
		// here; everything else in the head is content and lives in `seo.ts`.
		const links = [...base.links, { rel: 'stylesheet', href: appCss }];

		// A 404 is a real response at a real URL, so it still needs a title —
		// but it is not a page, and a crawler that indexes it will keep coming
		// back to it.
		const notFound = isNotFoundRender(matches)
			? seo({ title: 'Page not found', noindex: true }).meta
			: [];

		return { meta: [...base.meta, ...notFound], links };
	},

	/**
	 * Set on the root so every document response carries it, and merged with any
	 * child route's — `getStartResponseHeaders` folds the matched routes'
	 * headers together, deepest last.
	 */
	headers: ({ matches }) => ({
		'cache-control': isNotFoundRender(matches)
			? NOT_FOUND_CACHE_CONTROL
			: DOCUMENT_CACHE_CONTROL,
	}),

	shellComponent: RootDocument,
	notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className='bg-background text-foreground'>
				<ThemeProvider defaultTheme='system' storageKey='theme'>
					{children}
					<TanStackDevtools
						config={{
							position: 'bottom-right',
						}}
						plugins={[
							{
								name: 'Tanstack Router',
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}

/**
 * The last-resort 404, for a path that matched no route at all.
 *
 * It renders without the site header, because the header is `_layout`'s and a
 * path like `/nonsense` never matched `_layout` — there is no team list loaded
 * to build a nav from, and suspending on one here would mean a 404 that has to
 * hit the database before it can say "not found". The link home is the way
 * back; the nav is one hop behind it.
 *
 * The team and page routes keep their own `notFoundComponent`s (added at M4),
 * which do have the surrounding chrome, so the common case — a stale link to a
 * real team — still lands somewhere navigable.
 */
function NotFound() {
	return (
		<div className='mx-auto flex min-h-screen w-full max-w-4xl flex-col items-start justify-center gap-4 px-4 py-12'>
			<h1 className='font-bold text-3xl'>Page not found</h1>
			<p className='text-muted-foreground'>There is nothing at this address.</p>
			<Link
				to='/'
				className='rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
			>
				Go to the home page
			</Link>
		</div>
	);
}
