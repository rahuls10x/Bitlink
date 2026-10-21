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
import { MongoClient } from "mongodb";
import SessionRepository from "./src/repositories/SessionRepository.js";
import { createClient } from "redis";
import TokenRepository from "./src/repositories/TokenRepository.js";
import UploadController from "./src/controllers/UploadController.js";
import UploadService from "./src/services/UploadService.js";
import UploadRepository from "./src/repositories/UploadRepository.js";
import BucketRepository from "./src/repositories/BucketRepository.js";
import { S3Client } from "@aws-sdk/client-s3";
import FileRepository from "./src/repositories/FileRepository.js";
import { Server } from "socket.io";
import type { AppSocket } from "./src/types/socketTypes.js";
import { SocketRoutes , JoinSocketRooms} from "./src/routes/socket.js";
import FileService from "./src/services/FileService.js";
import FileController from "./src/controllers/FileController.js";

// ------------- Configuration ---------------
config({ path: ".env" });

const port = process.env.PORT || 4001;
const authServerUrl = process.env.AUTH_SERVER_URL || "http://localhost:4000";
const clientId = process.env.CLIENT_ID || "";
const clientSecret = process.env.CLIENT_SECRET || "";
const originUrl = process.env.ORIGIN_URL || "http://localhost:5173";
const bucketName = process.env["S3_BUCKET_NAME"] ?? "bitlink-bucket";

const app = express();
// Wrap Express in HTTP server to share the TCP listener and port with Socket.io
const httpServer = http.createServer(app);
const socketIo = new Server(httpServer, {
	cors: {
		origin: originUrl,
		credentials: true,
	},
});

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

		const s3Client = new S3Client({
			endpoint: process.env["S3_ENDPOINT"] ?? "http://localhost:9000",
			region: process.env["S3_REGION"] ?? "us-east-1",
			credentials: {
				accessKeyId: process.env["S3_ACCESS_KEY_ID"] ?? "root",
				secretAccessKey: process.env["S3_SECRET_ACCESS_KEY"] ?? "rootpass",
			},
			forcePathStyle: true,
		});
		// ------------- Instances ---------------
        const sessionRepository = new SessionRepository(mongoDb);
		const tokenRepository = new TokenRepository(redisConnection);
		const uploadRepository = new UploadRepository(mongoDb, redisConnection);
		const bucketRepository = new BucketRepository(s3Client, bucketName);
		const fileRepository = new FileRepository(mongoDb);

		const authService = new AuthService(authServerUrl, clientId, clientSecret, sessionRepository, tokenRepository);
		const sessionService = new SessionService(sessionRepository, authService);
		const uploadService = new UploadService(bucketRepository, uploadRepository, fileRepository);
		const fileService = new FileService(fileRepository, bucketRepository);

		const authController = new AuthController(authService);
		const uploadController = new UploadController(uploadService);
		const fileController = new FileController(fileService);

		const authMiddleware = new TokenAuthMiddleware(sessionService);
		const validationMiddleware = new ValidationMiddlewares();

		// ------------- WebsocketEvents --------------
		socketIo.use((socket, next) => authMiddleware.checkSocketToken(socket, next));

		socketIo.on("connection", (socket: AppSocket) => {
			console.log(`[WebSocket] Client connected: ${socket.id} (Session: ${socket.data.sessionId}) (User: ${socket.data.userId})`);

			JoinSocketRooms(socket);
			SocketRoutes(socket, uploadController, fileController);
		});

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

