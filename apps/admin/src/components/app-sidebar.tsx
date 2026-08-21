import { Kbd } from '@morgan-wrestling/ui/components/ui/kbd';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from '@morgan-wrestling/ui/components/ui/sidebar';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@morgan-wrestling/ui/components/ui/tooltip.js';
import { formatForDisplay, useHotkey } from '@tanstack/react-hotkeys';
import { Link, linkOptions } from '@tanstack/react-router';
import {
	BlocksIcon,
	CalendarDaysIcon,
	HomeIcon,
	SquareKanbanIcon,
    UsersRoundIcon,
} from 'lucide-react';
import { UserMenu } from './user-menu';

const sidebarItems = linkOptions([
	{
		label: 'Dashboard',
		icon: <SquareKanbanIcon />,
		to: '/',
		activeProps: { 'data-active': true },
	},
	{
		label: 'Home Content',
		icon: <HomeIcon />,
		to: '/home-page',
		activeProps: { 'data-active': true },
	},
	{
		label: 'Teams',
		icon: <BlocksIcon />,
		to: '/teams',
		activeProps: { 'data-active': true },
	},
	{
		label: 'Calendars',
		icon: <CalendarDaysIcon />,
		to: '/calendars',
		activeProps: { 'data-active': true },
	},
	{
		label: 'Users',
		icon: <UsersRoundIcon />,
		to: '/users',
		activeProps: { 'data-active': true },
	},
]);

const AppSidebarTrigger = () => {
	return (
		<Tooltip>
			<TooltipContent side='right'>
				Toggle Sidebar <Kbd>{formatForDisplay('Control+B')}</Kbd>
			</TooltipContent>
			<TooltipTrigger render={<SidebarTrigger />} />
		</Tooltip>
	);
};

export function AppSidebar() {
	const { toggleSidebar } = useSidebar();
	useHotkey('Control+B', () => toggleSidebar(), {
		conflictBehavior: 'replace',
	});
	return (
		<Sidebar variant='sidebar' collapsible='icon'>
			<SidebarHeader>
				<AppSidebarTrigger />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Something that makes sense</SidebarGroupLabel>
					<SidebarMenu>
						{sidebarItems.map(({ to, label, icon, activeProps }) => (
							<SidebarMenuButton
								key={to}
								tooltip={label}
								render={
									<Link to={to} activeProps={activeProps}>
										{icon} {label}
									</Link>
								}
							/>
						))}
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter>
				<UserMenu />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
