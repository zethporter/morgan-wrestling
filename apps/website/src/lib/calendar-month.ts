/**
 * Civil dates in the site's timezone, and the month grid built out of them.
 *
 * ## Why this module exists
 *
 * `calendar_events.start_time` is an instant, but a calendar is about *days*.
 * The Worker runs in UTC and a visitor could be anywhere, so neither end of the
 * request can be trusted to say which day an event falls on — a 6pm Mountain
 * meet is stored as 00:00 UTC the following morning, and a UTC-based grid would
 * print it on the wrong square.
 *
 * So every day-level decision here goes through a *civil date*: the plain
 * `YYYY-MM-DD` a person in {@link SITE_TIME_ZONE} would write down. The events
 * in the database confirm that is the right frame — the one all-day event today
 * is stored `2026-09-09T06:00:00Z`, which is midnight Mountain, because that is
 * what the admin's date picker sent.
 *
 * Arithmetic on civil dates is done by parsing them back to a UTC instant and
 * stepping in 24-hour jumps. UTC has no DST, so those steps are exact; doing
 * the same in local time would lose or gain an hour twice a year and skip a
 * day. `date-fns` is no help for any of this — it has no timezone support
 * without `@date-fns/tz`, which is not a dependency — so the formatting goes
 * through `Intl` instead.
 */

/**
 * Morgan is in Utah, and the schedule is for people who are too. This is a
 * constant rather than an env var: the README's `.env` has two entries in it
 * and a third that never changes would not earn its place.
 */
export const SITE_TIME_ZONE = 'America/Denver';

const DAY_MS = 86_400_000;

/** How far a multi-day event may be expanded before we assume the row is junk. */
const MAX_EVENT_DAYS = 400;

/** A civil date, `YYYY-MM-DD`. Sorts and compares correctly as a string. */
export type CivilDate = string;

/** A month, `YYYY-MM`. Same property. */
export type CivilMonth = string;

const partsFormatter = (options: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat('en-US', { timeZone: SITE_TIME_ZONE, ...options });

const civilDateParts = partsFormatter({
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

const timeOfDay = partsFormatter({ hour: 'numeric', minute: '2-digit' });

// Civil dates are parsed back to a UTC instant before they are formatted, so
// these read them in UTC — shifting them into the site zone a second time would
// walk the date backwards by the offset.
const dayLabel = new Intl.DateTimeFormat('en-US', {
	timeZone: 'UTC',
	weekday: 'short',
	month: 'short',
	day: 'numeric',
});

const dayLabelWithYear = new Intl.DateTimeFormat('en-US', {
	timeZone: 'UTC',
	weekday: 'short',
	month: 'short',
	day: 'numeric',
	year: 'numeric',
});

const monthLabelFormat = new Intl.DateTimeFormat('en-US', {
	timeZone: 'UTC',
	month: 'long',
	year: 'numeric',
});

const lookup = (
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
) => parts.find((part) => part.type === type)?.value ?? '';

/**
 * The civil date an instant falls on in {@link SITE_TIME_ZONE}.
 *
 * `formatToParts` rather than `format` so this does not depend on how a locale
 * happens to order or punctuate a date.
 */
export const toCivilDate = (instant: Date | number): CivilDate => {
	const parts = civilDateParts.formatToParts(new Date(instant));
	return `${lookup(parts, 'year')}-${lookup(parts, 'month')}-${lookup(parts, 'day')}`;
};

/** Today, where the site is. */
export const civilToday = (now: Date | number = Date.now()): CivilDate =>
	toCivilDate(now);

/** Splits a civil date into numbers. Assumes the shape; callers validate first. */
const civilParts = (date: CivilDate) => {
	const [year, month, day] = date.split('-').map(Number);
	return { year: year ?? 0, month: month ?? 1, day: day ?? 1 };
};

/** The UTC instant of midnight on a civil date — the anchor all stepping uses. */
const civilToUtc = (date: CivilDate): number => {
	const { year, month, day } = civilParts(date);
	return Date.UTC(year, month - 1, day);
};

const utcToCivil = (instant: number): CivilDate => {
	const date = new Date(instant);
	const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
	const day = `${date.getUTCDate()}`.padStart(2, '0');
	return `${date.getUTCFullYear()}-${month}-${day}`;
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const isCivilMonth = (value: unknown): value is CivilMonth =>
	typeof value === 'string' && MONTH_PATTERN.test(value);

/** The month a civil date belongs to. */
export const monthOf = (date: CivilDate): CivilMonth => date.slice(0, 7);

/**
 * `delta` months either side of the given one. Goes through `Date.UTC`, which
 * normalizes month 13 to January of the next year, so December and January
 * need no special case.
 */
export const shiftMonth = (month: CivilMonth, delta: number): CivilMonth => {
	const { year, month: index } = civilParts(`${month}-01`);
	return utcToCivil(Date.UTC(year, index - 1 + delta, 1)).slice(0, 7);
};

/** `'2026-09'` → `'September 2026'`. */
export const monthLabel = (month: CivilMonth): string =>
	monthLabelFormat.format(new Date(civilToUtc(`${month}-01`)));

/** Sunday-first, to match how a school schedule is usually read. */
export const WEEKDAY_LABELS = [
	'Sun',
	'Mon',
	'Tue',
	'Wed',
	'Thu',
	'Fri',
	'Sat',
] as const;

/**
 * The civil dates a month's grid covers: whole weeks, so the first row starts
 * on a Sunday and the last row ends on a Saturday. Adjacent-month days are
 * included rather than blanked, so an event on the 1st of next month still
 * shows up where a visitor would look for it.
 */
export const monthGridDates = (month: CivilMonth): CivilDate[] => {
	const { year, month: index } = civilParts(`${month}-01`);
	const firstWeekday = new Date(Date.UTC(year, index - 1, 1)).getUTCDay();
	// Day 0 of the next month is the last day of this one.
	const daysInMonth = new Date(Date.UTC(year, index, 0)).getUTCDate();
	const cells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
	const start = Date.UTC(year, index - 1, 1 - firstWeekday);

	return Array.from({ length: cells }, (_, offset) =>
		utcToCivil(start + offset * DAY_MS),
	);
};

/**
 * The instants to bound the SQL query for a month's grid by.
 *
 * Padded by two days on each side rather than converted exactly. A civil date
 * in the site zone starts six or seven hours after the UTC day does, so the
 * true window edges sit inside the padding; the grid then discards whatever
 * falls outside it. Getting the exact instant of midnight in a named timezone
 * needs an offset lookup, and an over-wide bound costs at most a couple of
 * days of rows the Worker throws away.
 */
export const monthWindow = (month: CivilMonth) => {
	const dates = monthGridDates(month);
	const first = dates.at(0) ?? `${month}-01`;
	const last = dates.at(-1) ?? `${month}-01`;

	return {
		startMs: civilToUtc(first) - 2 * DAY_MS,
		endMs: civilToUtc(last) + 2 * DAY_MS,
	};
};

/** The minimum an event needs for any of the day maths below. */
export type DatedEvent = {
	startTime: number;
	endTime: number;
	allDay: boolean;
};

/**
 * Every civil date an event covers, start and end inclusive.
 *
 * The end is inclusive because that is what the admin stores: the one all-day
 * event in the database runs `2026-09-09` to `2026-09-12` and is a four-day
 * event, not three. An end before the start is treated as a single day rather
 * than an empty range, so a mis-entered row still appears somewhere.
 */
export const eventDates = (event: DatedEvent): CivilDate[] => {
	const start = toCivilDate(event.startTime);
	const end = toCivilDate(event.endTime);
	if (end <= start) return [start];

	const dates: CivilDate[] = [];
	const last = civilToUtc(end);
	for (
		let instant = civilToUtc(start);
		instant <= last && dates.length < MAX_EVENT_DAYS;
		instant += DAY_MS
	) {
		dates.push(utcToCivil(instant));
	}

	return dates;
};

export type MonthGridDay<TEvent> = {
	date: CivilDate;
	dayOfMonth: number;
	inMonth: boolean;
	isToday: boolean;
	events: TEvent[];
};

/**
 * Buckets events onto the days of a month's grid. Events are placed on every
 * day they cover, so a three-day tournament is marked three times, and each
 * day keeps the order the query returned them in.
 */
export const buildMonthGrid = <TEvent extends DatedEvent>({
	month,
	events,
	today = civilToday(),
}: {
	month: CivilMonth;
	events: readonly TEvent[];
	today?: CivilDate;
}): MonthGridDay<TEvent>[][] => {
	const byDate = new Map<CivilDate, TEvent[]>();
	for (const event of events) {
		for (const date of eventDates(event)) {
			const day = byDate.get(date);
			if (day) day.push(event);
			else byDate.set(date, [event]);
		}
	}

	const days = monthGridDates(month).map((date) => ({
		date,
		dayOfMonth: civilParts(date).day,
		inMonth: monthOf(date) === month,
		isToday: date === today,
		events: byDate.get(date) ?? [],
	}));

	return Array.from({ length: days.length / 7 }, (_, week) =>
		days.slice(week * 7, week * 7 + 7),
	);
};

/** `'2026-09-09'` → `'Wed, Sep 9'`, with the year only when it is not this one. */
export const formatCivilDate = (
	date: CivilDate,
	today: CivilDate = civilToday(),
): string => {
	const format =
		date.slice(0, 4) === today.slice(0, 4) ? dayLabel : dayLabelWithYear;
	return format.format(new Date(civilToUtc(date)));
};

/** `'6:00 PM'`, in the site's timezone. */
export const formatTimeOfDay = (instant: Date | number): string =>
	timeOfDay.format(new Date(instant));

/**
 * When an event happens, in one line: the shape depends on whether it is
 * all-day and whether it ends on the day it started.
 *
 * | Event | Reads as |
 * | --- | --- |
 * | all-day, one day | `Wed, Sep 9 · All day` |
 * | all-day, several | `Wed, Sep 9 – Sat, Sep 12` |
 * | timed, one day | `Wed, Sep 9 · 6:00 PM – 8:00 PM` |
 * | timed, several | `Wed, Sep 9, 6:00 PM – Sat, Sep 12, 8:00 PM` |
 */
export const formatEventWhen = (
	event: DatedEvent,
	today: CivilDate = civilToday(),
): string => {
	const dates = eventDates(event);
	const start = dates.at(0) ?? toCivilDate(event.startTime);
	const end = dates.at(-1) ?? start;
	const startLabel = formatCivilDate(start, today);

	if (event.allDay) {
		return end === start
			? `${startLabel} · All day`
			: `${startLabel} – ${formatCivilDate(end, today)}`;
	}

	const startTime = formatTimeOfDay(event.startTime);
	const endTime = formatTimeOfDay(event.endTime);

	if (end === start) {
		return startTime === endTime
			? `${startLabel} · ${startTime}`
			: `${startLabel} · ${startTime} – ${endTime}`;
	}

	return `${startLabel}, ${startTime} – ${formatCivilDate(end, today)}, ${endTime}`;
};
