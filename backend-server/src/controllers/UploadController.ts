import type UploadService from "../services/UploadService.js";
import type { StandardResponse } from "../types/index.js";
import { socketErrorHandling, strictCheck } from "../utils/ApplicationError.js";
import { requestUploadSchema, uploadAcknowlegementSchema, type RequestUploadInput, type UploadAcknowlegementInput } from "../utils/ValidationSchema.js";
import type { AppSocket } from "../types/socket.js";

export default class UploadController{
    private uploadService:UploadService;

    constructor(uploadService: UploadService){
        this.uploadService = uploadService;
    }

    /**
     * Handles the request to upload a file
     * 
     * Inorder Flow:
     * - Validate request data and userId
     * - Request upload Information from UploadService
     * - Structure and send response
     */
    async requestingUpload(socket: AppSocket, data: RequestUploadInput , callback: (response: StandardResponse) => void){
        try {
            const status = requestUploadSchema.safeParse(data)
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            const userId = strictCheck(socket.data.userId, 500, "User Id not found in connection");


            const uploadInformation = await this.uploadService.requestingToUpload(validatedData, userId);

            callback({
                success:true,
                message:"Permission to Upload is granted",
                data: {
                    uploadId: uploadInformation.uploadId,
                    signedUrl: uploadInformation.signedUrl,
                    expiresAt: uploadInformation.expiresAt
                }
            });
        } catch (error) {socketErrorHandling(error, callback)}
    }

    /**
     * Handles the request to upload failed
     * 
     * Inorder Flow:
     * - Validate request data
     * - Update the status and delete the file
     * - Structure and send response
     */
    async uploadFailed(_socket: AppSocket, data: UploadAcknowlegementInput, callback: (response: StandardResponse) => void ){
        try{
            const status = uploadAcknowlegementSchema.safeParse(data);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            
            await this.uploadService.uploadFailed(validatedData.uploadId);

            callback({
                success: true,
                message: "Upload has been cancelled successfully",
            })

        }catch(error){socketErrorHandling(error, callback)}
    }

    /**
     * Handles the request to upload Success
     * 
     * Inorder Flow:
     * - Validate request data
     * - Update the status
     * - Structure and send response
     */
    async uploadSuccess(_socket: AppSocket, data: UploadAcknowlegementInput, callback: (response: StandardResponse) => void ){
        try{
            const status = uploadAcknowlegementSchema.safeParse(data);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            
            await this.uploadService.uploadSuccess(validatedData.uploadId);

            callback({
                success: true,
                message: "File has been uploaded successfully",
            })
        }catch(error){socketErrorHandling(error, callback)}
    }
}