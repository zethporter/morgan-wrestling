import { and, eq } from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
	getDb,
	quickLinkInsertSchema,
	quickLinks,
	quickLinkUpdateSchema,
	teamInsertSchema,
	teamPageInsertSchema,
	teamPages,
	teamPageUpdateSchema,
	teamQuickLinkInsertSchema,
	teamQuickLinks,
	teamQuickLinkUpdateSchema,
	teams,
	teamUpdateSchema,
} from '#/db';
import { requirePermission } from './auth-fns';

const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

const createTeamSchema = teamInsertSchema.omit({
	id: true,
	normalizedName: true,
	homeContentMetadata: true,
	homeContent: true,
	defaultCalendarId: true,
});
export const createTeam = createServerFn({ method: 'POST' })
	.validator(createTeamSchema)
	.handler(async ({ data }) => {
		try {
			await requirePermission({ team: ['create'] });

			return await getDb()
				.insert(teams)
				.values({
					...data,
					id: nanoid(),
					normalizedName: normalizeName(data.name),
				})
				.returning({
					id: teams.id,
					name: teams.name,
					normalizedName: teams.normalizedName,
				});
		} catch {
			setResponseStatus(500);
			return 'There was an internal error';
		}
	});

const updateTeamSchema = z.object({
	id: z.nanoid(),
	values: teamUpdateSchema.omit({ id: true, normalizedName: true }),
});
type TTeamUpdate = z.infer<typeof teamUpdateSchema>;
export const updateTeam = createServerFn({ method: 'POST' })
	.validator(updateTeamSchema)
	.handler(async ({ data }) => {
		await requirePermission({ team: ['update'] });
		const updatedValues: TTeamUpdate = { ...data };
		if (updatedValues.name) {
			updatedValues.normalizedName = normalizeName(updatedValues.name);
		}
		return await getDb().update(teams).set(updatedValues).returning({
			id: teams.id,
			name: teams.name,
			homeConten: teams.homeContent,
			homeContentMetadata: teams.homeContentMetadata,
			defaultCalendarId: teams.defaultCalendarId,
		});
	});

const deleteTeamSchema = z.object({
	id: z.nanoid(),
});
export const deleteTeam = createServerFn({ method: 'POST' })
	.validator(deleteTeamSchema)
	.handler(async ({ data }) => {
		await requirePermission({ team: ['delete'] });
		return await getDb().delete(teams).where(eq(teams.id, data.id)).returning({
			id: teams.id,
			name: teams.name,
			homeConten: teams.homeContent,
			homeContentMetadata: teams.homeContentMetadata,
			defaultCalendarId: teams.defaultCalendarId,
		});
	});

export const getTeams = createServerFn({ method: 'GET' }).handler(async () => {
	await requirePermission({ team: ['read'] });
	return await getDb()
		.select({
			id: teams.id,
			name: teams.name,
		})
		.from(teams);
});

const getTeamSchema = z.object({
	id: z.nanoid(),
});
export const getTeam = createServerFn({ method: 'GET' })
	.validator(getTeamSchema)
	.handler(async ({ data }) => {
		await requirePermission({ team: ['read'] });
		return await getDb()
			.select({
				id: teams.id,
				name: teams.name,
				homeConten: teams.homeContent,
				homeContentMetadata: teams.homeContentMetadata,
				defaultCalendarId: teams.defaultCalendarId,
			})
			.from(teams)
			.where(eq(teams.id, data.id));
	});

const insertQuickLinkSchema = quickLinkInsertSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	updatedBy: true,
	createdBy: true,
});
export const insertQuickLink = createServerFn({ method: 'POST' })
	.validator(insertQuickLinkSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ quickLink: ['create'] });
		const today = new Date();
		return getDb()
			.insert(quickLinks)
			.values({
				...data,
				createdBy: session.user.id,
				updatedBy: session.user.id,
				createdAt: today,
				updatedAt: today,
			})
			.returning({
				id: quickLinks.id,
				title: quickLinks.title,
				url: quickLinks.url,
				active: quickLinks.active,
			});
	});

const updateQuickLinkSchema = z.object({
	id: z.number(),
	values: quickLinkUpdateSchema.omit({
		id: true,
		createdAt: true,
		createdBy: true,
		updatedAt: true,
		updatedBy: true,
	}),
});
export const updateQuickLink = createServerFn({ method: 'POST' })
	.validator(updateQuickLinkSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ quickLink: ['update'] });
		const today = new Date();
		return await getDb()
			.update(quickLinks)
			.set({ ...data.values, updatedBy: session.user.id, updatedAt: today })
			.where(eq(quickLinks.id, data.id))
			.returning({
				id: quickLinks.id,
				title: quickLinks.title,
				url: quickLinks.url,
				active: quickLinks.active,
			});
	});

const deleteQuickLinkSchema = z.object({
	id: z.number(),
});
export const deleteQuickLink = createServerFn({ method: 'GET' })
	.validator(deleteQuickLinkSchema)
	.handler(async ({ data }) => {
		await requirePermission({ quickLink: ['delete'] });
		return await getDb()
			.delete(quickLinks)
			.where(eq(quickLinks.id, data.id))
			.returning({
				id: quickLinks.id,
				title: quickLinks.title,
				url: quickLinks.url,
				active: quickLinks.active,
			});
	});

const getQuickLinksSchema = z
	.object({
		status: z.literal(['active', 'inactive', 'all']).default('all'),
	})
	.default({ status: 'all' });
export const getQuickLinks = createServerFn({ method: 'GET' })
	.validator(getQuickLinksSchema)
	.handler(async ({ data }) => {
		await requirePermission({ quickLink: ['read'] });
		const query = getDb()
			.select({
				id: quickLinks.id,
				title: quickLinks.title,
				url: quickLinks.url,
				active: quickLinks.active,
			})
			.from(quickLinks);

		switch (data.status) {
			case 'all':
				return await query;
			case 'active':
				return await query.where(eq(quickLinks.active, true));
			case 'inactive':
				return await query.where(eq(quickLinks.active, false));
		}
	});

const insertTeamQuickLinkSchema = teamQuickLinkInsertSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	updatedBy: true,
	createdBy: true,
});
export const insertTeamQuickLink = createServerFn({ method: 'POST' })
	.validator(insertTeamQuickLinkSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ teamQuickLink: ['create'] });
		const today = new Date();
		return getDb()
			.insert(teamQuickLinks)
			.values({
				...data,
				createdBy: session.user.id,
				updatedBy: session.user.id,
				createdAt: today,
				updatedAt: today,
			})
			.returning({
				id: teamQuickLinks.id,
				title: teamQuickLinks.title,
				url: teamQuickLinks.url,
				active: teamQuickLinks.active,
				teamId: teamQuickLinks.teamId,
			});
	});

const updateTeamQuickLinkSchema = z.object({
	id: z.number(),
	values: teamQuickLinkUpdateSchema.omit({
		id: true,
		createdAt: true,
		createdBy: true,
		updatedAt: true,
		updatedBy: true,
	}),
});
export const updateTeamQuickLink = createServerFn({ method: 'POST' })
	.validator(updateTeamQuickLinkSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ quickLink: ['update'] });
		const today = new Date();
		return await getDb()
			.update(teamQuickLinks)
			.set({ ...data.values, updatedBy: session.user.id, updatedAt: today })
			.where(eq(teamQuickLinks.id, data.id))
			.returning({
				id: teamQuickLinks.id,
				title: teamQuickLinks.title,
				url: teamQuickLinks.url,
				active: teamQuickLinks.active,
				teamId: teamQuickLinks.teamId,
			});
	});

const deleteTeamQuickLinkSchema = z.object({
	id: z.number(),
});
export const deleteTeamQuickLink = createServerFn({ method: 'GET' })
	.validator(deleteTeamQuickLinkSchema)
	.handler(async ({ data }) => {
		await requirePermission({ quickLink: ['delete'] });
		return await getDb()
			.delete(teamQuickLinks)
			.where(eq(teamQuickLinks.id, data.id))
			.returning({
				id: teamQuickLinks.id,
				title: teamQuickLinks.title,
				url: teamQuickLinks.url,
				active: teamQuickLinks.active,
				teamId: teamQuickLinks.teamId,
			});
	});

const getTeamQuickLinksSchema = z
	.object({
		status: z.literal(['active', 'inactive', 'all']).default('all'),
	})
	.default({ status: 'all' });
export const getTeamQuickLinks = createServerFn({ method: 'GET' })
	.validator(getTeamQuickLinksSchema)
	.handler(async ({ data }) => {
		await requirePermission({ quickLink: ['read'] });
		const query = getDb()
			.select({
				id: teamQuickLinks.id,
				title: teamQuickLinks.title,
				url: teamQuickLinks.url,
				active: teamQuickLinks.active,
				teamId: teamQuickLinks.teamId,
			})
			.from(teamQuickLinks);

		switch (data.status) {
			case 'all':
				return await query;
			case 'active':
				return await query.where(eq(teamQuickLinks.active, true));
			case 'inactive':
				return await query.where(eq(teamQuickLinks.active, false));
		}
	});

const insertTeamPageSchema = teamPageInsertSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	updatedBy: true,
	createdBy: true,
});
export const insertTeamPage = createServerFn({ method: 'POST' })
	.validator(insertTeamPageSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ teamPage: ['create'] });
		const today = new Date();
		return getDb()
			.insert(teamPages)
			.values({
				...data,
				createdBy: session.user.id,
				updatedBy: session.user.id,
				createdAt: today,
				updatedAt: today,
			})
			.returning({
				id: teamPages.id,
				title: teamPages.title,
				teamId: teamPages.teamId,
				sequenceNumber: teamPages.sequenceNumber,
			});
	});

const updateTeamPageSchema = z.object({
	id: z.number(),
	values: teamPageUpdateSchema.omit({
		id: true,
		createdAt: true,
		createdBy: true,
		updatedAt: true,
		updatedBy: true,
	}),
});
export const updateTeamPage = createServerFn({ method: 'POST' })
	.validator(updateTeamPageSchema)
	.handler(async ({ data }) => {
		const session = await requirePermission({ quickLink: ['update'] });
		const today = new Date();
		return await getDb()
			.update(teamPages)
			.set({ ...data.values, updatedBy: session.user.id, updatedAt: today })
			.where(eq(teamPages.id, data.id))
			.returning({
				id: teamPages.id,
				title: teamPages.title,
				teamId: teamPages.teamId,
				sequenceNumber: teamPages.sequenceNumber,
			});
	});

const deleteTeamPageSchema = z.object({
	id: z.number(),
});
export const deleteTeamPage = createServerFn({ method: 'GET' })
	.validator(deleteTeamPageSchema)
	.handler(async ({ data }) => {
		await requirePermission({ teamPage: ['delete'] });
		return await getDb()
			.delete(teamPages)
			.where(eq(teamPages.id, data.id))
			.returning({
				id: teamPages.id,
				title: teamPages.title,
				teamId: teamPages.teamId,
				sequenceNumber: teamPages.sequenceNumber,
			});
	});

const getTeamPagesSchema = z.object({
	teamId: z.nanoid(),
});
export const getTeamPages = createServerFn({ method: 'GET' })
	.validator(getTeamPagesSchema)
	.handler(async ({ data }) => {
		await requirePermission({ teamPage: ['read'] });
		return await getDb()
			.select({
				id: teamPages.id,
				title: teamPages.title,
				active: teamPages.active,
				teamId: teamPages.teamId,
			})
			.from(teamPages)
			.where(eq(teamPages.teamId, data.teamId));
	});

const getTeamPageSchema = z.object({
	teamId: z.nanoid(),
	id: z.number(),
});
export const getTeamPage = createServerFn({ method: 'GET' })
	.validator(getTeamPageSchema)
	.handler(async ({ data }) => {
		await requirePermission({ teamPage: ['read'] });
		return await getDb()
			.select({
				id: teamPages.id,
				teamId: teamPages.teamId,
				title: teamPages.title,
				sequenceNumber: teamPages.sequenceNumber,
				content: teamPages.content,
				contentMetadata: teamPages.contentMetadata,
				active: teamPages.active,
			})
			.from(teamPages)
			.where(and(eq(teamPages.teamId, data.teamId), eq(teamPages.id, data.id)));
	});
