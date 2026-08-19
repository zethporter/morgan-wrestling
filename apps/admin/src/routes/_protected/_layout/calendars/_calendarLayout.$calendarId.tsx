import { createFileRoute } from '@tanstack/react-router'
import { LAST_CALENDAR_KEY } from '#/lib/calendar-opts'

export const Route = createFileRoute(
  '/_protected/_layout/calendars/_calendarLayout/$calendarId',
)({
	component: RouteComponent,
	loader: ({ params }) => {
		if (typeof window === 'undefined') return;
		localStorage.setItem(LAST_CALENDAR_KEY, params.calendarId);
	},
})

function RouteComponent() {
	const { calendarId } = Route.useParams();
	return <div>Hello "/_protected/_layout/calendars/<span>{calendarId}</span>"!</div>
}
