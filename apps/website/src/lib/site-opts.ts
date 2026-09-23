import { queryOptions } from '@tanstack/react-query';
import { getSiteContent, getSiteQuickLinks } from './site-fns';

export const siteContentQueryOptions = queryOptions({
	queryKey: ['site-content'],
	queryFn: async () => await getSiteContent(),
});

export const siteQuickLinksQueryOptions = queryOptions({
	queryKey: ['site-quick-links'],
	queryFn: async () => await getSiteQuickLinks(),
});
