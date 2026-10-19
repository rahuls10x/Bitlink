import type { Db } from "mongodb"
import type { createClient } from "redis";
import type { FileUpload } from "../types/dbSchema.js";

export default class UploadRepository{

    private db: Db;
    private cache: ReturnType<typeof createClient>;

    constructor(db: Db, cache: ReturnType<typeof createClient>){
        this.db = db;
        this.cache = cache;
    }

    /**
     * Creates a file upload record in Db
     * 
     * Inorder Flow:
     * - Insert file upload document into fileUploads collection
     * - Return acknowledgment status
     */
    async createFileUploadToken(data:FileUpload): Promise<boolean>{
        const result = await this.db.collection<FileUpload>("fileUploads").insertOne(data);

        return result.acknowledged;
    }   

    /**
     * Caches a file upload token in Cache with TTL
     * 
     * Inorder Flow:
     * - Set stringified file upload data in Cache cache with EX option
     * - Return true if result is OK
     * 
     * @remarks
     * TTL is in seconds
     */
    async cacheFileUploadToken(fileUploadId:string,data:FileUpload, ttl:number): Promise<boolean>{
        const result = await this.cache.set(fileUploadId, JSON.stringify(data), {'EX': ttl});

        return result === 'OK';
    }

    /**
     * Deletes and retrieves file upload token from Cache
     * 
     * Inorder Flow:
     * - Delete file upload token from cache
     * - Return File upload token if success
     */
    async decacheAndRetrieveFileUploadToken(uploadId:string): Promise<FileUpload | null>{
        const result = await this.cache.getDel(uploadId);

        return result ? JSON.parse(result) : null;
    }

    /**
     * Retrieves and deletes a file upload token from db
     * 
     * Inorder Flow:
     * - Find and delete file upload token from fileUploads collection
     * - Return file upload token
     */
    async retrieveAndDeleteFileUploadToken(uploadId:string): Promise<FileUpload | null>{
        const result = await this.db.collection<FileUpload>("fileUploads").findOneAndDelete({uploadId:uploadId});
        
        return result;
    }

    /**
     * deletes a file upload token from db
     * 
     * Inorder Flow:
     * - delete file upload token from fileUploads
     * - Return true if success
     */
    async deleteFileUploadToken(uploadId:string): Promise<boolean>{
        const result = await this.db.collection<FileUpload>("fileUploads").deleteOne({uploadId:uploadId});
        
        return result.deletedCount === 1;
    }
}