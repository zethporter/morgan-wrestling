import { eq } from '@morgan-wrestling/db/sql';
import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDb, teamInsertSchema, teams, teamUpdateSchema } from '#/db';
import { requirePermission } from './auth-fns';

// import { ensureSession } from "./auth-fns";

// export const createPost = createServerFn({ method: "POST" })
//   .inputValidator((data: { title: string }) => data)
//   .handler(async ({ data }) => {
//     const session = await ensureSession();
//     const post = await db.posts.create({
//       title: data.title,
//       authorId: session.user.id,
//     });

//     return post;
//   });

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
