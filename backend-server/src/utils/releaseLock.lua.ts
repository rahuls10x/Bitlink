/**
 * Used to release a lock safely and synchronously
 */
const releaseLockLua = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
`

export default releaseLockLua;