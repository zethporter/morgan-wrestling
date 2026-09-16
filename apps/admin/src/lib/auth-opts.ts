import { queryOptions } from '@tanstack/react-query';
import { getUsersPage } from './auth-fns';

export const userPageQueryOptions =
	// 	({
	// 	page,
	// 	pageSize,
	// }: {
	// 	page: number;
	// 	pageSize: number;
	// }) =>
	queryOptions({
		queryKey: ['users-page'],
		queryFn: async () => {
			return await getUsersPage({ data: { page: 1, pageSize: 10 } });
		},
	});
