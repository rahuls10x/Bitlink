import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import UploadModal from "@/components/UploadModal";
import {
	LogOut,
	Cloud,
	Upload,
	FolderGit2,
	LayoutDashboard,
	ChevronsUpDown,
} from "lucide-react";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useFiles } from "@/contexts/FileContext";
import { APP_NAME } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	DropdownMenuGroup,
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
	const { disconnect } = useSocket();
	const { openUploadModal } = useFiles();
	const navigate = useNavigate();
	const location = useLocation();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		if (isLoggingOut) return;
		try {
			setIsLoggingOut(true);
			disconnect();
			await logout();
			navigate(APP_ROUTES.login);
		} catch (error) {
			console.error("[Dashboard] Logout failed:", error);
			navigate(APP_ROUTES.login);
		} finally {
			setIsLoggingOut(false);
		}
	};

	const userInitials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "AU";

	const isFilesPage = location.pathname.startsWith(APP_ROUTES.files);
	const isDashboardPage = location.pathname === APP_ROUTES.dashboard;

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon" className="border-r border-slate-200 bg-slate-50/50">
				{/* Sidebar Header: Brand / Logo */}
				<SidebarHeader className="pt-4 pb-2">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								size="lg"
								render={<Link to={APP_ROUTES.dashboard} />}
								tooltip={APP_NAME}
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
							>
								<div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
									<Cloud className="size-5" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
									<span className="truncate font-heading font-bold text-base text-slate-900">{APP_NAME}</span>
									<span className="truncate text-[11px] text-slate-500 font-medium">
										Cloud Storage
									</span>
								</div>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				{/* Sidebar Content: Prominent Upload Button */}
				<SidebarContent className="p-3 gap-2">
					<div className="group-data-[collapsible=icon]:hidden px-1 py-2">
						<button
							onClick={openUploadModal}
							className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm py-2.5 px-4 rounded-xl border border-slate-200/80 shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
						>
							<Upload className="size-4 text-blue-600" />
							<span>Upload</span>
						</button>
					</div>

					<SidebarGroup className="p-0 mt-2">
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to={APP_ROUTES.dashboard} />}
									isActive={isDashboardPage}
									tooltip="Dashboard"
									size="default"
									className="font-medium group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
								>
									<LayoutDashboard className="size-4 text-blue-600 shrink-0" />
									<span>Dashboard</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to={APP_ROUTES.files} />}
									isActive={isFilesPage}
									tooltip="My Files"
									size="default"
									className="font-medium group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
								>
									<FolderGit2 className="size-4 text-blue-600 shrink-0" />
									<span>My Files</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>

				{/* Sidebar Footer: User Profile & Logout */}
				<SidebarFooter className="pb-4">
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
									<Avatar className="size-8 rounded-lg shrink-0">
										{user?.avatar && <AvatarImage src={user.avatar} alt={user?.name || "User"} />}
										<AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
											{userInitials}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
										<span className="truncate font-semibold text-slate-800">{user?.name || "Authenticated User"}</span>
										<span className="truncate text-xs text-slate-500">
											{user?.email || "user@example.com"}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto size-4 text-slate-400 group-data-[collapsible=icon]:hidden" />
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-(--anchor-width) min-w-56 rounded-lg"
									side="top"
									align="start"
									sideOffset={4}
								>
									<DropdownMenuGroup>
										<DropdownMenuLabel className="p-0 font-normal">
											<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
												<Avatar className="size-8 rounded-lg">
													{user?.avatar && <AvatarImage src={user.avatar} alt={user?.name || "User"} />}
													<AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
														{userInitials}
													</AvatarFallback>
												</Avatar>
												<div className="grid flex-1 text-left text-sm leading-tight">
													<span className="truncate font-semibold text-slate-800">{user?.name || "Authenticated User"}</span>
													<span className="truncate text-xs text-slate-500">
														{user?.email || "user@example.com"}
													</span>
												</div>
											</div>
										</DropdownMenuLabel>
									</DropdownMenuGroup>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer text-destructive focus:text-destructive">
										<LogOut className="size-4 mr-2" />
										<span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>

				<SidebarRail />
			</Sidebar>

			{/* Top Navbar + Content Inset */}
			<SidebarInset className="overflow-hidden flex flex-col h-screen bg-white">
				{/* Top Header / Navbar */}
				<header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-6">
					{/* Left: Trigger + Breadcrumbs */}
					<div className="flex items-center gap-3 min-w-0">
						<SidebarTrigger className="-ml-1 text-slate-600 hover:text-slate-900" />
						<Separator orientation="vertical" className="h-4 bg-slate-200" />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink render={<Link to={APP_ROUTES.dashboard} />} className="text-slate-600 hover:text-slate-900">
										{APP_NAME}
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="text-slate-400" />
								<BreadcrumbItem>
									<BreadcrumbPage className="font-semibold text-slate-900">
										{isFilesPage ? "My Files" : "Dashboard"}
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>

					{/* Right Navbar: Profile Avatar Dropdown */}
					<div className="flex items-center gap-3">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer" />
								}
							>
								<Avatar className="size-9 rounded-full border border-slate-200">
									{user?.avatar && <AvatarImage src={user.avatar} alt={user?.name || "User"} />}
									<AvatarFallback className="rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
										{userInitials}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-slate-200">
								<DropdownMenuGroup>
									<DropdownMenuLabel className="font-normal p-3">
										<p className="font-semibold text-slate-800 text-sm truncate">{user?.name || "Authenticated User"}</p>
										<p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || "user@example.com"}</p>
									</DropdownMenuLabel>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer text-destructive focus:text-destructive py-2.5">
									<LogOut className="size-4 mr-2" />
									<span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
					<Outlet />
				</main>
			</SidebarInset>

			<UploadModal />
		</SidebarProvider>
	);
}

