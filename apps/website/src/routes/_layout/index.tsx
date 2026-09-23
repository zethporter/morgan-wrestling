import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { QuickLinks } from '#/components/quick-links';
import { RichContent } from '#/components/rich-content';
import { env } from '#/env';
import {
	siteContentQueryOptions,
	siteQuickLinksQueryOptions,
} from '#/lib/site-opts';

export const Route = createFileRoute('/_layout/')({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(siteContentQueryOptions),
			context.queryClient.ensureQueryData(siteQuickLinksQueryOptions),
		]);
	},
	component: Home,
});

// M5 adds the upcoming-events list, from `settings.default_calendar`.
function Home() {
	const { data: site } = useSuspenseQuery(siteContentQueryOptions);
	const { data: quickLinks } = useSuspenseQuery(siteQuickLinksQueryOptions);

	return (
		<div className='mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12'>
			{site.homeContent ? (
				<RichContent html={site.homeContent} />
			) : (
				<div>
					<h1 className='font-bold text-3xl'>{env.VITE_APP_TITLE}</h1>
					<p className='mt-2 text-muted-foreground'>
						There is nothing on the home page yet.
					</p>
				</div>
			)}
			<QuickLinks links={quickLinks} />
		</div>
	);
}
