import { authClient } from '@morgan-wrestling/auth/lib/auth-client';
import { useTheme } from '@morgan-wrestling/ui/components/theme-provider';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@morgan-wrestling/ui/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@morgan-wrestling/ui/components/ui/dropdown-menu';
import { useRouter } from '@tanstack/react-router';
import { LogOutIcon, MonitorIcon, MoonStarIcon, SunIcon } from 'lucide-react';

export const UserMenu = () => {
	const router = useRouter();
	const { data } = authClient.useSession();
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Avatar>
					<AvatarImage src={data?.user.image ?? ''} />
					<AvatarFallback>ZP</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem
								data-active={theme === 'light'}
								onClick={() => setTheme('light')}
							>
								<SunIcon />
								Light
							</DropdownMenuItem>
							<DropdownMenuItem
								data-active={theme === 'dark'}
								onClick={() => setTheme('dark')}
							>
								<MoonStarIcon />
								Dark
							</DropdownMenuItem>
							<DropdownMenuItem
								data-active={theme === 'system'}
								onClick={() => setTheme('system')}
							>
								<MonitorIcon />
								System
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={async () => {
							await authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										router.navigate({ to: '/log-in' }); // redirect to login page
									},
								},
							});
						}}
					>
						<LogOutIcon /> Logout
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
