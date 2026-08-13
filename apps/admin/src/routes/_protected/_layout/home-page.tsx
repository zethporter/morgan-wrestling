import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/_layout/home-page')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/_layout/home-content"!</div>
}
