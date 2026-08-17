import { AuthError } from '@auth/lib/auth';
import { calendarInsertSchema, calendars } from '@morgan-wrestling/db/schema';
import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { nanoid } from 'nanoid';
import { db } from '#/db';
import { ensureSession } from '#/lib/auth-fns';

export const newCalendarValidator = calendarInsertSchema.omit({
	id: true,
	createdAt: true,
	createdBy: true,
	updatedAt: true,
	updatedBy: true,
});

export const handleNewCalendarSubmit = createServerFn({ method: 'POST' })
	.validator((data: unknown) => {
		console.log({ data });
		const validatedData = newCalendarValidator.parse(data);
		return validatedData;
	})
	.handler(async ({ data }) => {
		try {
			console.log({ data });
			const session = await ensureSession();
			const creationDate = new Date();
			await db.insert(calendars).values({
				...data,
				id: nanoid(),
				createdBy: session.user.email,
				updatedBy: session.user.email,
				createdAt: creationDate,
				updatedAt: creationDate,
			});
		} catch (e) {
			console.error({ e });
			if (e instanceof AuthError) {
				setResponseStatus(e.statusCode);
				throw new Error(e.message);
			}
			setResponseStatus(500);
			throw new Error('Unhandled Internal Error');
		}
		return 'Successfully created calendar';
	});
