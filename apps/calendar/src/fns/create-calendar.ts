import { and, eq, gte, lte } from '@morgan-wrestling/db/sql';
import { HTTPException } from 'hono/http-exception';
import ical, { ICalCalendarMethod } from 'ical-generator';
import z from 'zod';
import { calendarEvents, calendarEventTypes, calendars, getDb } from '#/db';

/** Epoch milliseconds in, `Date` out — the timestamp columns are `Date`-mode. */
const epochMs = z
	.number()
	.int()
	.transform((ms) => new Date(ms));

const calOptions = z.object({
	calendarId: z.nanoid(),
	startDate: epochMs.optional(),
	endDate: epochMs.optional(),
});

type CalOptions = z.input<typeof calOptions>;

export const createCalendar = async (opts: CalOptions) => {
	const { calendarId, startDate, endDate } = calOptions.parse(opts);

	const db = getDb();

	const [calendar] = await db
		.select()
		.from(calendars)
		.where(eq(calendars.id, calendarId));

	if (!calendar) {
		throw new HTTPException(404, {
			message: `Calendar ${calendarId} not found`,
		});
	}

	// `and()` drops `undefined` operands, so an absent bound simply contributes
	// no condition. Bounds are overlap-based: keep any event that intersects the
	// window, not only those fully contained by it.
	const calItems = await db
		.select({
			id: calendarEvents.id,
			title: calendarEvents.title,
			description: calendarEvents.description,
			location: calendarEvents.location,
			startTime: calendarEvents.startTime,
			endTime: calendarEvents.endTime,
			allDay: calendarEvents.allDay,
			updatedAt: calendarEvents.updatedAt,
			eventType: calendarEventTypes.name,
		})
		.from(calendarEvents)
		.leftJoin(
			calendarEventTypes,
			eq(calendarEventTypes.id, calendarEvents.eventTypeId),
		)
		.where(
			and(
				eq(calendarEvents.calendarId, calendarId),
				startDate ? gte(calendarEvents.endTime, startDate) : undefined,
				endDate ? lte(calendarEvents.startTime, endDate) : undefined,
			),
		);

	const cal = ical({
		name: calendar.name,
		prodId: { company: 'morgan-wrestling', product: 'calendar' },
	});
	cal.method(ICalCalendarMethod.PUBLISH);

	for (const item of calItems) {
		cal.createEvent({
			id: `${item.id}@${calendarId}`,
			start: item.startTime,
			end: item.endTime,
			allDay: item.allDay,
			summary: item.title,
			description: item.description ?? undefined,
			location: item.location ?? undefined,
			categories: item.eventType ? [{ name: item.eventType }] : undefined,
			lastModified: item.updatedAt ?? undefined,
		});
	}

	return cal;
};
