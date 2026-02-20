import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import resend, { FROM_EMAIL } from '@/lib/email/resend-client';
import { passwordResetEmail } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // For security, always return success even if the email doesn't exist
        // to prevent email enumeration.
        if (!user) {
            return NextResponse.json({ success: true, message: 'If the email exists, a reset link was sent.' });
        }

        // Simulating token generation
        const resetToken = 'reset-token-' + Date.now();
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://kanban-board-legaltech-alpha.vercel.app'}/reset-password?token=${resetToken}`;

        const emailContent = passwordResetEmail({
            userName: user.name,
            resetLink,
        });

        await resend.emails.send({
            from: `Cengineers Kanban <${FROM_EMAIL}>`,
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
        });

        return NextResponse.json({ success: true, message: 'Reset email sent successfully' });

    } catch (error: any) {
        console.error('Password reset dispatch error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
