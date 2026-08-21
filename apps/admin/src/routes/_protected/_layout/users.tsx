import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/_layout/users')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/_layout/users"!</div>
}
