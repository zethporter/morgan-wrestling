import { Button } from '@morgan-wrestling/ui/components/ui/button';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from '@morgan-wrestling/ui/components/ui/sidebar';
import { Link } from '@tanstack/react-router';
import { FileTextIcon, HomeIcon, LinkIcon, PlusIcon } from 'lucide-react';

type TeamPage = {
	id: number;
	title: string;
};

type TeamSidebarProps = {
	teamId: string;
	pages: TeamPage[];
	onAddPage?: () => void;
	onEditQuickLinks?: () => void;
};

export function TeamSidebar({
	teamId,
	pages,
	onAddPage,
	onEditQuickLinks,
}: TeamSidebarProps) {
	return (
		<Sidebar collapsible='none' className='bg-sidebar/50'>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={
								<Link
									to='/teams/$teamId'
									params={{ teamId }}
									activeOptions={{ exact: true }}
									activeProps={{ 'data-active': true }}
								>
									<HomeIcon />
									<span>Home</span>
								</Link>
							}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Pages</SidebarGroupLabel>
					<SidebarMenu>
						{pages.length === 0 && (
							<p className='px-2 py-1 text-sm text-muted-foreground'>
								No pages yet.
							</p>
						)}
						{pages.map((page) => (
							<SidebarMenuItem key={page.id}>
								<SidebarMenuButton
									render={
										<Link
											to='/teams/$teamId/pages/$pageId'
											params={{ teamId, pageId: String(page.id) }}
											activeProps={{ 'data-active': true }}
										>
											<FileTextIcon />
											<span>{page.title}</span>
										</Link>
									}
								/>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarSeparator className='mx-0' />
				<Button variant='ghost' className='justify-start' onClick={onAddPage}>
					<PlusIcon />
					Add Page
				</Button>
				<Button
					variant='ghost'
					className='justify-start'
					onClick={onEditQuickLinks}
				>
					<LinkIcon />
					Edit Quick Links
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
