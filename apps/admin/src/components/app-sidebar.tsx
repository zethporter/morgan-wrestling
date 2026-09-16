import { authClient } from '@morgan-wrestling/auth/lib/auth-client';
import {
	type PermissionRequest,
	toRole,
} from '@morgan-wrestling/auth/permissions';
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

// Declared outside `linkOptions`, which infers its argument as `const` and
// would otherwise make the action arrays readonly — `checkRolePermission`
// wants mutable ones.
const MANAGE_USERS: PermissionRequest = { user: ['list'] };

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
		permissions: MANAGE_USERS,
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
	const { data: session } = authClient.useSession();
	useHotkey('Control+B', () => toggleSidebar(), {
		conflictBehavior: 'replace',
	});

	// Cosmetic only — `checkRolePermission` resolves locally against the shared
	// access control, so it costs no round trip, but the route's `beforeLoad`
	// and the server fns are what actually enforce this.
	const role = toRole(session?.user.role);
	const visibleItems = sidebarItems.filter(
		(item) =>
			!('permissions' in item) ||
			authClient.admin.checkRolePermission({
				role,
				permissions: item.permissions,
			}),
	);

	return (
		<Sidebar variant='sidebar' collapsible='icon'>
			<SidebarHeader>
				<AppSidebarTrigger />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Something that makes sense</SidebarGroupLabel>
					<SidebarMenu>
						{visibleItems.map(({ to, label, icon, activeProps }) => (
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
