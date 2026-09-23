import { queryOptions } from '@tanstack/react-query';
import {
	getTeam,
	getTeamNav,
	getTeamPage,
	getTeamPageNav,
	getTeamQuickLinks,
} from './team-fns';

export const teamNavQueryOptions = queryOptions({
	queryKey: ['team-nav'],
	queryFn: async () => await getTeamNav(),
});

export const teamQueryOptions = (teamSlug: string) =>
	queryOptions({
		queryKey: ['team', teamSlug],
		queryFn: async () => await getTeam({ data: { teamSlug } }),
	});

export const teamPageNavQueryOptions = (teamSlug: string) =>
	queryOptions({
		queryKey: ['team-page-nav', teamSlug],
		queryFn: async () => await getTeamPageNav({ data: { teamSlug } }),
	});

export const teamQuickLinksQueryOptions = (teamSlug: string) =>
	queryOptions({
		queryKey: ['team-quick-links', teamSlug],
		queryFn: async () => await getTeamQuickLinks({ data: { teamSlug } }),
	});

export const teamPageQueryOptions = (teamSlug: string, pageSlug: string) =>
	queryOptions({
		queryKey: ['team-page', teamSlug, pageSlug],
		queryFn: async () => await getTeamPage({ data: { teamSlug, pageSlug } }),
	});
