import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { APP_ROUTES } from "@/config/routes";

export default function ProtectedRoute() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-background">
				<Spinner className="size-8 text-primary" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to={APP_ROUTES.login} replace />;
	}

	return <Outlet />;
}
