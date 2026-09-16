import { eq } from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getDb, settings, settingUpdateSchema } from '#/db';
import { requirePermission } from './auth-fns';

export const SITE_SETTINGS_ID = 'site';

export const getSettings = createServerFn({ method: 'GET' }).handler(
	async () => {
		await requirePermission({ setting: ['read'] });
		return await getDb()
			.select()
			.from(settings)
			.where(eq(settings.id, SITE_SETTINGS_ID));
	},
);

const updateSettingsSchema = z.object({
	values: settingUpdateSchema.omit({ id: true }),
});
export const updateSettings = createServerFn({ method: 'POST' })
	.validator(updateSettingsSchema)
	.handler(async ({ data }) => {
		await requirePermission({ setting: ['update'] });
		return await getDb()
			.update(settings)
			.set(data.values)
			.where(eq(settings.id, SITE_SETTINGS_ID))
			.returning({
				id: settings.id,
				homeContent: settings.homeContent,
				homeContentMetadata: settings.homeContentMetadata,
				defaultCalendar: settings.defaultCalendar,
			});
	});
