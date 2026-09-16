import { GoogleLogo } from "../icons/google-logo";
import { Button } from "../ui/button";

export const GoogleSignInButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<Button onClick={onClick} variant='outline' className='w-full'>
			<GoogleLogo className='mr-2 h-4 w-4' />
			Sign in with Google
		</Button>
	);
}
