import { queryOptions } from '@tanstack/react-query';
import { getQuickLinks, getTeamQuickLinks } from './team-fns';

type QuickLink = {
	id: number;
	title: string;
	url: string;
	active: boolean | null;
};

export const quickLinksQueryOptions = queryOptions({
	queryKey: ['quick-links'],
	queryFn: async () => await getQuickLinks({ data: { status: 'all' } }),
});

export const teamQuickLinksQueryOptions = (teamId: string) =>
	queryOptions({
		queryKey: ['team-quick-links', teamId],
		queryFn: async () => {
			const links = await getTeamQuickLinks({
				data: { status: 'all', teamId },
			});
			return links.map(({ id, title, url, active }) => ({
				id,
				title,
				url,
				active,
			}));
		},
		enabled: !!teamId,
	});

export type { QuickLink };
