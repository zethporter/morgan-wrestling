// Re-export drizzle's query-building surface (eq, and, or, inArray, sql, ...)
// so apps don't need their own drizzle-orm dependency. bun's isolated linker
// hides it as a transitive dep, and a second copy would make drizzle's
// instance-sensitive column/table types stop matching this package's schema.
export * from 'drizzle-orm';
