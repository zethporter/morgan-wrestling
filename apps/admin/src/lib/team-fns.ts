import {
	createServerValidate,
	getFormData,
	ServerValidateError,
} from '@tanstack/react-form-start';
import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db, teamInsertSchema, teams } from '#/db';
import { newTeamFormOpts } from '#/form-options/teams';

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

const createTeamServerValidate = createServerValidate({
	...newTeamFormOpts,
	onServerValidate: teamInsertSchema
		.omit({ id: true, normalizedName: true, defaultCalendarId: true })
		.extend({
			homeContent: z.string(),
			homeContentMetadata: z.string(),
		})
		.transform((data) => ({
			...data,
			id: nanoid(),
			normalizedName: normalizeName(data.name),
		})),
});

export const createTeam = createServerFn({ method: 'POST' })
	.validator((data: unknown) => {
		if (!(data instanceof FormData)) {
			throw new Error('Invalid data');
		}
		return data;
	})
	.handler(async ({ data }) => {
		try {
			const validatedData = await createTeamServerValidate(data);

			await db.insert(teams).values(validatedData);
			// return team;
		} catch (error) {
			if (error instanceof ServerValidateError) {
				return error.response;
			}
			setResponseStatus(500);
			return 'There was an internal error';
		}
	});

export const getFormDataFromServer = createServerFn({
	method: 'GET',
}).handler(async () => getFormData());

// need better error handling?? should probably add some created info and stuff on teams?
