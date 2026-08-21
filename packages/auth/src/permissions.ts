import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

/**
 * One resource per table in the app schema (`@morgan-wrestling/db`), named after
 * the table's singular form. `defaultStatements` carries better-auth's own
 * `user` and `session` resources so the built-in admin endpoints keep working.
 */
export const statement = {
	...defaultStatements,
	calendar: ['create', 'read', 'update', 'delete'],
	calendarEventType: ['create', 'read', 'update', 'delete'],
	calendarEvent: ['create', 'read', 'update', 'delete'],
	team: ['create', 'read', 'update', 'delete'],
	teamPage: ['create', 'read', 'update', 'delete'],
	quickLink: ['create', 'read', 'update', 'delete'],
	teamQuickLink: ['create', 'read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statement);

/** Full control of every resource, plus user/session management. */
export const admin = ac.newRole({
	...adminAc.statements,
	calendar: ['create', 'read', 'update', 'delete'],
	calendarEventType: ['create', 'read', 'update', 'delete'],
	calendarEvent: ['create', 'read', 'update', 'delete'],
	team: ['create', 'read', 'update', 'delete'],
	teamPage: ['create', 'read', 'update', 'delete'],
	quickLink: ['create', 'read', 'update', 'delete'],
	teamQuickLink: ['create', 'read', 'update', 'delete'],
});

/**
 * Runs the site: full control of all content, but cannot ban users, impersonate
 * them, or revoke sessions.
 */
export const manager = ac.newRole({
	calendar: ['create', 'read', 'update', 'delete'],
	calendarEventType: ['create', 'read', 'update', 'delete'],
	calendarEvent: ['create', 'read', 'update', 'delete'],
	team: ['create', 'read', 'update', 'delete'],
	teamPage: ['create', 'read', 'update', 'delete'],
	quickLink: ['create', 'read', 'update', 'delete'],
	teamQuickLink: ['create', 'read', 'update', 'delete'],
});

/**
 * Day-to-day scheduling and team content. Can fully manage events, and can add
 * or edit team pages and links, but cannot delete the calendars, event types,
 * or teams those hang off of.
 */
export const coach = ac.newRole({
	calendar: ['read'],
	calendarEventType: ['create', 'read', 'update'],
	calendarEvent: ['create', 'read', 'update', 'delete'],
	team: ['read', 'update'],
	teamPage: ['create', 'read', 'update'],
	quickLink: ['read'],
	teamQuickLink: ['create', 'read', 'update'],
});

/**
 * Adds and edits its own corner of the site — pages and links — without
 * touching the schedule.
 */
export const contributor = ac.newRole({
	calendar: ['read'],
	calendarEventType: ['read'],
	calendarEvent: ['read'],
	team: ['read'],
	teamPage: ['create', 'read', 'update'],
	quickLink: ['read'],
	teamQuickLink: ['create', 'read', 'update'],
});

/** Default role for a new signup: sees everything, changes nothing. */
export const user = ac.newRole({
	calendar: ['read'],
	calendarEventType: ['read'],
	calendarEvent: ['read'],
	team: ['read'],
	teamPage: ['read'],
	quickLink: ['read'],
	teamQuickLink: ['read'],
});

/** Signed in but not yet approved for anything. */
export const guest = ac.newRole({});

export const roles = {
	admin,
	manager,
	coach,
	contributor,
	user,
	guest,
};

export type Role = keyof typeof roles;

/** Ordered for UI pickers, most privileged first. */
export const ROLE_NAMES = [
	'admin',
	'manager',
	'coach',
	'contributor',
	'user',
	'guest',
] as const satisfies readonly Role[];

export type Resource = keyof typeof statement;

/** A set of resource/action pairs to check, e.g. `{ calendar: ['create'] }`. */
export type PermissionRequest = {
	[R in Resource]?: (typeof statement)[R][number][];
};

const ROLE_NAME_SET = new Set<string>(ROLE_NAMES);

/**
 * Narrows the free-text `user.role` column to a known role, falling back to
 * `user` (the plugin's `defaultRole`) for null or unrecognized values.
 */
export function toRole(value: string | null | undefined): Role {
	return value && ROLE_NAME_SET.has(value) ? (value as Role) : 'user';
}
