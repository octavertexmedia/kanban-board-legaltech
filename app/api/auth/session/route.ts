import { NextResponse } from 'next/server'
import { getSessionAppUser } from '@/lib/neon/sync-app-user'

export async function GET() {
    try {
        const { user } = await getSessionAppUser()
        return NextResponse.json({ user })
    } catch {
        return NextResponse.json({ user: null })
    }
}
