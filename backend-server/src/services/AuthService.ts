// ------------- Imports ---------------
import { strictCheck } from "../utils/ApplicationError.js";
import type { AuthTokens, UserResource } from "../types/index.js";
import CryptoService from "./CryptoService.js";
import type { Session } from "../types/dbSchema.js";
import type SessionRepository from "../repositories/SessionRepository.js";
import type TokenRepository from "../repositories/TokenRepository.js";

// ------------- AuthService ---------------
export default class AuthService {
	private authServerUrl: string;
	private resourceServerUrl: string;
	private clientId: string;
	private clientSecret: string;
	private sessionRepository: SessionRepository;
	private tokenRepository: TokenRepository;

	constructor(authServerUrl: string, resourceServerUrl: string, clientId: string, clientSecret: string, sessionRepository: SessionRepository, tokenRepository:TokenRepository) {
		this.authServerUrl = authServerUrl || "http://localhost:4000";
		this.resourceServerUrl = resourceServerUrl || "http://localhost:5000";
		this.clientId = clientId || "";
		this.clientSecret = clientSecret ||  "";
		this.sessionRepository = sessionRepository;
		this.tokenRepository = tokenRepository;
	}

	/**
	 * Fetches the User Resource from Resource Server
	 * 
	 * Inorder Flow:
	 * - Send GET request to /resource endpoint of Resource Server
	 * - Parse and assert successful response payload
	 * - Return User Resource
	 */
	public async fetchUserResource(accessToken:string): Promise<UserResource>{
		const response = await fetch(`${this.resourceServerUrl}/resource`, {
			method: "GET",
			headers: { 
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`},
		});

		const result = (await response.json()) as { success: boolean; data?: UserResource; error?: string; message?: string };
		strictCheck(response.ok || result.success || result.data, response.status || 400, result.error || "Failed to exchange authorization code");
		const userResource = strictCheck(result.data, 500, "User resource data is missing");

		return userResource;
	}

	/**
	 * Exchanges authorization code and PKCE code_verifier for Access and Refresh tokens
	 *
	 * Inorder Flow:
	 * - Send POST request to /tokenize endpoint of Truth Auth Server
	 * - Parse and assert successful response payload
	 * - Create Session Payload
	 * - Store Session Payload
	 * - Fetch User Resource
	 * - Return Session Id + User Resource
	 */
	public async exchangeCode(code: string, codeVerifier: string): Promise<{sessionId:string} & UserResource> {
		const response = await fetch(`${this.authServerUrl}/tokenize`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
				code_verifier: codeVerifier,
			}),
		});

		const result = (await response.json()) as { success: boolean; data?: AuthTokens; error?: string; message?: string };
		strictCheck(response.ok || result.success || result.data, response.status || 400, result.error || "Failed to exchange authorization code");
		const tokenData = strictCheck(result.data, 500, "Token response data is missing");

		const sessionId = CryptoService.generateSessionId();
        const sessionObject:Session = {
            sessionId,
			userId:tokenData.user_id,
            isRevoked:false,
			accessToken:tokenData.access_token,
			refreshToken:tokenData.refresh_token || "",
			accessTokenExpiry:new Date(Date.now() + tokenData.expires_in),
			refreshTokenExpiry:new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			tokenType:tokenData.token_type,
            createdAt:new Date(),
            expiresAt:new Date(Date.now() + 4320 * 60 * 1000),
        }

        strictCheck(await this.sessionRepository.createSession(sessionObject), 500, "Internal Server Error");

		const userResource = await this.fetchUserResource(sessionObject.accessToken);

        return {sessionId, ...userResource};
	}

	/**
	 * Waits for lock to be released
	 * 
	 * Inorder Flow:
	 * - create wait time configuration
	 * - keep retrying until lock is released or timeout
	 * - - Wait for polling interval
	 * - - Check if access token has been refreshed
	 * - - Check if lock has been released if yes then check if access token has been refreshed
	 * - Upon timeout return
	 */
	public async waitForNewToken(sessionId:string, lockKey: string): Promise<Session> {
		const maxWaitMs = 8000;
		const pollIntervalMs = 200;
		const startTime = Date.now();

		while (Date.now() - startTime < maxWaitMs) {
			await new Promise((res) => setTimeout(res, pollIntervalMs));

			const session = await this.sessionRepository.findActiveSessionById(sessionId);
			if (session && new Date(session.accessTokenExpiry).getTime() - 10000 > Date.now()) return session;

			const lockActive = await this.tokenRepository.getLockForRefreshTokenUpdate(lockKey);
			if (!lockActive) {
			const sessionCheckAfterLockRemoved = await this.sessionRepository.findActiveSessionById(sessionId);
			if (sessionCheckAfterLockRemoved && new Date(sessionCheckAfterLockRemoved.accessTokenExpiry).getTime() - 10000 > Date.now()) return sessionCheckAfterLockRemoved;
			}
		}

		strictCheck(false, 500, "Token refresh timed out");
		return {} as Session;
	}

	/**
	 * Refreshes an expired tokens using the refresh token
	 *
	 * Inorder Flow:
	 * - Create lock and acquire it
	 * - If acquired then 
	 * - - send request to refresh endpoint 
	 * - - parse and assert successful response
	 * - - update token in db and return the updated session
	 * - - disable lock and pass the error if any
	 * - Make the rest of request until lock is released
	 */
	public async refreshTokens(sessionId: string, refreshToken: string ): Promise<Session> {
		const lockKey = `lock:refresh:${sessionId}`;
		const lockId = CryptoService.generateLockId();
		const lockTTL = 10;
		const acquired = await this.tokenRepository.setLockForRefreshTokenUpdate(lockKey, lockId, lockTTL);
		
		if(acquired){
			try {
				const response = await fetch(`${this.authServerUrl}/refresh`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						refresh_token: refreshToken,
						client_id: this.clientId,
						client_secret: this.clientSecret,
					}),
				});
	
				const result = (await response.json()) as { success: boolean; data?: AuthTokens; error?: string; message?: string };
				strictCheck(result.success || result.data, response.status || 400, result.error || "Failed to refresh token");
				const tokenData = strictCheck(result.data, 500, "Refreshed token data is missing");
				
				const updateObject = {
					accessToken: tokenData.access_token,
					refreshToken: tokenData.refresh_token || "",
					accessTokenExpiry: new Date(Date.now() + tokenData.expires_in),
					refreshTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					tokenType: tokenData.token_type,
				};
				strictCheck(await this.sessionRepository.updateSessionById(sessionId, updateObject), 500, "Failed to update session");
				return strictCheck(await this.sessionRepository.findActiveSessionById(sessionId), 401, "Failed to retrieve updated session");
			} finally {
				await this.tokenRepository.disableLockForRefreshTokenUpdate(lockKey, lockId);
			}
		}

		return await this.waitForNewToken(sessionId, lockKey);
	}

	/**
	 * logout an existing session
	 * 
	 * Inorder Flow:
	 * - revoke the session in db
	 */
	public async logout(sessionId: string) {

		strictCheck(await this.sessionRepository.revokeSessionById(sessionId), 500, "Failed to revoke session");

	}
}
