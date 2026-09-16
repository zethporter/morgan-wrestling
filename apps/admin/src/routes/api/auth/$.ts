import { getAuth } from '@morgan-wrestling/auth/lib/auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/auth/$')({
	server: {
		handlers: {
			GET: ({ request }) => getAuth().handler(request),
			POST: ({ request }) => getAuth().handler(request),
		},
	},
});
