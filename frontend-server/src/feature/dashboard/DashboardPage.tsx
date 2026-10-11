import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, ShieldCheck, Key, Terminal, RefreshCw, Layers } from "lucide-react";

export default function DashboardPage() {
	const { user } = useAuth();
	const [apiResponse, setApiResponse] = useState<unknown | null>(null);
	const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
	const [apiError, setApiError] = useState<string | null>(null);

	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";

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
		<div className="space-y-6 max-w-6xl mx-auto">
			{/* Header Greeting */}
			<div>
				<h1 className="text-3xl font-heading font-bold tracking-tight">
					Welcome to {APP_NAME}
				</h1>
				<p className="text-muted-foreground mt-1">
					Microservice template pre-configured with Truth OAuth 2.0 PKCE authentication.
				</p>
			</div>

			{/* Status & Identity Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Authentication State</CardTitle>
						<ShieldCheck className="size-4 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold flex items-center gap-2 text-emerald-600">
							<CheckCircle2 className="size-5" /> Authenticated
						</div>
						<p className="text-xs text-muted-foreground mt-1">PKCE S256 Handshake Verified</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">User Identity</CardTitle>
						<Key className="size-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-xl font-semibold truncate">{user?.name || "Authenticated User"}</div>
						<p className="text-xs text-muted-foreground mt-1 truncate">{user?.email || "user@example.com"}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Architecture Mode</CardTitle>
						<Layers className="size-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-xl font-semibold">Microservice Client</div>
						<p className="text-xs text-muted-foreground mt-1">Port 4001 (Backend) &bull; Port 4000 (Truth Auth)</p>
					</CardContent>
				</Card>
			</div>

			{/* Interactive Backend Verification Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-lg flex items-center gap-2">
								<Terminal className="size-5 text-primary" />
								Test Protected Microservice Route
							</CardTitle>
							<CardDescription className="mt-1">
								Verify communication between the frontend client and backend microservice with Bearer token authentication.
							</CardDescription>
						</div>
						<Button onClick={handleTestProtectedApi} disabled={isLoadingApi} className="gap-2">
							{isLoadingApi ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
							Send Request
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-muted p-4 rounded-lg font-mono text-sm">
						<div className="text-muted-foreground mb-2">Endpoint: GET /api/example/protected</div>
						{isLoadingApi && (
							<div className="flex items-center gap-2 text-muted-foreground py-4">
								<Spinner className="size-4" /> Requesting data...
							</div>
						)}
						{apiError && (
							<div className="text-destructive font-sans">
								<strong>Error:</strong> {apiError}
							</div>
						)}
						{apiResponse !== null && (
							<pre className="text-xs md:text-sm overflow-x-auto text-emerald-400 bg-neutral-950 p-4 rounded-md">
								{JSON.stringify(apiResponse, null, 2)}
							</pre>
						)}

						{!isLoadingApi && !apiError && !apiResponse && (
							<div className="text-muted-foreground italic">Click "Send Request" to test live API communication.</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
