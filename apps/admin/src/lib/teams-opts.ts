import { queryOptions } from '@tanstack/react-query';
import { getTeam, getTeamPage, getTeamPages, getTeams } from './team-fns';

export const LAST_TEAM_KEY = 'last-team-key';
export const NO_TEAMS = 'no_teams';

export const teamsQueryOptions = queryOptions({
	queryKey: ['teams'],
	queryFn: async () => {
		return await getTeams();
	},
});

export const teamQueryOptions = (teamId: string) =>
	queryOptions({
		queryKey: ['team', teamId],
		queryFn: async () => await getTeam({ data: { id: teamId } }),
		enabled: !!teamId && teamId !== NO_TEAMS,
	});

export const teamPagesQueryOptions = (teamId: string) =>
	queryOptions({
		queryKey: ['team-pages', teamId],
		queryFn: async () => getTeamPages({ data: { teamId } }),
		enabled: !!teamId && teamId !== NO_TEAMS,
	});

export const teamPageQueryOptions = (pageId: number, teamId: string) =>
	queryOptions({
		queryKey: ['team-page', pageId, teamId],
		queryFn: async () => getTeamPage({ data: { id: pageId, teamId } }),
		enabled: !!pageId && !!teamId,
	});
