import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@morgan-wrestling/ui/components/ui/avatar.js';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarRail,
	useSidebar,
} from '@morgan-wrestling/ui/components/ui/sidebar';
import { useHotkey } from '@tanstack/react-hotkeys';

export function AppSidebar() {
	const { open, toggleSidebar } = useSidebar();
	useHotkey('Control+B', () => toggleSidebar(), {
		conflictBehavior: 'replace',
	});
	return (
		<Sidebar variant='sidebar'>
			<SidebarHeader></SidebarHeader>
			<SidebarContent>
				<SidebarGroup />
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter>
				<Avatar>
					<AvatarImage src={''} />
					<AvatarFallback>ZP</AvatarFallback>
				</Avatar>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
