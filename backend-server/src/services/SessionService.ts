// ------------- Imports ---------------
import { strictCheck } from "../utils/ApplicationError.js";
import type SessionRepository from "../repositories/SessionRepository.js";
import type AuthService from "./AuthService.js";
import type { Session } from "../types/dbSchema.js";

// ------------- SessionService ---------------
export default class SessionService {
	private sessionRepository: SessionRepository;
	private authService: AuthService;

	constructor(sessionRepository: SessionRepository, authService: AuthService) {
		this.sessionRepository = sessionRepository;
		this.authService = authService;
	}

	/**
	 * Validates a session token string, handles expiration and token refresh
	 * 
	 * Inorder Flow:
	 * - Check and validate session token prefix
	 * - Retrieve active session from MongoDB
	 * - Check if refresh token is expired and revoke if necessary
	 * - Check if access token is expired and rotate if necessary
	 * - Return the valid session object
	 */
	public async validateSessionToken(token: string): Promise<Session> {
		strictCheck(token, 401, "Unauthorized");
		strictCheck(token.startsWith("session_"), 401, "Invalid session token");

		let session: Session = strictCheck(
			await this.sessionRepository.findActiveSessionById(token),
			401,
			"Session does not exist"
		);

		if (new Date(session.refreshTokenExpiry).getTime() < Date.now()) {
			strictCheck(
				await this.sessionRepository.revokeSessionById(session.sessionId),
				500,
				"Failed to revoke session"
			);
			strictCheck(false, 401, "Session expired");
		}

		if (new Date(session.accessTokenExpiry).getTime() - 10000 < Date.now()) {
			session = await this.authService.refreshTokens(session.sessionId, session.refreshToken);
		}

		return session;
	}
}
