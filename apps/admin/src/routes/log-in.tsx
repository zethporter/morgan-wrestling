import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardTitle,
} from '@morgan-wrestling/ui/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';
import { useAppForm } from '@ui/hooks/use-form';
import { z } from 'zod';
import { authClient } from '@auth/lib/auth-client';

const loginSchema = z.object({
	username: z.email(),
	password: z.string().min(1, { error: 'Password is required' }),
});

const searchSchema = z.object({
	redirect: z.string().optional()
})

export const Route = createFileRoute('/log-in')({
	component: RouteComponent,
	validateSearch: searchSchema
});

function RouteComponent() {
	const { redirect } = Route.useSearch();
	const form = useAppForm({
		defaultValues: {
			username: '',
			password: '',
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email({
				email: value.username,
				password: value.password,
				callbackURL: redirect
			})
		},
	});

	return (
		<div className='w-full h-screen flex flex-col justify-center items-center'>
			<Card>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<CardTitle>Sign Up</CardTitle>
						<CardDescription>
							Please sign in to Edit the Morgan Wrestling page
						</CardDescription>
						<div className='flex gap-2 py-2 flex-col'>
							<form.AppField
								name='username'
								children={(field) => <field.FormInput placeholder='Email' />}
							/>
							<form.AppField
								name='password'
								children={(field) => (
									<field.FormInput placeholder='Password' type='password' />
								)}
							/>
						</div>
					</form>
				</CardContent>
				<form.AppForm>
					<CardFooter className='flex flex-col gap-2'>
						<form.SubmitButton
							className='w-full'
							onClick={() => form.handleSubmit()}
						>
							Log In
						</form.SubmitButton>
						<form.GoogleSignInButton onClick={async () => await authClient.signIn.social({
							provider: 'google',
							callbackURL: redirect
						})} />
					</CardFooter>
				</form.AppForm>
			</Card>
		</div>
	);
}
