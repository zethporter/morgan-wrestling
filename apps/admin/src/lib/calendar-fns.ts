import {
	calendarEventInsertSchema,
	calendarEvents,
	calendarEventTypeInsertSchema,
	calendarEventTypes,
	calendarEventTypeUpdateSchema,
	calendarEventUpdateSchema,
	calendarInsertSchema,
	calendars,
	calendarUpdateSchema,
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

export const insertCalendar = createServerFn({ method: 'POST' })
	.validator((data: unknown) => {
		const validatedData = newCalendarValidator.parse(data);
		return validatedData;
	})
	.handler(async ({ data }) => {
		try {
			const session = await requirePermission({ calendar: ['create'] });
			const creationDate = new Date();
			await getDb()
				.insert(calendars)
				.values({
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

const getCalendarSchema = z.object({ id: z.nanoid() });
export const getCalendar = createServerFn({ method: 'GET' })
	.validator(getCalendarSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendar: ['read'] });
		const cals = await getDb()
			.select({
				name: calendars.name,
				color: calendars.color,
			})
			.from(calendars)
			.where(eq(calendars.id, data.id))
			.limit(1);
		if (cals.length === 1) {
			return cals[0];
		} else {
			throw new Error('Calendar not found');
		}
	});

export const updateCalendarValues = calendarUpdateSchema.omit({
	id: true,
	createdAt: true,
	createdBy: true,
	updatedAt: true,
	updatedBy: true,
});
export type UpdateCalendarValues = z.infer<typeof updateCalendarValues>;
export const updateCalendarSchema = z.object({
	id: z.nanoid(),
	values: updateCalendarValues,
});
export const updateCalendar = createServerFn({ method: 'POST' })
	.validator(updateCalendarSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ calendar: ['update'] });
		const updatedAt = new Date();
		return await getDb()
			.update(calendars)
			.set({ ...data.values, updatedBy: session.user.id, updatedAt })
			.where(eq(calendars.id, data.id))
			.returning({
				id: calendars.id,
				name: calendars.name,
				color: calendars.color,
			});
	});

const deleteCalendarSchema = z.object({ id: z.nanoid() });
export const deleteCalendar = createServerFn({ method: 'POST' })
	.validator(deleteCalendarSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendar: ['delete'] });
		return await getDb()
			.delete(calendars)
			.where(eq(calendars.id, data.id))
			.returning({
				id: calendars.id,
				name: calendars.name,
			});
	});

const calendarEventsSchema = z.object({
	calendarId: z.nanoid(),
	dateRange: z.object({
		to: z.date(),
		from: z.date(),
	}),
});
export const getCalendarEvents = createServerFn({ method: 'GET' })
	.validator(calendarEventsSchema)
	.handler(async ({ data }) => {
		try {
			await requirePermission({ calendarEvent: ['read'] });
			const { calendarId } = data;
			const events = await getDb()
				.select({
					id: calendarEvents.id,
					title: calendarEvents.title,
					description: calendarEvents.description,
					startTim: calendarEvents.startTime,
					endTime: calendarEvents.endTime,
					allDay: calendarEvents.allDay,
					eventType: calendarEventTypes.name,
					eventColor: calendarEventTypes.color,
				})
				.from(calendarEvents)
				.leftJoin(
					calendarEventTypes,
					eq(calendarEventTypes.id, calendarEvents.eventTypeId),
				)
				.where(eq(calendarEvents.calendarId, calendarId));
			return events;
		} catch (e) {
			throwAsResponse(e);
		}
	});

const getEventSchema = z.object({
	eventId: z.number(),
});
export const getCalendarEvent = createServerFn({ method: 'GET' })
	.validator(getEventSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendarEvent: ['read'] });
		const event = await getDb()
			.select()
			.from(calendarEvents)
			.where(eq(calendarEvents.id, data.eventId));
		return event;
	});

export const insertCalendarEventSchema = calendarEventInsertSchema.omit({
	id: true,
	createdAt: true,
	createdBy: true,
	updatedAt: true,
	updatedBy: true,
});
export const insertCalendarEvent = createServerFn({ method: 'POST' })
	.validator(insertCalendarEventSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ calendarEvent: ['create'] });
		const today = new Date();
		return await getDb()
			.insert(calendarEvents)
			.values({
				...data,
				createdBy: session.user.id,
				updatedBy: session.user.id,
				createdAt: today,
				updatedAt: today,
			})
			.returning({
				id: calendarEvents.id,
				title: calendarEvents.title,
				description: calendarEvents.description,
				location: calendarEvents.location,
				startTime: calendarEvents.startTime,
				endTime: calendarEvents.endTime,
				allDay: calendarEvents.allDay,
				calendarId: calendarEvents.calendarId,
				eventTypeId: calendarEvents.eventTypeId,
			});
	});

const updateCalendarEventSchema = z.object({
	id: z.number(),
	values: calendarEventUpdateSchema.omit({
		id: true,
		createdAt: true,
		createdBy: true,
		updatedAt: true,
		updatedBy: true,
	}),
});
export const updateCalendarEvent = createServerFn({ method: 'POST' })
	.validator(updateCalendarEventSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ calendarEvent: ['update'] });
		const updatedAt = new Date();
		return await getDb()
			.update(calendarEvents)
			.set({ ...data.values, updatedBy: session.user.id, updatedAt })
			.where(eq(calendarEvents.id, data.id))
			.returning({
				id: calendarEvents.id,
				title: calendarEvents.title,
				description: calendarEvents.description,
				location: calendarEvents.location,
				startTime: calendarEvents.startTime,
				endTime: calendarEvents.endTime,
				allDay: calendarEvents.allDay,
				calendarId: calendarEvents.calendarId,
				eventTypeId: calendarEvents.eventTypeId,
			});
	});

const deleteCalendarEventSchema = z.object({ id: z.number() });
export const deleteCalendarEvent = createServerFn({ method: 'POST' })
	.validator(deleteCalendarEventSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendarEvent: ['delete'] });
		return await getDb()
			.delete(calendarEvents)
			.where(eq(calendarEvents.id, data.id))
			.returning({
				id: calendarEvents.id,
				title: calendarEvents.title,
				description: calendarEvents.description,
				location: calendarEvents.location,
				startTime: calendarEvents.startTime,
				endTime: calendarEvents.endTime,
				allDay: calendarEvents.allDay,
				calendarId: calendarEvents.calendarId,
				eventTypeId: calendarEvents.eventTypeId,
			});
	});

const getEventTypesSchema = z.object({
	calendarId: z.nanoid(),
});
export const getEventTypes = createServerFn({ method: 'GET' })
	.validator(getEventTypesSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendarEventType: ['read'] });
		const eventTypes = await getDb()
			.select({
				value: calendarEventTypes.id,
				label: calendarEventTypes.name,
				color: calendarEventTypes.color,
			})
			.from(calendarEventTypes)
			.where(eq(calendarEventTypes.calendarId, data.calendarId));
		return eventTypes;
	});

export const insertCalendarEventTypeSchema = calendarEventTypeInsertSchema.omit(
	{
		id: true,
	},
);
export const insertCalendarEventType = createServerFn({
	method: 'POST',
})
	.validator(insertCalendarEventTypeSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendarEventType: ['create'] });
		return await getDb().insert(calendarEventTypes).values(data).returning({
			id: calendarEventTypes.id,
			name: calendarEventTypes.name,
			calendarId: calendarEventTypes.calendarId,
			iconType: calendarEventTypes.iconType,
			icon: calendarEventTypes.icon,
			color: calendarEventTypes.color,
		});
	});

const updateCalendarEventTypeSchema = z.object({
	id: z.number(),
	values: calendarEventTypeUpdateSchema.omit({
		id: true,
	}),
});
export const updateCalendarEventType = createServerFn({ method: 'POST' })
	.validator(updateCalendarEventTypeSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendarEventType: ['update'] });
		return await getDb()
			.update(calendarEventTypes)
			.set(data.values)
			.where(eq(calendarEventTypes.id, data.id))
			.returning({
				id: calendarEventTypes.id,
				name: calendarEventTypes.name,
				calendarId: calendarEventTypes.calendarId,
				iconType: calendarEventTypes.iconType,
				icon: calendarEventTypes.icon,
				color: calendarEventTypes.color,
			});
	});

const deleteCalendarEventTypeSchema = z.object({ id: z.number() });
export const deleteCalendarEventType = createServerFn({ method: 'POST' })
	.validator(deleteCalendarEventTypeSchema)
	.handler(async ({ data }) => {
		await requirePermission({ calendarEventType: ['delete'] });
		await getDb()
			.delete(calendarEventTypes)
			.where(eq(calendarEventTypes.id, data.id))
			.returning({
				id: calendarEventTypes.id,
				name: calendarEventTypes.name,
				calendarId: calendarEventTypes.calendarId,
				iconType: calendarEventTypes.iconType,
				icon: calendarEventTypes.icon,
				color: calendarEventTypes.color,
			});
	});
