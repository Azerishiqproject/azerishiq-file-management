import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
    },
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: 'No key provided' }, { status: 400 });
        }

        // Firebase Storage URL'den dosya yolunu çıkar
        const filePath = key.split('/o/')[1]?.split('?')[0];
        if (!filePath) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }

        // URL decode yap
        const decodedPath = decodeURIComponent(filePath);

        const command = new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: decodedPath
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        // CORS başlıklarını ekle
        return NextResponse.json(
            { url },
            {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Disposition': `attachment; filename="${decodedPath.split('/').pop()}"`,
                }
            }
        );
    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Failed to generate download URL' },
            { status: 500 }
        );
    }
} 