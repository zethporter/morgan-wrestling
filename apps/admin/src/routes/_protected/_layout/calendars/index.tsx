import { createFileRoute, redirect } from '@tanstack/react-router';
import {
	calendarsQueryOptions,
	LAST_CALENDAR_KEY,
	NO_CALENDARS,
} from '#/lib/calendar-opts';

export const Route = createFileRoute('/_protected/_layout/calendars/')({
	loader: async ({ context }) => {
		const calendars =
			(await context.queryClient.query(calendarsQueryOptions)) ?? [];

		const storage = typeof window !== 'undefined' ? localStorage : null;
		const lastId = storage?.getItem(LAST_CALENDAR_KEY);
		const match = calendars.find((c) => c.id === lastId);
		const target = match ?? calendars[0];

		throw redirect({
			to: '/calendars/$calendarId',
			params: { calendarId: target ? target.id : NO_CALENDARS },
		});
	},
});
