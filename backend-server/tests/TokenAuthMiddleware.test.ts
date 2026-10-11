import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mocked } from 'vitest';
import TokenAuthMiddleware from "../src/middlewares/TokenAuthMiddleware.js";
import type { Request, Response, NextFunction } from "express";
import type SessionRepository from "../src/repositories/SessionRepository.js";
import type AuthService from "../src/services/AuthService.js";
import type { Session } from "../src/types/dbSchema.js";
import { ApplicationError } from "../src/utils/ApplicationError.js";

// Add custom properties to Request type for testing
interface CustomRequest extends Request {
    sessionId?: string;
    accessToken?: string;
}

describe("TokenAuthMiddleware", () => {
    let sessionRepository: Mocked<SessionRepository>;
    let authService: Mocked<AuthService>;
    let tokenAuthMiddleware: TokenAuthMiddleware;
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        sessionRepository = {
            findActiveSessionById: vi.fn(),
            revokeSessionById: vi.fn(),
            updateSessionById: vi.fn(),
            createSession: vi.fn(),
        } as unknown as Mocked<SessionRepository>;

        authService = {
            refreshTokens: vi.fn(),
            waitForNewToken: vi.fn(),
            exchangeCode: vi.fn(),
        } as unknown as Mocked<AuthService>;

        tokenAuthMiddleware = new TokenAuthMiddleware(sessionRepository, authService);

        req = {
            cookies: {}
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        next = vi.fn();
    });

    describe("checkToken", () => {
        it("should successfully authenticate with valid, non-expired tokens", async () => {
            const mockSessionId = "session_12345";
            req.cookies = { sessionToken: mockSessionId };

            const validSession: Session = {
                sessionId: mockSessionId,
                accessToken: "access_token_123",
                refreshToken: "refresh_token_123",
                accessTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
                refreshTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                isRevoked: false,
                tokenType: "Bearer",
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 4320 * 60 * 1000),
            };

            sessionRepository.findActiveSessionById.mockResolvedValue(validSession);

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(sessionRepository.findActiveSessionById).toHaveBeenCalledWith(mockSessionId);
            expect(req.sessionId).toBe(validSession.sessionId);
            expect(req.accessToken).toBe(validSession.accessToken);
            expect(next).toHaveBeenCalled();
            expect(authService.refreshTokens).not.toHaveBeenCalled();
        });

        it("should fail when sessionToken cookie is missing", async () => {
            req.cookies = {};

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Unauthorized",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should fail when sessionToken does not start with 'session_'", async () => {
            req.cookies = { sessionToken: "invalid_format_token" };

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Invalid session token",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should fail when session is not found in database", async () => {
            const mockSessionId = "session_not_found";
            req.cookies = { sessionToken: mockSessionId };

            sessionRepository.findActiveSessionById.mockResolvedValue(null);

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Session does not exist",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should revoke session and fail when refresh token is expired", async () => {
            const mockSessionId = "session_expired_refresh";
            req.cookies = { sessionToken: mockSessionId };

            const expiredSession: Session = {
                sessionId: mockSessionId,
                accessToken: "access_token_123",
                refreshToken: "refresh_token_123",
                accessTokenExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                refreshTokenExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                isRevoked: false,
                tokenType: "Bearer",
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 4320 * 60 * 1000),
            };

            sessionRepository.findActiveSessionById.mockResolvedValue(expiredSession);
            sessionRepository.revokeSessionById.mockResolvedValue(true);

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(sessionRepository.revokeSessionById).toHaveBeenCalledWith(mockSessionId);
            expect(authService.refreshTokens).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Session expired",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should fail with 500 if revoking an expired refresh token session fails", async () => {
            const mockSessionId = "session_expired_refresh_fail";
            req.cookies = { sessionToken: mockSessionId };

            const expiredSession: Session = {
                sessionId: mockSessionId,
                accessToken: "access_token_123",
                refreshToken: "refresh_token_123",
                accessTokenExpiry: new Date(Date.now() - 60 * 60 * 1000),
                refreshTokenExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000),
                isRevoked: false,
                tokenType: "Bearer",
                createdAt: new Date(),
                expiresAt: new Date(),
            };

            sessionRepository.findActiveSessionById.mockResolvedValue(expiredSession);
            // Simulating failure to revoke by returning false
            sessionRepository.revokeSessionById.mockResolvedValue(false as any);

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(sessionRepository.revokeSessionById).toHaveBeenCalledWith(mockSessionId);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Failed to revoke session",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should refresh token if access token is expired but refresh token is valid (including locking scenario)", async () => {
            const mockSessionId = "session_expired_access";
            req.cookies = { sessionToken: mockSessionId };

            const sessionWithExpiredAccess: Session = {
                sessionId: mockSessionId,
                accessToken: "expired_access_token",
                refreshToken: "valid_refresh_token",
                accessTokenExpiry: new Date(Date.now() - 20000), // Expired 20 seconds ago
                refreshTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
                isRevoked: false,
                tokenType: "Bearer",
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 4320 * 60 * 1000),
            };

            const refreshedSession: Session = {
                ...sessionWithExpiredAccess,
                accessToken: "new_access_token",
                accessTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // Valid for 1 hour
            };

            sessionRepository.findActiveSessionById.mockResolvedValue(sessionWithExpiredAccess);
            
            // authService.refreshTokens handles the lock logic internally (acquires lock, refreshes or waits for lock)
            // Here we verify the middleware properly delegates to it and consumes the successfully refreshed session
            authService.refreshTokens.mockResolvedValue(refreshedSession);

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(authService.refreshTokens).toHaveBeenCalledWith(mockSessionId, "valid_refresh_token");
            expect(req.sessionId).toBe(refreshedSession.sessionId);
            expect(req.accessToken).toBe(refreshedSession.accessToken);
            expect(next).toHaveBeenCalled();
        });

        it("should fail if authService.refreshTokens fails during the locking/refresh scenario", async () => {
            const mockSessionId = "session_expired_access_fail";
            req.cookies = { sessionToken: mockSessionId };

            const sessionWithExpiredAccess: Session = {
                sessionId: mockSessionId,
                accessToken: "expired_access_token",
                refreshToken: "valid_refresh_token",
                accessTokenExpiry: new Date(Date.now() - 20000), // Expired 20 seconds ago
                refreshTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isRevoked: false,
                tokenType: "Bearer",
                createdAt: new Date(),
                expiresAt: new Date(),
            };

            sessionRepository.findActiveSessionById.mockResolvedValue(sessionWithExpiredAccess);
            
            // Simulating a failure during token refresh (e.g., timeout waiting for lock, or auth server error)
            authService.refreshTokens.mockRejectedValue(new ApplicationError(500, "Token refresh timed out"));

            await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

            expect(authService.refreshTokens).toHaveBeenCalledWith(mockSessionId, "valid_refresh_token");
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Token refresh timed out",
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
