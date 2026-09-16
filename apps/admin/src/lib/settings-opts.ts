import { queryOptions } from '@tanstack/react-query';
import { getSettings } from './settings-fns';

export const settingsQueryOptions = queryOptions({
	queryKey: ['settings'],
	queryFn: async () => await getSettings(),
});
