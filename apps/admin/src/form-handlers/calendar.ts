import { AuthError } from '@auth/lib/auth';
import { calendarInsertSchema, calendars } from '@morgan-wrestling/db/schema';
import {
	createServerValidate,
	formOptions,
	getFormData,
	ServerValidateError,
} from '@tanstack/react-form-start';
import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { nanoid } from 'nanoid';
import { db } from '#/db';
import { ensureSession } from '#/lib/auth-fns';

export const newCalendarFormOptions = formOptions({
	defaultValues: {
		name: '',
		color: 'slate',
	},
});

export const newCalendarValidator = calendarInsertSchema.omit({
	id: true,
	createdAt: true,
	createdBy: true,
	updatedAt: true,
	updatedBy: true,
});

const newCalendarServerValidate = createServerValidate({
	...newCalendarFormOptions,
	onServerValidate: ({ value }) =>
		newCalendarValidator
			.transform((data) => ({ ...data, id: nanoid() }))
			.parse(value),
});

export const handleNewCalendarSubmit = createServerFn({ method: 'POST' })
	.validator((data: unknown) => {
		if (!(data instanceof FormData)) {
			throw new Error('Invalid form data');
		}
		return data;
	})
	.handler(async (ctx) => {
		try {
			const session = await ensureSession();
			const validatedData = await newCalendarServerValidate(ctx.data);
			const creationDate = new Date();
			validatedData.createdBy = session.user.email;
			validatedData.updatedBy = session.user.email;
			validatedData.createdAt = creationDate;
			validatedData.updatedAt = creationDate;

			await db.insert(calendars).values(validatedData);
		} catch (e) {
			if (e instanceof ServerValidateError) {
				return e.response;
			}
			if (e instanceof AuthError) {
				setResponseStatus(e.statusCode);
				return e.message;
			}
			setResponseStatus(500);
			return 'Unhandled Internal Error';
		}
		return 'Successfully created calendar';
	});

export const getCalendarFormDataFromServer = createServerFn({
	method: 'GET',
}).handler(async () => {
	return getFormData();
});
