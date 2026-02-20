import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';

export async function POST(request: Request): Promise<NextResponse> {
    const auth = requireAuth(request as any);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'upload.file';

    if (!request.body) {
        return NextResponse.json({ error: 'No body provided' }, { status: 400 });
    }

    try {
        const blob = await put(filename, request.body, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Error uploading file to blob storage:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
