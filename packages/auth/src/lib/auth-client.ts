import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { ac, roles } from '../permissions';

export const authClient = createAuthClient({
	// `ac` and `roles` must match the server config, otherwise
	// `checkRolePermission` (which resolves locally, without a round trip)
	// disagrees with what the server enforces.
	plugins: [adminClient({ ac, roles })],
});
