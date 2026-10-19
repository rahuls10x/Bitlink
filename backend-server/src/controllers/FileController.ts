import type FileService from "../services/FileService.js";
import type { StandardResponse } from "../types/index.js";
import type { AppSocket } from "../types/socketTypes.js";
import { socketErrorHandling, strictCheck } from "../utils/ApplicationError.js";
import { deleteFileSchema, renameFileSchema, requestDownloadSchema, viewFilesInputSchema, type DeleteFileInput, type RenameFileInput, type RequestDownloadInput, type ViewFilesInput } from "../utils/ValidationSchema.js";

export default class FileController{
    private fileService:FileService

    constructor(fileService:FileService){
        this.fileService = fileService;
    }

    /**
     * Handles the request to view files
     * 
     * Inorder Flow:
     * - Validate request data and userId
     * - Fetch files from FileService
     * - Structure and send response
     */
    async viewFiles(socket: AppSocket,data: ViewFilesInput, callback: (response: StandardResponse) => void){
        try {
            const status = viewFilesInputSchema.safeParse(data);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            const userId = strictCheck(socket.data.userId, 500, "User Id not found in connection");

            const files = await this.fileService.viewFiles(validatedData, userId);

            callback({
                success: true,
                message: "Files has been fetched successfully",
                data: files
            });
        } catch (error) {socketErrorHandling(error, callback)}
    }

    /**
     * Handles the request to download file
     * 
     * Inorder Flow:
     * - Validate request data and userId
     * - Fetch donwload information
     * - Structure and send response
     */
    async requestingToDownload(socket:AppSocket, data:RequestDownloadInput, callback: (response: StandardResponse) => void){
        try {
            const status = requestDownloadSchema.safeParse(data);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            const userId = strictCheck(socket.data.userId, 500, "User Id not found in connection");

            const downloadInfo = await this.fileService.requestingToDownload(validatedData.fileId, userId);

            callback({
                success: true,
                message: "Permission to Download is granted",
                data: {
                    signedUrl: downloadInfo.signedUrl,
                    expiresAt: downloadInfo.expiresAt
                }
            });
        } catch (error) {socketErrorHandling(error, callback)}
    }

    /**
     * Handles the request to rename file
     * 
     * Inorder Flow:
     * - Validate request data and userId
     * - Rename the file
     * - Structure and send response
     */
    async renameFile(socket:AppSocket, data:RenameFileInput, callback: (response: StandardResponse) => void){
        try {
            const status = renameFileSchema.safeParse(data);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            const userId = strictCheck(socket.data.userId, 500, "User Id not found in connection");

            await this.fileService.renameFile(validatedData, userId);

            callback({
                success: true,
                message: "File has been renamed successfully",
            });
        } catch (error) {socketErrorHandling(error, callback)}
    }

    /**
     * Handles the request to delete file
     * 
     * Inorder Flow:
     * - Validate request data and userId
     * - Delete the file
     * - Structure and send response
     */
    async deleteFile(socket:AppSocket, data:DeleteFileInput, callback: (response: StandardResponse) => void){
        try{
            const status = deleteFileSchema.safeParse(data);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            const userId = strictCheck(socket.data.userId, 500, "User Id not found in connection");

            await this.fileService.deleteFile(validatedData, userId);

            callback({
                success: true,
                message: "File has been deleted successfully"
            });
        }catch (error){
            socketErrorHandling(error, callback);
        }
    }
}