export { type AuthConfig, type AuthPlugin, createAuth } from './config';
export { createAuthDb } from './db';
// Namespaced: `permissions` exports a `user` role that would otherwise collide
// with the `user` table from './schema'. ESM drops ambiguous star-exports
// silently, so both resolved to undefined.
export * as permissions from './permissions';
export * from './schema';
