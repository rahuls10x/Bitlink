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
}