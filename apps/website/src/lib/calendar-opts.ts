import { queryOptions } from '@tanstack/react-query';
import {
	type EventScope,
	getMonthEvents,
	getPublicCalendar,
	getPublicCalendars,
	getUpcomingEvents,
} from './calendar-fns';
import type { CivilMonth } from './calendar-month';

export const publicCalendarsQueryOptions = queryOptions({
	queryKey: ['public-calendars'],
	queryFn: async () => await getPublicCalendars(),
});

export const publicCalendarQueryOptions = (calendarId: string) =>
	queryOptions({
		queryKey: ['public-calendar', calendarId],
		queryFn: async () => await getPublicCalendar({ data: { calendarId } }),
	});

export const monthEventsQueryOptions = (scope: EventScope, month: CivilMonth) =>
	queryOptions({
		queryKey: ['month-events', scope, month],
		queryFn: async () => await getMonthEvents({ data: { scope, month } }),
	});

export const upcomingEventsQueryOptions = (scope: EventScope) =>
	queryOptions({
		queryKey: ['upcoming-events', scope],
		queryFn: async () => await getUpcomingEvents({ data: { scope } }),
	});
