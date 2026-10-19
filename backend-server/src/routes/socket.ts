import type UploadController from "../controllers/UploadController.js";
import type { StandardResponse } from "../types/index.js";
import type { AppSocket } from "../types/socketTypes.js";
import type { RequestUploadInput, UploadAcknowlegementInput } from "../utils/ValidationSchema.js";

export default function SocketRoutes(socket: AppSocket, uploadController: UploadController) {
    console.log(`[WebSocket] Client connected: ${socket.id} (Session: ${socket.data.sessionId}) (User: ${socket.data.userId})`);

    socket.on("requestingToUpload", (data: RequestUploadInput, callback:(response: StandardResponse) => void) => {
        uploadController.requestingUpload(socket, data, callback);
    });

    socket.on("uploadSuccess", (data: UploadAcknowlegementInput, callback:(response: StandardResponse) => void) => {
        uploadController.uploadSuccess(socket, data, callback);
    });

    socket.on("uploadFailed", (data: UploadAcknowlegementInput, callback:(response: StandardResponse) => void) => {
        uploadController.uploadFailed(socket, data, callback);
    });

	socket.on("disconnect", reason => {
		console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
	});
}
