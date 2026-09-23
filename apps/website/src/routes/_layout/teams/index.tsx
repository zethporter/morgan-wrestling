import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * `/teams` is not a page. There is no useful bare team index — the header
 * already lists every team, so a visitor who lands here (a trimmed URL, a stale
 * link) is sent home to pick one from the nav.
 *
 * The redirect lives in `beforeLoad` so it resolves during SSR: the visitor
 * gets a 301 to `/` instead of an empty shell that bounces after hydration.
 */
export const Route = createFileRoute('/_layout/teams/')({
	beforeLoad: () => {
		throw redirect({ to: '/', statusCode: 301 });
	},
});
