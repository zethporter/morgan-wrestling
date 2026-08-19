import { createFileRoute, redirect } from '@tanstack/react-router';
import { calendarsQueryOptions } from '#/lib/calendar-opts';

const LAST_CALENDAR_KEY = 'last-calendar-id';

export const Route = createFileRoute(
    '/_protected/_layout/calendars/_calendarLayout/'
)({
    loader: async ({ context }) => {
        const calendars = await context.queryClient.ensureQueryData(
            calendarsQueryOptions
        );

        const storage = typeof window !== 'undefined' ? localStorage : null;
        const lastId = storage?.getItem(LAST_CALENDAR_KEY);
        const match = calendars.find((c) => c.id === lastId);
        const target = match ?? calendars[0];

        if (!target) throw new Error('No calendars found');

        throw redirect({
        to: '/calendars/$calendarId',
            params: { calendarId: target.id },
        });
    },
});
