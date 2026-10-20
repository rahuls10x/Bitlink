import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage, { CallbackPage } from "./feature/auth/AuthPages";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardPage from "./feature/dashboard/DashboardPage";
import FilesPage from "./feature/files/FilesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { APP_ROUTES } from "./config/routes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { FileProvider } from "./contexts/FileContext";

function AppRoutes() {
	return (
		<Routes>
			<Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.login} replace />} />
			<Route path={APP_ROUTES.login} element={<LoginPage />} />
			<Route path={APP_ROUTES.callback} element={<CallbackPage />} />
			
			<Route element={<ProtectedRoute />}>
				<Route element={<DashboardLayout />}>
					<Route path={APP_ROUTES.dashboard} element={<DashboardPage />} />
					<Route path={APP_ROUTES.files} element={<FilesPage />} />
					<Route path="/dashboard/files" element={<Navigate to={APP_ROUTES.files} replace />} />
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
					<FileProvider>
						<BrowserRouter>
							<AppRoutes />
						</BrowserRouter>
					</FileProvider>
				</SocketProvider>
			</AuthProvider>
		</TooltipProvider>
	);
}

export default App;



