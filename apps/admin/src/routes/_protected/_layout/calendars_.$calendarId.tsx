import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_protected/_layout/calendars_/$calendarId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/_layout/calendars/$calendarId"!</div>
}
