import {
	calendarEvents,
	calendarInsertSchema,
	calendars,
} from '@morgan-wrestling/db/schema';
import { eq } from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDb } from '#/db';
import { requirePermission, throwAsResponse } from '#/lib/auth-fns';

export const newCalendarValidator = calendarInsertSchema.omit({
	id: true,
	createdAt: true,
	createdBy: true,
	updatedAt: true,
	updatedBy: true,
});

export const handleNewCalendarSubmit = createServerFn({ method: 'POST' })
	.validator((data: unknown) => {
		const validatedData = newCalendarValidator.parse(data);
		return validatedData;
	})
	.handler(async ({ data }) => {
		try {
			const session = await requirePermission({ calendar: ['create'] });
			const creationDate = new Date();
			await getDb().insert(calendars).values({
				...data,
				id: nanoid(),
				// user.id, not user.email — better-auth lets users change their email,
				// and these columns have no FK to fix up (auth lives in a separate DB).
				createdBy: session.user.id,
				updatedBy: session.user.id,
				createdAt: creationDate,
				updatedAt: creationDate,
			});
		} catch (e) {
			throwAsResponse(e);
		}
		return 'Successfully created calendar';
	});

export const getCalendars = createServerFn({ method: 'GET' }).handler(
	async () => {
		try {
			await requirePermission({ calendar: ['read'] });
			const _calendars = await getDb()
				.select({
					id: calendars.id,
					name: calendars.name,
					color: calendars.color,
				})
				.from(calendars);
			return _calendars;
		} catch (e) {
			throwAsResponse(e);
		}
	},
);

export const getAllCalendarItems = createServerFn({ method: 'GET' })
	.validator((data: unknown) => {
		const validatedData = z.object({ calendarId: z.nanoid() }).parse(data);
		return validatedData;
	})
	.handler(async ({ data }) => {
		try {
			await requirePermission({ calendarEvent: ['read'] });
			const { calendarId } = data;
			const events = await getDb()
				.select({
					id: calendarEvents.id,
				})
				.from(calendarEvents)
				.where(eq(calendarEvents.calendarId, calendarId));
			return events;
		} catch (e) {
			throwAsResponse(e);
		}
	});
