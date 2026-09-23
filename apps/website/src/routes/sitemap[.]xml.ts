import { createFileRoute } from '@tanstack/react-router';
import { CRAWLER_FILE_CACHE_CONTROL } from '#/lib/cache-control';
import { toSitemapXml } from '#/lib/sitemap';
import { getSitemapPaths } from '#/lib/sitemap-fns';

/**
 * Every page on the site, generated from the database on request.
 *
 * `server.handlers.GET` and not a server function: this is an HTTP contract
 * with crawlers, not data for the app, and nothing in `src/` fetches it. It is
 * therefore the one place in this app that reads the database outside a
 * `createServerFn` — see `sitemap-fns.ts` for why the read lives in a plain
 * module underneath it.
 */
export const Route = createFileRoute('/sitemap.xml')({
	server: {
		handlers: {
			GET: async () =>
				new Response(toSitemapXml(await getSitemapPaths()), {
					headers: {
						'content-type': 'application/xml; charset=utf-8',
						'cache-control': CRAWLER_FILE_CACHE_CONTROL,
					},
				}),
		},
	},
});
