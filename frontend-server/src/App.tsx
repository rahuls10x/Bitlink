import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage, { CallbackPage } from "./feature/auth/AuthPages";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardPage from "./feature/dashboard/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { APP_ROUTES } from "./config/routes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

function AppRoutes() {
	return (
		<Routes>
			<Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.login} replace />} />
			<Route path={APP_ROUTES.login} element={<LoginPage />} />
			<Route path={APP_ROUTES.callback} element={<CallbackPage />} />
			
			<Route element={<ProtectedRoute />}>
				<Route path={APP_ROUTES.dashboard} element={<DashboardLayout />}>
					<Route index element={<DashboardPage />} />
				</Route>
			</Route>

			<Route path="*" element={<Navigate to={APP_ROUTES.login} replace />} />
		</Routes>
	);
}

function App() {
	return (
		<TooltipProvider>
			<AuthProvider>
				<SocketProvider>
					<BrowserRouter>
						<AppRoutes />
					</BrowserRouter>
				</SocketProvider>
			</AuthProvider>
		</TooltipProvider>
	);
}

export default App;


