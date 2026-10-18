import type { RequestUploadInput } from "../utils/ValidationSchema.js";
import type BucketRepository from "../repositories/BucketRepository.js";
import CryptoService from "./CryptoService.js";
import { strictCheck } from "../utils/ApplicationError.js";
import type { FileUpload } from "../types/dbSchema.js";
import type UploadRepository from "../repositories/UploadRepository.js";

export default class UploadService{
    private bucketRepository:BucketRepository;
    private uploadRepository:UploadRepository;

    constructor(bucketRepository:BucketRepository, uploadRepository:UploadRepository){
        this.bucketRepository = bucketRepository;
        this.uploadRepository = uploadRepository;
    }

    /**
     * Requests to upload a file
     * 
     * InorderFlow
     * - Create a uploadId, fileId, expirySeconds and get Signed Upload Url with 5 min expiry
     * - Create Upload object and uploadId
     * - Store in Cache and Db
     * - Return the upload Information
     */
    async requestingToUpload(data: RequestUploadInput, userId:string):Promise<{signedUrl:string, uploadId:string, expiresAt:Date}>{
        const uploadId = CryptoService.generateUploadId();
        const fileId = CryptoService.generateFileId();
        const expirySeconds = 5 * 60;
        const signedUrl = strictCheck(await this.bucketRepository.getUploadSignedUrl(uploadId, data.mimeType, data.sizeBytes, expirySeconds), 500, "Failed to get upload signed url");

        const uploadObject: FileUpload = {
            uploadId: uploadId,
            userId: userId,
            fileName: data.fileName,
            mimeType: data.mimeType,
            sizeBytes: data.sizeBytes,
            fileId: fileId,
            parentId: "null",
            status: "pending",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + expirySeconds * 1000)
        };

        strictCheck(await this.uploadRepository.createFileUploadToken(uploadObject), 500, "Failed to create file upload record");
        strictCheck(await this.uploadRepository.cacheFileUploadToken(uploadId, uploadObject, expirySeconds), 500, "Failed to cache file upload token");

        return {
            signedUrl,
            uploadId,
            expiresAt: uploadObject.expiresAt
        }
    };

}