import { queryOptions } from '@tanstack/react-query';
import { getCalendar, getCalendars } from './calendar-fns';

export const LAST_CALENDAR_KEY = 'last-calendar-id';

export const calendarsQueryOptions = queryOptions({
	queryKey: ['calendars'],
	queryFn: async () => {
		return await getCalendars();
	},
});

export const calendarQueryOptions = (calendarId: string) =>
	queryOptions({
		queryKey: ['calendar', calendarId],
		queryFn: async ({ queryKey }) =>
			await getCalendar({ data: { id: String(queryKey[1]) } }),
	});
