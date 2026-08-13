import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/_layout/teams')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/_layout/teams"!</div>
}
