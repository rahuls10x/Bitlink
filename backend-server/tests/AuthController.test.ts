import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mocked } from 'vitest';
import AuthController from "../src/controllers/AuthController.js";
import type { Request, Response } from "express";
import type AuthService from "../src/services/AuthService.js";
import { ApplicationError } from "../src/utils/ApplicationError.js";

describe("AuthController", () => {
    let authService: Mocked<AuthService>;
    let authController: AuthController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        authService = {
            exchangeCode: vi.fn(),
        } as unknown as Mocked<AuthService>;

        authController = new AuthController(authService);

        req = {
            body: {}
        };

        res = {
            cookie: vi.fn(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    describe("exchangeToken", () => {
        it("should successfully exchange token and set cookie", async () => {
            req.body = {
                code: "valid_code",
                code_verifier: "valid_verifier"
            };

            const mockSessionId = "session_12345";
            authService.exchangeCode.mockResolvedValue(mockSessionId);

            await authController.exchangeToken(req as Request, res as Response, vi.fn());

            expect(authService.exchangeCode).toHaveBeenCalledWith("valid_code", "valid_verifier");
            expect(res.cookie).toHaveBeenCalledWith("sessionToken", mockSessionId, {
                httpOnly: true,
                secure: process.env["NODE_ENV"] === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Authentication successful",
            });
        });

        it("should fail when authorization code is missing", async () => {
            req.body = {
                code_verifier: "valid_verifier"
            };

            await authController.exchangeToken(req as Request, res as Response, vi.fn());

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Authorization code is required",
            });
            expect(authService.exchangeCode).not.toHaveBeenCalled();
        });

        it("should fail when code verifier is missing", async () => {
            req.body = {
                code: "valid_code"
            };

            await authController.exchangeToken(req as Request, res as Response, vi.fn());

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Code verifier is required",
            });
            expect(authService.exchangeCode).not.toHaveBeenCalled();
        });

        it("should handle error thrown by authService", async () => {
            req.body = {
                code: "valid_code",
                code_verifier: "valid_verifier"
            };

            const errorMessage = "Failed to exchange authorization code";
            authService.exchangeCode.mockRejectedValue(new ApplicationError(400, errorMessage));

            await authController.exchangeToken(req as Request, res as Response, vi.fn());

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: errorMessage,
            });
        });

        it("should handle unexpected internal errors", async () => {
            req.body = {
                code: "valid_code",
                code_verifier: "valid_verifier"
            };

            authService.exchangeCode.mockRejectedValue(new Error("Unexpected error"));

            await authController.exchangeToken(req as Request, res as Response, vi.fn());

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: "Unexpected error",
            });
        });
    });
});

