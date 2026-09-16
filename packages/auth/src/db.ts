import { drizzle } from 'drizzle-orm/tursodatabase-serverless';

export function createAuthDb(url: string, authToken: string) {
	return drizzle({
		connection: { url, authToken },
	});
}
