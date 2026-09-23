import { QueryClient } from '@tanstack/react-query';

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Site content changes a few times a week and every page is
				// server-rendered, so a client navigation within the window should
				// reuse what SSR already sent rather than re-hitting Turso.
				staleTime: 5 * 60 * 1000,
			},
		},
	});

	return {
		queryClient,
	};
}
export default function TanstackQueryProvider() {}
