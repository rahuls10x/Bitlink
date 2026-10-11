import type { createClient } from "redis";
import releaseLockLua from "../utils/releaseLock.lua.js";

export default class TokenRepository{
    private cache: ReturnType<typeof createClient>

    constructor(cache:ReturnType<typeof createClient>){
        this.cache = cache;
    }

    /**
     * Create a lock during refresh token update in cache
     * 
     * Inorder Flow:
     * - set lock with expiry and return status
     */
    async setLockForRefreshTokenUpdate(lockKey:string, lockId:string, lockTTL:number): Promise<boolean> {
        const result = await this.cache.set(lockKey, lockId, {
            'EX': lockTTL,
            'NX' : true}
        );
        return result === 'OK';
    }

    /**
     * Retrieve a lock during refresh token update in cache
     * 
     * Inorder Flow:
     * - Retrieve lock with expiry and return lockId
     */
    async getLockForRefreshTokenUpdate(lockKey:string): Promise<string | null> {
        const result = await this.cache.get(lockKey);
        return result;
    }

    /**
     * Remove a lock during refresh token update in cache
     * 
     * Inorder Flow:
     * - remove lock and return status
     */
    async disableLockForRefreshTokenUpdate(lockKey:string, lockId:string ): Promise<boolean> {
        const result = await this.cache.eval(releaseLockLua, {
            keys: [lockKey],
            arguments: [lockId]
        });
        return result === 1 || result === '1';
    }

}