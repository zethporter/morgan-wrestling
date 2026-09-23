import { queryOptions } from '@tanstack/react-query';
import { getTeamNav } from './team-fns';

export const teamNavQueryOptions = queryOptions({
	queryKey: ['team-nav'],
	queryFn: async () => await getTeamNav(),
});
