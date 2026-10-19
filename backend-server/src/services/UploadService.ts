import type { RequestUploadInput } from "../utils/ValidationSchema.js";
import type BucketRepository from "../repositories/BucketRepository.js";
import CryptoService from "./CryptoService.js";
import { strictCheck } from "../utils/ApplicationError.js";
import type { File, FileUpload } from "../types/dbSchema.js";
import type UploadRepository from "../repositories/UploadRepository.js";
import FileRepository from "../repositories/FileRepository.js";

export default class UploadService{
    private bucketRepository:BucketRepository;
    private uploadRepository:UploadRepository;
    private fileRepository:FileRepository;

    constructor(bucketRepository:BucketRepository, uploadRepository:UploadRepository, fileRepository:FileRepository){
        this.bucketRepository = bucketRepository;
        this.uploadRepository = uploadRepository;
        this.fileRepository = fileRepository;
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
        const signedUrl = strictCheck(await this.bucketRepository.getUploadSignedUrl(fileId, data.mimeType, data.sizeBytes, expirySeconds), 500, "Failed to get upload signed url");

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

    /**
     * Updates the status as failed and deletes the file from bucket
     * 
     * InorderFlow
     * - Retrieve and delete file upload token from cache
     * - If file upload token does not exist, retrieve and delete it from db else delete from db in background
     * - If file exists in bucket, delete it
     */
    async uploadFailed(uploadId: string):Promise<void>{
        let uploadObject = await this.uploadRepository.decacheAndRetrieveFileUploadToken(uploadId);

        if(!uploadObject){
            uploadObject = strictCheck(await this.uploadRepository.retrieveAndDeleteFileUploadToken(uploadId), 500, "Failed to retrieve file upload token");
        }else{
            this.uploadRepository.deleteFileUploadToken(uploadId); //background task
        }

        if(await this.bucketRepository.fileExists(uploadObject.fileId)) 
            strictCheck(await this.bucketRepository.deleteFile(uploadObject.fileId), 500, "Failed to delete file from bucket");
    }

    /**
     * Updates the file upload status as Success
     * 
     * InorderFlow
     * - Retrieve and delete file upload token from cache
     * - If file upload token does not exist, retrieve and delete it from db else delete from db in background
     * - Check file exists in bucket
     * - Create file object and store in db
     */
    async uploadSuccess(uploadId: string):Promise<void>{
        let uploadObject = await this.uploadRepository.decacheAndRetrieveFileUploadToken(uploadId);

        if(!uploadObject){
            uploadObject = strictCheck(await this.uploadRepository.retrieveAndDeleteFileUploadToken(uploadId), 500, "Failed to retrieve file upload token");
        }else{
            this.uploadRepository.deleteFileUploadToken(uploadId); //background task
        }

        strictCheck(await this.bucketRepository.fileExists(uploadObject.fileId), 500, "File does not exist");

        const fileObject:File = {
            fileId: uploadObject.fileId,
            fileName: uploadObject.fileName,
            userId: uploadObject.userId!,
            mimeType: uploadObject.mimeType,
            sizeBytes: uploadObject.sizeBytes,
            parentId: "null",
            createdAt: new Date(),
            modifiedAt: new Date()
        };
        strictCheck(await this.fileRepository.createNewFile(fileObject), 500, "Failed to create file");
        
    }

}