import { drizzle } from 'drizzle-orm/libsql';

export function createAuthDb(url: string, authToken: string) {
	return drizzle({
		connection: { url, authToken },
	});
}
