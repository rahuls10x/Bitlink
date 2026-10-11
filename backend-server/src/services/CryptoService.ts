import crypto from "crypto";

export default class CryptoService {
    constructor() {}

    /**
     * Generate a random SessionId
     * 
     * Inorder Flow: 
     * - generate and return SessionId (64 chars + prefix)
     */
    static generateSessionId(){
        return "session_" + crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate a random LockId
     * 
     * Inorder Flow: 
     * - generate and return LockId (64 chars + prefix)
     */
    static generateLockId(){
        return "lock_" + crypto.randomBytes(32).toString('hex');
    }
}