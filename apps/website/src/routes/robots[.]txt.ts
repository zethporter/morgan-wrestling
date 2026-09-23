import { createFileRoute } from '@tanstack/react-router';
import { CRAWLER_FILE_CACHE_CONTROL } from '#/lib/cache-control';
import { absoluteUrl } from '#/lib/seo';
import { robotsTxt } from '#/lib/sitemap-fns';

/**
 * A route rather than a file in `public/`, which would be served without
 * booting the Worker at all and is the cheaper option on paper. The reason it
 * is here is that the sitemap URL has to be absolute: a static file would carry
 * a second hard-coded copy of the origin, free to drift from `SITE_ORIGIN`, and
 * a `robots.txt` pointing at a sitemap that is not there is worse than no
 * `robots.txt`. One invocation, a few times a day, buys one definition.
 */
export const Route = createFileRoute('/robots.txt')({
	server: {
		handlers: {
			GET: () =>
				new Response(robotsTxt(absoluteUrl('/sitemap.xml')), {
					headers: {
						'content-type': 'text/plain; charset=utf-8',
						'cache-control': CRAWLER_FILE_CACHE_CONTROL,
					},
				}),
		},
	},
});
