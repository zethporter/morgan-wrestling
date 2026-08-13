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
import { LogOutIcon } from 'lucide-react';

export const UserMenu = () => {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Avatar>
					<AvatarImage src={''} />
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
								Light
							</DropdownMenuItem>
							<DropdownMenuItem
								data-active={theme === 'dark'}
								onClick={() => setTheme('dark')}
							>
								Dark
							</DropdownMenuItem>
							<DropdownMenuItem
								data-active={theme === 'system'}
								onClick={() => setTheme('system')}
							>
								System
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<LogOutIcon /> Logout
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
