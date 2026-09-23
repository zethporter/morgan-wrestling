import { describe, expect, it } from 'vitest';
import {
	buildMonthGrid,
	eventDates,
	formatEventWhen,
	isCivilMonth,
	monthGridDates,
	monthLabel,
	monthWindow,
	shiftMonth,
	toCivilDate,
} from './calendar-month';

/** The one event in the database: all-day, midnight Mountain, inclusive end. */
const TOURNAMENT = {
	startTime: Date.parse('2026-09-09T06:00:00Z'),
	endTime: Date.parse('2026-09-12T06:00:00Z'),
	allDay: true,
};

describe('toCivilDate', () => {
	it('reads an instant as the day it is in the site timezone', () => {
		// Midnight Mountain on the 9th, which is already the 9th in UTC too.
		expect(toCivilDate(Date.parse('2026-09-09T06:00:00Z'))).toBe('2026-09-09');
	});

	it('keeps a late evening event on the day it happened', () => {
		// 8pm Mountain on the 9th is 02:00 UTC on the 10th. The whole point of
		// the module: a UTC grid would print this event on the wrong square.
		expect(toCivilDate(Date.parse('2026-09-10T02:00:00Z'))).toBe('2026-09-09');
	});

	it('handles the standard-time offset too', () => {
		// January is UTC-7, not UTC-6, so the boundary moves by an hour.
		expect(toCivilDate(Date.parse('2026-01-10T06:59:00Z'))).toBe('2026-01-09');
		expect(toCivilDate(Date.parse('2026-01-10T07:01:00Z'))).toBe('2026-01-10');
	});
});

describe('isCivilMonth', () => {
	it('accepts a well-formed month', () => {
		expect(isCivilMonth('2026-09')).toBe(true);
		expect(isCivilMonth('2026-12')).toBe(true);
	});

	it('rejects anything else', () => {
		expect(isCivilMonth('2026-13')).toBe(false);
		expect(isCivilMonth('2026-00')).toBe(false);
		expect(isCivilMonth('2026-9')).toBe(false);
		expect(isCivilMonth('2026-09-09')).toBe(false);
		expect(isCivilMonth('')).toBe(false);
		expect(isCivilMonth(undefined)).toBe(false);
	});
});

describe('shiftMonth', () => {
	it('steps within a year', () => {
		expect(shiftMonth('2026-09', 1)).toBe('2026-10');
		expect(shiftMonth('2026-09', -1)).toBe('2026-08');
	});

	it('rolls over the year boundary', () => {
		expect(shiftMonth('2026-12', 1)).toBe('2027-01');
		expect(shiftMonth('2026-01', -1)).toBe('2025-12');
	});
});

describe('monthLabel', () => {
	it('names the month', () => {
		expect(monthLabel('2026-09')).toBe('September 2026');
		expect(monthLabel('2027-01')).toBe('January 2027');
	});
});

describe('monthGridDates', () => {
	it('covers whole weeks, Sunday to Saturday', () => {
		const dates = monthGridDates('2026-09');

		expect(dates.length % 7).toBe(0);
		// 1 Sep 2026 is a Tuesday, so the grid opens on Sunday 30 August.
		expect(dates.at(0)).toBe('2026-08-30');
		expect(dates.at(-1)).toBe('2026-10-03');
	});

	it('handles a month that starts on a Sunday without a blank week', () => {
		// 1 Feb 2026 is a Sunday.
		expect(monthGridDates('2026-02').at(0)).toBe('2026-02-01');
	});

	it('includes the leap day', () => {
		expect(monthGridDates('2028-02')).toContain('2028-02-29');
		expect(monthGridDates('2027-02')).not.toContain('2027-02-29');
	});

	it('rolls into the next year at the end of December', () => {
		expect(monthGridDates('2026-12').at(-1)).toBe('2027-01-02');
	});
});

describe('monthWindow', () => {
	it('brackets the grid with room for the timezone offset', () => {
		const { startMs, endMs } = monthWindow('2026-09');

		// Two days either side of 30 Aug and 3 Oct.
		expect(new Date(startMs).toISOString()).toBe('2026-08-28T00:00:00.000Z');
		expect(new Date(endMs).toISOString()).toBe('2026-10-05T00:00:00.000Z');
	});

	it('contains an event on the last visible day, whatever its local time', () => {
		const { endMs } = monthWindow('2026-09');
		// 11pm Mountain on 3 October, which is 5 October in neither zone but
		// would fall outside an unpadded UTC bound.
		expect(Date.parse('2026-10-04T05:00:00Z')).toBeLessThan(endMs);
	});
});

describe('eventDates', () => {
	it('expands a multi-day event inclusively at both ends', () => {
		expect(eventDates(TOURNAMENT)).toEqual([
			'2026-09-09',
			'2026-09-10',
			'2026-09-11',
			'2026-09-12',
		]);
	});

	it('gives a single day for an event inside one day', () => {
		expect(
			eventDates({
				startTime: Date.parse('2026-09-09T18:00:00Z'),
				endTime: Date.parse('2026-09-09T20:00:00Z'),
				allDay: false,
			}),
		).toEqual(['2026-09-09']);
	});

	it('steps across a DST change without losing or repeating a day', () => {
		// Mountain time springs forward on 8 March 2026.
		expect(
			eventDates({
				startTime: Date.parse('2026-03-06T07:00:00Z'),
				endTime: Date.parse('2026-03-10T06:00:00Z'),
				allDay: true,
			}),
		).toEqual([
			'2026-03-06',
			'2026-03-07',
			'2026-03-08',
			'2026-03-09',
			'2026-03-10',
		]);
	});

	it('does not drop an event whose end is before its start', () => {
		expect(
			eventDates({
				startTime: Date.parse('2026-09-09T06:00:00Z'),
				endTime: Date.parse('2026-09-01T06:00:00Z'),
				allDay: true,
			}),
		).toEqual(['2026-09-09']);
	});
});

describe('buildMonthGrid', () => {
	const grid = buildMonthGrid({
		month: '2026-09',
		events: [TOURNAMENT],
		today: '2026-09-23',
	});
	const days = grid.flat();

	it('returns whole weeks of seven days', () => {
		expect(grid.every((week) => week.length === 7)).toBe(true);
	});

	it('marks every day a multi-day event covers', () => {
		const marked = days
			.filter((day) => day.events.length > 0)
			.map((day) => day.date);

		expect(marked).toEqual([
			'2026-09-09',
			'2026-09-10',
			'2026-09-11',
			'2026-09-12',
		]);
	});

	it('flags the days that belong to the month being shown', () => {
		expect(days.find((day) => day.date === '2026-08-30')?.inMonth).toBe(false);
		expect(days.find((day) => day.date === '2026-09-01')?.inMonth).toBe(true);
		expect(days.find((day) => day.date === '2026-10-03')?.inMonth).toBe(false);
	});

	it('flags today, and only today', () => {
		expect(days.filter((day) => day.isToday).map((day) => day.date)).toEqual([
			'2026-09-23',
		]);
	});
});

describe('formatEventWhen', () => {
	const today = '2026-09-23';

	it('reads a multi-day all-day event as a range of days', () => {
		expect(formatEventWhen(TOURNAMENT, today)).toBe('Wed, Sep 9 – Sat, Sep 12');
	});

	it('says so when an all-day event is one day', () => {
		expect(
			formatEventWhen(
				{
					startTime: Date.parse('2026-09-09T06:00:00Z'),
					endTime: Date.parse('2026-09-09T06:00:00Z'),
					allDay: true,
				},
				today,
			),
		).toBe('Wed, Sep 9 · All day');
	});

	it('gives the local times of a timed event', () => {
		expect(
			formatEventWhen(
				{
					// 6pm to 8pm Mountain.
					startTime: Date.parse('2026-09-10T00:00:00Z'),
					endTime: Date.parse('2026-09-10T02:00:00Z'),
					allDay: false,
				},
				today,
			),
		).toBe('Wed, Sep 9 · 6:00 PM – 8:00 PM');
	});

	it('does not repeat a time when an event has no duration', () => {
		const instant = Date.parse('2026-09-10T00:00:00Z');
		expect(
			formatEventWhen(
				{ startTime: instant, endTime: instant, allDay: false },
				today,
			),
		).toBe('Wed, Sep 9 · 6:00 PM');
	});

	it('spells out both ends of a timed event that runs overnight', () => {
		expect(
			formatEventWhen(
				{
					startTime: Date.parse('2026-09-10T01:00:00Z'),
					endTime: Date.parse('2026-09-11T03:00:00Z'),
					allDay: false,
				},
				today,
			),
		).toBe('Wed, Sep 9, 7:00 PM – Thu, Sep 10, 9:00 PM');
	});

	it('adds the year once the event is not in the current one', () => {
		expect(
			formatEventWhen(
				{
					startTime: Date.parse('2027-01-10T01:00:00Z'),
					endTime: Date.parse('2027-01-10T03:00:00Z'),
					allDay: false,
				},
				today,
			),
		).toBe('Sat, Jan 9, 2027 · 6:00 PM – 8:00 PM');
	});
});
