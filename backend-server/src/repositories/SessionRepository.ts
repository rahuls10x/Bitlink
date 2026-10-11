import { type Db } from "mongodb";
import type { Session } from "../types/dbSchema.js";

export default class SessionRepository{
    private db:Db;

    constructor(db:Db) {
        this.db = db;
    }

    /**
     * Creates a new session
     * 
     * Inorder Flow:
     * - Creates a new session from session object and returns status
     */
    async createSession(sessionObject:Session): Promise<boolean> {
        const result = await this.db.collection<Session>("sessions").insertOne(sessionObject);
        return result.acknowledged;
    }

    /**
     * Find an active session
     * 
     * Inorder Flow:
     * - Retrieves and returns the session
     * 
     * @remarks
     * checks if session is not revoked
     */
    async findActiveSessionById(sessionId: string): Promise<Session | null> {
        const result = await this.db.collection<Session>("sessions").findOne({ 
            sessionId,
            isRevoked: false,
        });
        return result;
    }

    /**
     * Revoke a session by sessionId 
     * 
     * Inorder Flow:
     * - Revokes the session
     * 
     * @remarks
     * does not check if session is already revoked (negligible security risk)
     */
    async revokeSessionById(sessionId: string):Promise <boolean>{
        const result = await this.db.collection<Session>("sessions").updateOne({ 
            sessionId,
        }, {
            $set: {
                isRevoked: true,
            }
        });
        return result.modifiedCount === 1;
    }

    /**
     * Update a session with updateObject by sessionId 
     * 
     * Inorder Flow:
     * - Updates the session
     * 
     * @remarks
     * does not check if session is already revoked (negligible security risk)
     * It allows for the following objects to be updated:
     * - accessToken
     * - refreshToken
     * - tokenType
     * - accessTokenExpiry
     * - refreshTokenExpiry
     */
    async updateSessionById(sessionId: string, updateObject:{accessToken?:string, refreshToken?:string, tokenType?:string, accessTokenExpiry?:Date, refreshTokenExpiry?:Date}):Promise <boolean>{
        const result = await this.db.collection<Session>("sessions").updateOne({ 
            sessionId,
        }, {
            $set: updateObject
        });
        return result.modifiedCount === 1;
    }
}