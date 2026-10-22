import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";
import { APP_NAME } from "@/lib/constants";
import { APP_ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { 
	CheckCircle2, 
	ShieldCheck, 
	Key, 
	Terminal, 
	Layers, 
	FolderGit2, 
	ArrowRight, 
	Play 
} from "lucide-react";

export default function DashboardPage() {
	const { user } = useAuth();
	const { files } = useFiles();
	const [apiResponse, setApiResponse] = useState<unknown | null>(null);
	const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
	const [apiError, setApiError] = useState<string | null>(null);

	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";

	const userInitials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "AU";

	const handleTestProtectedApi = async () => {
		try {
			setIsLoadingApi(true);
			setApiError(null);
			setApiResponse(null);

			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};

			const response = await fetch(`${apiUrl}/api/example/protected`, {
				method: "GET",
				headers,
				credentials: "include",
			});

			const data = await response.json();
			setApiResponse(data);
		} catch (error) {
			setApiError(error instanceof Error ? error.message : "Failed to call protected API");
		} finally {
			setIsLoadingApi(false);
		}
	};

	return (
		<div className="space-y-6 max-w-6xl mx-auto pb-12">
			{/* Header Greeting */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-slate-900">
						Welcome back, {user?.name?.split(" ")[0] || "User"}
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						{APP_NAME} Cloud Storage — OAuth 2.0 PKCE secured microservice dashboard.
					</p>
				</div>
				<Link to={APP_ROUTES.files}>
					<Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs">
						<FolderGit2 className="size-4" />
						<span>Open My Files</span>
						<ArrowRight className="size-4" />
					</Button>
				</Link>
			</div>

			{/* Status & Identity Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="rounded-2xl border-slate-200/80 shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
							Storage Files
						</CardTitle>
						<FolderGit2 className="size-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-slate-900">{files.length}</div>
						<p className="text-xs text-slate-500 mt-1">Uploaded in root folder</p>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-slate-200/80 shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
							Auth Status
						</CardTitle>
						<ShieldCheck className="size-4 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold flex items-center gap-2 text-emerald-600">
							<CheckCircle2 className="size-5" /> Active
						</div>
						<p className="text-xs text-slate-500 mt-1">PKCE S256 Verified</p>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-slate-200/80 shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
							User Account
						</CardTitle>
						<Key className="size-4 text-slate-600" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2.5">
							<Avatar className="size-8 rounded-lg shrink-0">
								{user?.avatar && <AvatarImage src={user.avatar} alt={user.name || "User"} />}
								<AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs">
									{userInitials}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<div className="text-sm font-semibold truncate text-slate-900">
									{user?.name || "Authenticated User"}
								</div>
								<p className="text-xs text-slate-500 truncate">{user?.email || "user@example.com"}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-slate-200/80 shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
							Architecture
						</CardTitle>
						<Layers className="size-4 text-slate-600" />
					</CardHeader>
					<CardContent>
						<div className="text-base font-semibold text-slate-900">Microservice Client</div>
						<p className="text-xs text-slate-500 mt-1">MinIO S3 &bull; WebSockets</p>
					</CardContent>
				</Card>
			</div>

			{/* Interactive Backend Verification Section */}
			<Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
				<CardHeader className="border-b border-slate-100 bg-slate-50/50">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
								<Terminal className="size-4 text-blue-600" />
								Test Protected Microservice Route
							</CardTitle>
							<CardDescription className="text-xs mt-1 text-slate-500">
								Verify communication between the frontend client and backend microservice with secure session authentication.
							</CardDescription>
						</div>
						<Button 
							onClick={handleTestProtectedApi} 
							disabled={isLoadingApi} 
							size="sm"
							className="rounded-xl gap-2 bg-slate-900 hover:bg-slate-800 text-white shrink-0 cursor-pointer"
						>
							{isLoadingApi ? <Spinner className="size-3.5" /> : <Play className="size-3.5" />}
							Send Request
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-2">
						<div className="text-slate-500 font-semibold">Endpoint: GET /api/example/protected</div>
						{isLoadingApi && (
							<div className="flex items-center gap-2 text-slate-400 py-3">
								<Spinner className="size-4" /> Requesting data from server...
							</div>
						)}
						{apiError && (
							<div className="text-rose-400 font-sans py-2">
								<strong>Error:</strong> {apiError}
							</div>
						)}
						{apiResponse !== null && (
							<pre className="text-xs overflow-x-auto text-emerald-400 pt-2 border-t border-slate-800">
								{JSON.stringify(apiResponse, null, 2)}
							</pre>
						)}
						{!isLoadingApi && !apiError && !apiResponse && (
							<div className="text-slate-500 italic py-2">Click "Send Request" to test live API communication.</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
