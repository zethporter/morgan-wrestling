import {
	and,
	asc,
	eq,
	gte,
	inArray,
	isNotNull,
	lte,
	or,
} from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
	calendarEvents,
	calendarEventTypes,
	calendars,
	getDb,
	type ReadonlyDb,
	settings,
	teams,
} from '#/db';
import { isCivilMonth, monthWindow } from './calendar-month';
import { SITE_SETTINGS_ID } from './site-fns';

/**
 * Where the `.ics` files live. `apps/calendar` serves them, and this site only
 * links to them — see the "No `.ics` generation" non-goal in the README.
 *
 * Hard-coded rather than an env var on purpose: the calendar worker's hostname
 * is a fact about the deployment, not a per-environment secret, and a fourth
 * line in `.env` is exactly what §11 warns about. A local dev server therefore
 * links at the real calendar worker, which is the correct destination anyway.
 */
const CALENDAR_ICS_ORIGIN = 'https://calendar.morganwrestling.org';

/** How many upcoming events a list shows, and how far ahead it looks. */
const UPCOMING_LIMIT = 10;
const UPCOMING_HORIZON_MS = 365 * 86_400_000;

export const subscribeUrl = (calendarId: string): string =>
	`${CALENDAR_ICS_ORIGIN}/${encodeURIComponent(calendarId)}/calendar.ics`;

/**
 * `calendars` has no `public` flag, so a calendar is public exactly when
 * something on this site points at it: it is `settings.default_calendar`, or it
 * is some team's `teams.default_calendar_id`. Publishing a calendar is the act
 * of wiring it into the site in the admin. See §8 of the README.
 *
 * This is the only definition of "public" in the app, and every calendar read
 * goes through it — including the ones that also filter by id, so that guessing
 * the id of an internal calendar is not a way around the list. There are three
 * calendars in the database today and only one of them is referenced.
 *
 * Expressed as two subqueries rather than a CTE because `ReadonlyDb` withholds
 * `with(...)`: the object drizzle returns from it carries its own `insert`,
 * `update` and `delete`. Two `IN`s cost one round trip and no write path.
 */
/** The two columns that hold a calendar id and therefore need this filter. */
type CalendarIdColumn = typeof calendars.id | typeof calendarEvents.calendarId;

const isPublicCalendar = (db: ReadonlyDb, column: CalendarIdColumn) =>
	or(
		inArray(
			column,
			db
				.select({ id: settings.defaultCalendar })
				.from(settings)
				.where(eq(settings.id, SITE_SETTINGS_ID)),
		),
		inArray(
			column,
			db
				.selectDistinct({ id: teams.defaultCalendarId })
				.from(teams)
				.where(isNotNull(teams.defaultCalendarId)),
		),
	);

export type PublicCalendar = {
	id: string;
	name: string;
	color: string | null;
	subscribeUrl: string;
};

/** Every calendar a visitor is allowed to see, named and in name order. */
export const getPublicCalendars = createServerFn({ method: 'GET' }).handler(
	async (): Promise<PublicCalendar[]> => {
		const db = getDb();
		const rows = await db
			.select({
				id: calendars.id,
				name: calendars.name,
				color: calendars.color,
			})
			.from(calendars)
			.where(isPublicCalendar(db, calendars.id))
			.orderBy(asc(calendars.name));

		return rows.map((row) => ({ ...row, subscribeUrl: subscribeUrl(row.id) }));
	},
);

/**
 * One calendar by id, or `null` if it is not public — which the route turns
 * into a 404, so an unreferenced calendar is not reachable by guessing its id.
 */
export const getPublicCalendar = createServerFn({ method: 'GET' })
	.validator(z.object({ calendarId: z.string().min(1) }))
	.handler(async ({ data }): Promise<PublicCalendar | null> => {
		const db = getDb();
		const [calendar] = await db
			.select({
				id: calendars.id,
				name: calendars.name,
				color: calendars.color,
			})
			.from(calendars)
			.where(
				and(
					eq(calendars.id, data.calendarId),
					isPublicCalendar(db, calendars.id),
				),
			)
			.limit(1);

		if (!calendar) return null;

		return { ...calendar, subscribeUrl: subscribeUrl(calendar.id) };
	});

/**
 * Which calendars a list of events is drawn from.
 *
 * `site` and `team` resolve the default calendar in SQL rather than taking an
 * id the caller looked up first, so a page needs one round trip and not two.
 * They also need no separate public check: being referenced by the site or a
 * team is *what makes* a calendar public.
 */
const eventScopeSchema = z.discriminatedUnion('scope', [
	z.object({ scope: z.literal('public') }),
	z.object({ scope: z.literal('calendar'), calendarId: z.string().min(1) }),
	z.object({ scope: z.literal('site') }),
	z.object({ scope: z.literal('team'), teamSlug: z.string().min(1) }),
]);

export type EventScope = z.infer<typeof eventScopeSchema>;

const scopeFilter = (db: ReadonlyDb, scope: EventScope) => {
	switch (scope.scope) {
		case 'public':
			return isPublicCalendar(db, calendarEvents.calendarId);
		case 'calendar':
			return and(
				eq(calendarEvents.calendarId, scope.calendarId),
				isPublicCalendar(db, calendarEvents.calendarId),
			);
		case 'site':
			return inArray(
				calendarEvents.calendarId,
				db
					.select({ id: settings.defaultCalendar })
					.from(settings)
					.where(eq(settings.id, SITE_SETTINGS_ID)),
			);
		case 'team':
			return inArray(
				calendarEvents.calendarId,
				db
					.select({ id: teams.defaultCalendarId })
					.from(teams)
					.where(eq(teams.normalizedName, scope.teamSlug)),
			);
	}
};

/**
 * `start_time`/`end_time` are `Date`-mode columns, but they cross to the client
 * as epoch milliseconds — the same currency `apps/calendar` takes in its URL —
 * so nothing depends on how the RPC boundary happens to serialize a `Date`.
 */
export type PublicEvent = {
	id: number;
	title: string;
	location: string | null;
	startTime: number;
	endTime: number;
	allDay: boolean;
	calendarId: string;
	calendarName: string;
	eventType: string | null;
	eventTypeColor: string | null;
};

/**
 * The columns every event list needs.
 *
 * `description` is not among them: the lists show title, time, location and
 * type (§8), and leaving it out keeps free text the admin never sanitizes off
 * the public wire. `created_by`/`updated_by` are never selected, as everywhere
 * else. `calendar_event_types.icon`/`icon_type` are skipped too — nothing in
 * the repo renders them and every row has `NONE` today.
 */
const selectEvents = (db: ReadonlyDb) =>
	db
		.select({
			id: calendarEvents.id,
			title: calendarEvents.title,
			location: calendarEvents.location,
			startTime: calendarEvents.startTime,
			endTime: calendarEvents.endTime,
			allDay: calendarEvents.allDay,
			calendarId: calendarEvents.calendarId,
			calendarName: calendars.name,
			eventType: calendarEventTypes.name,
			eventTypeColor: calendarEventTypes.color,
		})
		.from(calendarEvents)
		.innerJoin(calendars, eq(calendars.id, calendarEvents.calendarId))
		// `event_type_id` is `NOT NULL` with a foreign key, so this should always
		// match — left-joined anyway, matching `apps/calendar`, so a broken row
		// loses its dot colour instead of vanishing from the schedule.
		.leftJoin(
			calendarEventTypes,
			eq(calendarEventTypes.id, calendarEvents.eventTypeId),
		);

type EventRow = {
	startTime: Date;
	endTime: Date;
} & Omit<PublicEvent, 'startTime' | 'endTime'>;

const toPublicEvent = (row: EventRow): PublicEvent => ({
	...row,
	startTime: row.startTime.getTime(),
	endTime: row.endTime.getTime(),
});

/**
 * The events that touch a month's grid.
 *
 * The window is derived from the month here, in the Worker, so the size of the
 * query is not something a URL can ask for. Bounds are overlap-based — keep any
 * event that intersects the window, not only those inside it — which is the
 * same rule `apps/calendar/src/fns/create-calendar.ts` uses, and what makes a
 * tournament that started last month still show on this month's first row.
 */
export const getMonthEvents = createServerFn({ method: 'GET' })
	.validator(
		z.object({
			scope: eventScopeSchema,
			month: z.string().refine(isCivilMonth, 'expected YYYY-MM'),
		}),
	)
	.handler(async ({ data }): Promise<PublicEvent[]> => {
		const db = getDb();
		const { startMs, endMs } = monthWindow(data.month);

		const rows = await selectEvents(db)
			.where(
				and(
					scopeFilter(db, data.scope),
					gte(calendarEvents.endTime, new Date(startMs)),
					lte(calendarEvents.startTime, new Date(endMs)),
				),
			)
			.orderBy(asc(calendarEvents.startTime), asc(calendarEvents.id));

		return rows.map(toPublicEvent);
	});

/**
 * The next few events that have not finished yet, soonest first.
 *
 * `end_time >= now` rather than `start_time >= now`, so an event that is
 * happening right now stays at the top of the list instead of disappearing the
 * moment it starts. Bounded by a horizon as well as a limit, so a stray row
 * dated 2085 cannot drag the whole list into the future.
 */
export const getUpcomingEvents = createServerFn({ method: 'GET' })
	.validator(z.object({ scope: eventScopeSchema }))
	.handler(async ({ data }): Promise<PublicEvent[]> => {
		const db = getDb();
		const now = Date.now();

		const rows = await selectEvents(db)
			.where(
				and(
					scopeFilter(db, data.scope),
					gte(calendarEvents.endTime, new Date(now)),
					lte(calendarEvents.startTime, new Date(now + UPCOMING_HORIZON_MS)),
				),
			)
			.orderBy(asc(calendarEvents.startTime), asc(calendarEvents.id))
			.limit(UPCOMING_LIMIT);

		return rows.map(toPublicEvent);
	});
