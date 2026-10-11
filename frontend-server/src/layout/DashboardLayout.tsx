import { Link, Outlet, useNavigate } from "react-router-dom";
import {
	LayoutDashboard,
	LogOut,
	ShieldCheck,
	ChevronsUpDown,
} from "lucide-react";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate(APP_ROUTES.login);
	};

	const userInitials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "AU";

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon">
				{/* Sidebar Header: Brand / Logo */}
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								size="lg"
								render={<Link to={APP_ROUTES.dashboard} />}
								tooltip={APP_NAME}
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
							>
								<div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
									<ShieldCheck className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
									<span className="truncate font-heading font-bold text-base">{APP_NAME}</span>
									<span className="truncate text-[11px] text-muted-foreground font-medium">
										OAuth 2.0 PKCE Template
									</span>
								</div>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				{/* Sidebar Content */}
				<SidebarContent className="p-2 gap-2">
					<SidebarGroup className="p-0">
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to={APP_ROUTES.dashboard} />}
									isActive
									tooltip="Overview"
									size="default"
									className="font-medium group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
								>
									<LayoutDashboard className="size-4 text-primary shrink-0" />
									<span>Overview</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>

				{/* Sidebar Footer: User Profile & Logout */}
				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<SidebarMenuButton
											size="lg"
											tooltip="User Account"
											className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
										/>
									}
								>
									<Avatar className="size-7 rounded-lg shrink-0">
										<AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-semibold">
											{userInitials}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
										<span className="truncate font-semibold">{user?.name || "Authenticated User"}</span>
										<span className="truncate text-xs text-muted-foreground">
											{user?.email || "user@example.com"}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-(--anchor-width) min-w-56 rounded-lg"
									side="top"
									align="start"
									sideOffset={4}
								>
									<DropdownMenuLabel className="p-0 font-normal">
										<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
											<Avatar className="size-8 rounded-lg">
												<AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-semibold">
													{userInitials}
												</AvatarFallback>
											</Avatar>
											<div className="grid flex-1 text-left text-sm leading-tight">
												<span className="truncate font-semibold">{user?.name || "Authenticated User"}</span>
												<span className="truncate text-xs text-muted-foreground">
													{user?.email || "user@example.com"}
												</span>
											</div>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
										<LogOut className="size-4 mr-2" />
										<span>Sign Out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>

				<SidebarRail />
			</Sidebar>

			{/* Top Navbar + Content Inset */}
			<SidebarInset className="overflow-hidden flex flex-col h-screen">
				{/* Top Header */}
				<header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4">
					{/* Left: Trigger + Breadcrumbs */}
					<div className="flex items-center gap-2 min-w-0">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 h-4" />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink render={<Link to={APP_ROUTES.dashboard} />}>
										{APP_NAME}
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Dashboard</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

