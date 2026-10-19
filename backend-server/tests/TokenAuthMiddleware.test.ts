// ------------- Imports ---------------
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mocked } from 'vitest';
import TokenAuthMiddleware from "../src/middlewares/TokenAuthMiddleware.js";
import type { Request, Response, NextFunction } from "express";
import type SessionService from "../src/services/SessionService.js";
import type { Session } from "../src/types/dbSchema.js";
import { ApplicationError } from "../src/utils/ApplicationError.js";

interface CustomRequest extends Request {
    cookies: {
        sessionToken?: string;
    };
    sessionId?: string;
    accessToken?: string;
}

describe("TokenAuthMiddleware", () => {
    let sessionService: Mocked<SessionService>;
    let tokenAuthMiddleware: TokenAuthMiddleware;
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    const mockSessionId = "session_1234567890abcdef1234567890abcdef";
    const mockAccessToken = "at_1234567890abcdef1234567890abcdef1234567890abcdef";

    const mockActiveSession: Session = {
        sessionId: mockSessionId,
        userId: "user_1234567890abcdef1234567890abcdef",
        isRevoked: false,
        accessToken: mockAccessToken,
        refreshToken: "rt_1234567890abcdef",
        accessTokenExpiry: new Date(Date.now() + 3600 * 1000),
        refreshTokenExpiry: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        tokenType: "Bearer",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 4320 * 60 * 1000),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        sessionService = {
            validateSessionToken: vi.fn(),
        } as unknown as Mocked<SessionService>;

        tokenAuthMiddleware = new TokenAuthMiddleware(sessionService);

        req = {
            cookies: {
                sessionToken: mockSessionId,
            },
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        next = vi.fn();
    });

    it("should successfully validate session token and call next()", async () => {
        sessionService.validateSessionToken.mockResolvedValue(mockActiveSession);

        await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

        expect(sessionService.validateSessionToken).toHaveBeenCalledWith(mockSessionId);
        expect(req.sessionId).toBe(mockSessionId);
        expect(req.accessToken).toBe(mockAccessToken);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 401 if validation fails", async () => {
        sessionService.validateSessionToken.mockRejectedValue(new ApplicationError(401, "Unauthorized"));

        await tokenAuthMiddleware.checkToken(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Unauthorized",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
