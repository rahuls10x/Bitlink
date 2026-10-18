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
     * Creates a file upload record in MongoDB
     * 
     * Inorder Flow:
     * - Insert file upload document into fileUploads collection
     * - Return acknowledgment status
     */
    async createFileUploadToken(data:FileUpload){
        const result = await this.db.collection<FileUpload>("fileUploads").insertOne(data);

        return result.acknowledged;
    }   

    /**
     * Caches a file upload token in Redis with TTL
     * 
     * Inorder Flow:
     * - Set stringified file upload data in Redis cache with EX option
     * - Return true if result is OK
     * 
     * @remarks
     * TTL is in seconds
     */
    async cacheFileUploadToken(fileUploadId:string,data:FileUpload, ttl:number){
        const result = await this.cache.set(fileUploadId, JSON.stringify(data), {'EX': ttl});

        return result === 'OK';
    }
}