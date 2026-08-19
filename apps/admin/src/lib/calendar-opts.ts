import { queryOptions } from '@tanstack/react-query';
import { getCalendars } from './calendar-fns';

export const LAST_CALENDAR_KEY = 'last-calendar-id';


export const calendarsQueryOptions = queryOptions({
	queryKey: ['calendars'],
	queryFn: async () => {
		return await getCalendars();
	},
});
