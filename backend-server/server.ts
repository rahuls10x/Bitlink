// ------------- Imports ---------------
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import AuthService from "./src/services/AuthService.js";
import SessionService from "./src/services/SessionService.js";
import AuthController from "./src/controllers/AuthController.js";
import TokenAuthMiddleware from "./src/middlewares/TokenAuthMiddleware.js";
import ValidationMiddlewares from "./src/middlewares/ValidationMiddlewares.js";
import SocketService from "./src/services/SocketService.js";
import { MongoClient } from "mongodb";
import SessionRepository from "./src/repositories/SessionRepository.js";
import { createClient } from "redis";
import TokenRepository from "./src/repositories/TokenRepository.js";

// ------------- Configuration ---------------
config({ path: ".env" });
const app = express();
// Wrap Express in HTTP server to share the TCP listener and port with Socket.io
const httpServer = http.createServer(app);
const port = process.env.PORT || 4001;
const authServerUrl = process.env.AUTH_SERVER_URL || "http://localhost:4000";
const clientId = process.env.CLIENT_ID || "";
const clientSecret = process.env.CLIENT_SECRET || "";
const originUrl = process.env.ORIGIN_URL || "http://localhost:5173";


app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: originUrl,
		credentials: true,
	})
);

async function boot() {
	try {
		// ------------- Database Connection ---------------
        const mongoConnection = await MongoClient.connect(process.env["MONGO_DB"] ?? "");
        const mongoDb = mongoConnection.db("bitlink");
        console.log("MongoDB Connected Successfully");

		const redisConnection = createClient({ url: process.env["REDIS_DB"] ?? ""});
        await redisConnection.connect();
        console.log("Redis Connected Successfully");

		// ------------- Instances ---------------
        const sessionRepository = new SessionRepository(mongoDb);
		const tokenRepository = new TokenRepository(redisConnection);

		const authService = new AuthService(authServerUrl, clientId, clientSecret, sessionRepository, tokenRepository);
		const sessionService = new SessionService(sessionRepository, authService);

		const authController = new AuthController(authService);

		const authMiddleware = new TokenAuthMiddleware(sessionService);
		const validationMiddleware = new ValidationMiddlewares();

		// ------------- WebSocket Service Initialization ---------------
		new SocketService(httpServer, originUrl, sessionService);


		// ------------- Routes ---------------
		app.get("/health", (_req, res) => {
			res.status(200).json({
				success: true,
				message: "Bitlink is healthy",
				data: { timestamp: new Date().toISOString() },
			});
		});

		// Auth Routes
		app.post("/api/auth/token", validationMiddleware.validateTokenize, authController.exchangeToken);
		app.get("/api/auth/me", authMiddleware.checkToken, authController.me);

		// Sample Protected Route
		app.get("/api/example/protected", authMiddleware.checkToken, (req, res) => {
			res.status(200).json({
				success: true,
				message: "Protected Bitlink endpoint accessed successfully",
				data: {
					sessionId: req.sessionId,
					accessToken: req.accessToken,
					timestamp: new Date().toISOString(),
				},
			});
		});

		// Root fallback
		app.get("/", (_req, res) => {
			res.send("Bitlink Backend is Running!");
		});

		// ------------- Server Start ---------------
		httpServer.listen(port, () => {
			console.log(`Backend server listening on port ${port}`);
		});

		// ------------- Shutdown ---------------
		process.on("SIGINT", () => {
			httpServer.close(() => {
				console.log("Server stopped gracefully");
				process.exit(0);
			});
		});

		process.on("SIGTERM", () => {
			httpServer.close(() => {
				console.log("Server stopped gracefully");
				process.exit(0);
			});
		});
	} catch (error) {
		console.error("Error during server startup:", error);
		process.exit(1);
	}
};

boot();

