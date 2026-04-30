/**
 * Decode JWT payload without signature verification (Edge-safe).
 * Used only for routing hints; APIs must still verify with verifyToken().
 */
export function readJwtPayloadUnsafe(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3 || !parts[1]) return null
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
        const json = atob(padded)
        return JSON.parse(json) as Record<string, unknown>
    } catch {
        return null
    }
}

export function jwtExpIsValid(payload: Record<string, unknown> | null): boolean {
    if (!payload?.exp || typeof payload.exp !== 'number') return false
    return payload.exp * 1000 > Date.now()
}
