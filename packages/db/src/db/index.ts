import { drizzle } from 'drizzle-orm/tursodatabase-serverless';

// const db = drizzle({
// 	connection: {
// 		url: process.env.TURSO_URL,
// 		authToken: process.env.TURSO_TOKEN
// 	}
// });

export function createAppDb(url: string, authToken: string) {
	return drizzle({
		connection: { url, authToken },
	});
}
