import type FileController from "../controllers/FileController.js";
import type UploadController from "../controllers/UploadController.js";
import type { StandardResponse } from "../types/index.js";
import type { AppSocket } from "../types/socketTypes.js";
import type { DeleteFileInput, RenameFileInput, RequestDownloadInput, RequestUploadInput, UploadAcknowlegementInput, ViewFilesInput } from "../utils/ValidationSchema.js";

export function JoinSocketRooms(socket: AppSocket) {
    const roomId = `room_${socket.data.userId}`;
    socket.data.roomId = roomId;

    socket.join(roomId);
}

export function SocketRoutes(socket: AppSocket, uploadController: UploadController, fileController: FileController) {
    
    socket.on("requestingToUpload", (data: RequestUploadInput, callback:(response: StandardResponse) => void) => {
        uploadController.requestingUpload(socket, data, callback);
    });

    socket.on("uploadSuccess", (data: UploadAcknowlegementInput, callback:(response: StandardResponse) => void) => {
        uploadController.uploadSuccess(socket, data, callback);
    });

    socket.on("uploadFailed", (data: UploadAcknowlegementInput, callback:(response: StandardResponse) => void) => {
        uploadController.uploadFailed(socket, data, callback);
    });

    socket.on("viewFiles", (data: ViewFilesInput, callback:(response: StandardResponse) => void) => {
        fileController.viewFiles(socket, data, callback);
    });

    socket.on("requestingToDownload", (data: RequestDownloadInput, callback:(response: StandardResponse) => void) => {
        fileController.requestingToDownload(socket, data, callback);
    });

    socket.on("renameFile", (data: RenameFileInput, callback:(response: StandardResponse) => void) => {
        fileController.renameFile(socket, data, callback);
    });

    socket.on("deleteFile", (data: DeleteFileInput, callback:(response: StandardResponse) => void) => {
        fileController.deleteFile(socket, data, callback);
    });

	socket.on("disconnect", reason => {
		console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
	});
}
