import { Hono } from 'hono';
import { createCalendar } from './fns/create-calendar';

const app = new Hono();

// Will match `/api/animal` and `/api/animal/:type`
app.get('/:calendarId/:startDate?/:endDate?/calendar.ics', async (c) => {
	const { calendarId, startDate, endDate } = c.req.param();
	const calendar = await createCalendar({
		calendarId,
		startDate: startDate ? Number(startDate) : undefined,
		endDate: endDate ? Number(endDate) : undefined,
	});
	return c.body(calendar.toString(), 200, {
		'Content-Type': 'text/calendar; charset=utf-8',
		'Content-Disposition': 'attachment; filename="calendar.ics"',
	});
});

export default app;

// import { createCalendar } from './fns/create-calendar';

// const main = async () => {
// 	const icalendar = await createCalendar({
// 		calendarId: 'CAeNFKyyKBcu-2k_t4BvN',
// 	});

// 	console.log(icalendar);
// };
// main();
