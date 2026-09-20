import { type Context, Hono } from 'hono';
import { cache } from 'hono/cache';
import z from 'zod';
import { createCalendar } from './fns/create-calendar';

const app = new Hono();

/** Path segments arrive as strings; the bounds must read as epoch milliseconds. */
const epochMsParam = z
	.string()
	.regex(/^\d+$/, 'expected epoch milliseconds')
	.transform(Number);

const calendarParams = z.object({
	calendarId: z.nanoid(),
	startDate: epochMsParam.optional(),
	endDate: epochMsParam.optional(),
});

const serveCalendar = async (c: Context) => {
	const params = calendarParams.safeParse(c.req.param());
	if (!params.success) {
		return c.json({ error: z.treeifyError(params.error) }, 400);
	}

	const calendar = await createCalendar(params.data);
	return c.body(calendar.toString(), 200, {
		'Content-Type': 'text/calendar; charset=utf-8',
		'Content-Disposition': 'attachment; filename="calendar.ics"',
	});
};

// Repeat polls from subscribed calendar clients are served from the colo cache
// instead of re-querying Turso. Only 200s are stored, so the 400/404 paths stay
// live. Note this is a no-op on *.workers.dev, where `caches.default` accepts a
// `put` and discards it; it only takes effect on the custom domain.
//
// There is no invalidation: `caches.default.delete()` only purges the colo that
// runs it, so the admin app cannot bust this after a schedule edit. The TTL is
// the whole freshness story, which is why it is short.
app.get(
	'*',
	cache({
		cacheName: 'calendar-ics',
		cacheControl: 'public, max-age=900',
	}),
);

// Hono only honours `?` on the final path segment; before a static segment like
// `calendar.ics` it is read as part of the param name, so each arity is its own
// route.
app.get('/:calendarId/calendar.ics', serveCalendar);
app.get('/:calendarId/:startDate/calendar.ics', serveCalendar);
app.get('/:calendarId/:startDate/:endDate/calendar.ics', serveCalendar);

export default app;

// import { createCalendar } from './fns/create-calendar';

// const main = async () => {
// 	const icalendar = await createCalendar({
// 		calendarId: 'CAeNFKyyKBcu-2k_t4BvN',
// 	});

// 	console.log(icalendar);
// };
// main();
