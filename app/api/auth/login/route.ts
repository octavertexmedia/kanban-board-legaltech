import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: true,
                userKind: true,
                status: true,
                avatar: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        const isValid = await verifyPassword(password, user.password)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Block inactive/disabled accounts
        if (user.status === 'INACTIVE') {
            return NextResponse.json(
                { error: 'Your account has been deactivated. Contact your administrator.' },
                { status: 403 }
            )
        }

        // Update last active
        await prisma.user.update({
            where: { id: user.id },
            data: { lastActive: new Date() },
        })

        const token = generateToken({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            userKind: user.userKind,
        })

        const response = NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                userKind: user.userKind,
                avatar: user.avatar,
                status: user.status,
            },
        })

        // Set HTTP-only cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        })

        return response
    } catch (error: any) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message, stack: error.stack },
            { status: 500 }
        )
    }
}
