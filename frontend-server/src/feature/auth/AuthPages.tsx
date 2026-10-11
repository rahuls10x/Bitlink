import TruthLogo from "@/assets/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { HardDrive, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { APP_CATEGORY, APP_NAME } from "@/lib/constants";

// Shared layout wrapper
interface AuthInterfaceProps {
	title: string;
	description: string;
	children: ReactNode;
	footer?: ReactNode;
}

function Grow({ children }: { children?: ReactNode }) {
	return <div className="grow">{children}</div>;
}

function AuthInterface({ title, description, children, footer }: AuthInterfaceProps) {
	return (
		<main className="flex bg-[url('/backgrounds/authPageBackground.png')] bg-no-repeat bg-cover h-dvh items-center justify-center p-4">
			<div className="max-w-md w-14/15 md:max-w-none md:h-9/10 h-14/15 md:max-h-none outline-1 bg-background overflow-y-hidden rounded-2xl flex p-2 gap-2">
				<div className="bg-[url('/backgrounds/authPageBackground.png')] w-1/2 bg-no-repeat bg-fixed bg-cover rounded-2xl p-8 md:flex md:flex-col hidden ">
					<h1 className="text-xl font-heading font-semibold text-muted">── Secure {APP_CATEGORY} Provider</h1>
					<Grow />
					<p className="font-text text-background">
						<span className="xl:text-6xl lg:text-4xl md:text-3xl font-bold block xl:w-9/10 lg:w-8/10">
							We value your <span className="bg-clip-text bg-linear-to-r from-background to-primary/80  text-transparent">Privacy</span>{" "}
							above all
						</span>{" "}
						<br />
						<br />
						<span className="xl:text-xl lg:text-base md:text-xs">No unauthorized data ever leaves our ecosystem.</span>
					</p>
					<p className="font-text italic text-background xl:text-base lg:text-sm md:text-xs">
						It's all Open-Source -{" "}
						<a href="#" className="underline font-link">
							Github
						</a>
					</p>
				</div>
				<div className="md:w-1/2 w-full h-full flex flex-col items-center overflow-hidden">
					<div className="flex min-h-8 mt-4 gap-1.5 bg-clip-text bg-linear-to-r from-primary to-primary/70 text-transparent">
						<span className="text-lg font-heading font-extrabold">{APP_NAME}</span>
						<HardDrive className="w-6 h-6 text-primary mt-0.5" />
					</div>
					<Grow />
					<Card className="w-full max-w-sm md:max-w-md bg-transparent ring-0 overflow-y-scroll scrollbar-none">
						<CardHeader>
							<CardTitle className="font-heading font-semibold text-center text-2xl">{title}</CardTitle>
							<CardDescription className="text-center md:text-md text-base font-subheading font-light">{description}</CardDescription>
						</CardHeader>
						<CardContent className="bg-transparent lg:w-4/5 lg:m-auto m-1.5">{children}</CardContent>
					</Card>
					<Grow />
					<div className="mb-4 min-h-10 p-2">{footer}</div>
				</div>
			</div>
		</main>
	);
}

// Login Page
export default function LoginPage() {
	const { login, checkSession } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		checkSession()
			.then((status) => {
				if(status) navigate(APP_ROUTES.dashboard, { replace: true });
			})
			.catch((error) => {
				console.log(error);
			})
	}, [ checkSession, navigate]);

	return (
		<AuthInterface
			title={`Welcome back, User`}
			description="Sign in with our secure authentication service"
			footer={
				<span>
					Need an account?{" "}
					<a className="font-medium text-foreground underline-offset-4 hover:underline" href="#">
						Sign up
					</a>
				</span>
			}
		>
			<div className="outline-none outline-red-800 flex items-center justify-center">
				<Button className="p-4" onClick={login}>Sign in with Truth <TruthLogo /></Button>
			</div>
		</AuthInterface>
	);
}

// Callback Page
export function CallbackPage() {
	const { handleCallback } = useAuth();
	const navigate = useNavigate();
	const [errorMessage, setErrorMessage] = useState<string | null>(() => {
		if (typeof window === "undefined") return null;
		const urlParams = new URLSearchParams(window.location.search);
		const error = urlParams.get("error");
		const errorDescription = urlParams.get("error_description");
		if (error) {
			return errorDescription || error || "Authentication error returned by provider";
		}
		const code = urlParams.get("code");
		const state = urlParams.get("state");
		if (!code || !state) {
			return "Missing authorization code or state in callback parameters";
		}
		return null;
	});
	const hasRunRef = useRef(false);

	useEffect(() => {
		if (hasRunRef.current || errorMessage) return;
		hasRunRef.current = true;

		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get("code");
		const state = urlParams.get("state");

		if (!code || !state) return;

		handleCallback(code, state)
			.then(() => {
				navigate(APP_ROUTES.dashboard, { replace: true });
			})
			.catch((err) => {
				setErrorMessage(err instanceof Error ? err.message : "Authentication exchange failed");
			});
	}, [errorMessage, handleCallback, navigate]);

	if (errorMessage) {
		return (
			<AuthInterface
				title="Authentication Failed"
				description="An error occurred while completing the sign-in process"
				footer={
					<Button variant="outline" onClick={() => navigate(APP_ROUTES.login)}>
						Back to Login
					</Button>
				}
			>
				<div className="flex flex-col items-center gap-3 text-center text-destructive/70 p-4 bg-transparent rounded-lg">
					<AlertCircle className="size-8" />
					<p className="text-sm font-medium">{errorMessage}</p>
				</div>
			</AuthInterface>
		);
	}

	return (
		<AuthInterface
			title="Authenticating"
			description="Exchanging authorization code and establishing session..."
			footer={
				<span>
					Taking too long?{" "}
					<a className="font-medium text-foreground underline hover:underline" href={APP_ROUTES.login}>
						Back to Login
					</a>
				</span>
			}
		>
			<div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
				<Spinner className="size-8 text-primary" />
				<p className="text-sm text-muted-foreground font-subheading animate-pulse">
					Completing PKCE token exchange...
				</p>
			</div>
		</AuthInterface>
	);
}


