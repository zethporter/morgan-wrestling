import { drizzle } from "drizzle-orm/libsql";

export function createAppDb(url: string, authToken: string) {
  return drizzle({
    connection: { url, authToken },
  });
}
