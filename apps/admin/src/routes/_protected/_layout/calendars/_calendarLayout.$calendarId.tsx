import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_protected/_layout/calendars/_calendarLayout/$calendarId',
)({
	component: RouteComponent,
	loader: ({ params }) => {
        localStorage.setItem('last-calendar-id', params.calendarId);
    },
})

function RouteComponent() {
	const { calendarId } = Route.useParams();
	return <div>Hello "/_protected/_layout/calendars/<span>{calendarId}</span>"!</div>
}
