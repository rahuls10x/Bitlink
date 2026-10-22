import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { generateCodeVerifier, generateState, sha256Base64Url } from "@/utils/utils";
import type { User } from "@/types";
import { API_ROUTES } from "@/config/routes";

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: User | null;
	login: () => Promise<void>;
	logout: () => Promise<void>;
	checkSession: () => Promise<boolean>;
	handleCallback: (code: string, state: string) => Promise<boolean>;
	registerBeforeLogout: (callback: () => void | Promise<void>) => () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { setItem, getItem, removeItem } = useSessionStorage();
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const beforeLogoutCallbacks = useRef<Set<() => void | Promise<void>>>(new Set());

	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
	const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:4000/authorize";
	const clientId = import.meta.env.VITE_CLIENT_ID || "";
	const redirectUri = import.meta.env.VITE_REDIRECT_URI || "http://localhost:5174/callback";

	const registerBeforeLogout = useCallback((callback: () => void | Promise<void>) => {
		beforeLogoutCallbacks.current.add(callback);
		return () => {
			beforeLogoutCallbacks.current.delete(callback);
		};
	}, []);

	// Check existing session on mount using sample protected route
	useEffect(() => {
		checkSession();
	}, [apiUrl]);

	const checkSession = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`${apiUrl}${API_ROUTES.me}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			const result = (await response.json()) as {
				success: boolean;
				message?: string;
				data?: User;
				error?: string;
			};

			if (result.success && result.message) {
				if (result.data) {
					setUser(result.data);
				}
				setIsAuthenticated(true);
				return true;
			}

			setUser(null);
			setIsAuthenticated(false);
			return false;
		} catch (error) {
			console.debug("No active session found:", error);
			setUser(null);
			setIsAuthenticated(false);
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [apiUrl]);

	const login = useCallback(async () => {
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await sha256Base64Url(codeVerifier);
		const state = generateState();
		const scope = "name email";
		const responseType = "code";
		const challengeMethod = "S256";

		// Save state for after the redirect
		setItem("oauth_state", state);
		setItem("code_verifier", codeVerifier);

		const authRedirectUrl = new URL(authUrl);
		authRedirectUrl.searchParams.append("client_id", clientId);
		authRedirectUrl.searchParams.append("redirect_uri", redirectUri);
		authRedirectUrl.searchParams.append("response_type", responseType);
		authRedirectUrl.searchParams.append("state", state);
		authRedirectUrl.searchParams.append("scope", scope);
		authRedirectUrl.searchParams.append("challenge_method", challengeMethod);
		authRedirectUrl.searchParams.append("code_challenge", codeChallenge);

		window.location.href = authRedirectUrl.toString().replace(/\+/g, "%20");
	}, [authUrl, clientId, redirectUri, setItem]);

	const logout = useCallback(async () => {
		try {
			// Execute all registered beforeLogout callbacks (e.g. disconnect websocket)
			for (const callback of beforeLogoutCallbacks.current) {
				try {
					await callback();
				} catch (cbError) {
					console.error("[Auth] Error executing beforeLogout hook:", cbError);
				}
			}

			// Send logout request to backend server
			await fetch(`${apiUrl}${API_ROUTES.logout}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});
		} catch (error) {
			console.error("[Auth] Logout request failed:", error);
		} finally {
			setIsAuthenticated(false);
			setUser(null);
			removeItem("oauth_state");
			removeItem("code_verifier");
		}
	}, [apiUrl, removeItem]);

	const handleCallback = useCallback(
		async (code: string, state: string): Promise<boolean> => {
			try {
				setIsLoading(true);
				const savedState = getItem("oauth_state");
				const codeVerifier = getItem("code_verifier");

				if (!savedState || savedState !== state) {
					throw new Error("Invalid OAuth state: possible CSRF attempt");
				}

				if (!codeVerifier) {
					throw new Error("Missing PKCE code verifier");
				}

				// Backend confidential exchange
				const response = await fetch(apiUrl + API_ROUTES.token, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						code,
						code_verifier: codeVerifier,
					}),
				});

				const result = (await response.json()) as {
					success: boolean;
					message?: string;
					data?: User;
					error?: string;
				};

				if (!response.ok || !result.success || !result.message) {
					throw new Error(result.error || "Token exchange failed");
				}

				if (result.data) {
					setUser(result.data);
				}

				// Cleanup
				removeItem("oauth_state");
				removeItem("code_verifier");

				setIsAuthenticated(true);

				return true;
			} catch (error) {
				console.error("Authentication callback failed:", error);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[apiUrl, getItem, removeItem],
	);

	const value = useMemo(
		() => ({
			isAuthenticated: !!user || isAuthenticated,
			isLoading,
			user,
			login,
			logout,
			handleCallback,
			checkSession,
			registerBeforeLogout,
		}),
		[user, isAuthenticated, isLoading, login, logout, handleCallback, checkSession, registerBeforeLogout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
}
