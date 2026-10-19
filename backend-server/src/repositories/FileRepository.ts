import type { Db } from "mongodb";
import type { File } from "../types/dbSchema.js";

export default class FileRepository{
    private db: Db;
    
    constructor(db:Db) {
        this.db = db;
    }

    /**
     * Creates a new file in db
     * 
     * Inorder Flow:
     * - Insert file into files collection
     * - Return true if success
     */
    async createNewFile(fileObject:File):Promise<boolean>{
        const result = await this.db.collection<File>("files").insertOne(fileObject);
        
        return result.acknowledged;
    }

    /**
     * View files in db
     * 
     * Inorder Flow:
     * - Find files in files collection by userId and parentId with limit and offset
     * - Return files
     */
    async viewFiles(userId:string, parentId:null, limit:number, offset:number, ):Promise<File[]>{
        const result = await this.db.collection<File>("files").find({
            userId:userId,
            parentId:parentId
        }).limit(limit).skip(offset).toArray();
        
        return result;
    }

    /**
     * Fetch file data from db
     * 
     * Inorder Flow:
     * - Find file in files collection by fileId
     * - Return file
     */
    async fetchFileData(fileId:string):Promise<File | null>{
        const result = await this.db.collection<File>("files").findOne({fileId:fileId})
        
        return result;
    }

    /**
     * Rename file in db
     * 
     * Inorder Flow:
     * - Rename file in files collection by fileId
     * - Return true if success
     */
    async renameFile(fileId:string, newFileName:string, modifiedAt:Date):Promise<boolean>{
        const result = await this.db.collection<File>("files").updateOne({
            fileId:fileId
        },{
            $set: {
                fileName:newFileName,
                modifiedAt:modifiedAt
            }
        });
        
        return result.modifiedCount === 1;
    }

    /**
     * Delete file from db
     * 
     * Inorder Flow:
     * - Delete file from files collection by fileId
     * - Return true if success
     */
    async deleteFile(fileId:string):Promise<boolean>{
        const result = await this.db.collection<File>("files").deleteOne({fileId:fileId})
        
        return result.deletedCount === 1;
    }
}