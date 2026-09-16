import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardTitle,
} from '@morgan-wrestling/ui/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className='w-full flex flex-col justify-center items-center'>
			<Card>
				<CardTitle>Sign Up</CardTitle>
				<CardContent>
					<form>
						<div className='flex flex-col gap-4'>
							<div className='flex flex-col gap-2'>
								<label htmlFor='name'>Name</label>
								<input id='name' name='name' type='text' />
							</div>
							<div className='flex flex-col gap-2'>
								<label htmlFor='email'>Email</label>
								<input id='email' name='email' type='email' />
							</div>
							<div className='flex flex-col gap-2'>
								<label htmlFor='password'>Password</label>
								<input id='password' name='password' type='password' />
							</div>
							<div className='flex flex-col gap-2'>
								<label htmlFor='confirmPassword'>Confirm Password</label>
								<input
									id='confirmPassword'
									name='confirmPassword'
									type='password'
								/>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
