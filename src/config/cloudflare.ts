const getConfig = () => {
    // Server-side
    if (typeof window === 'undefined') {
        return {
            accountId: process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID,
            bucketName: process.env.CLOUDFLARE_BUCKET_NAME,
            accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
        };
    }
    
    // Client-side
    return {
        accountId: window.__NEXT_DATA__.props.pageProps?.env?.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID,
        bucketName: window.__NEXT_DATA__.props.pageProps?.env?.CLOUDFLARE_BUCKET_NAME,
        accessKeyId: window.__NEXT_DATA__.props.pageProps?.env?.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: window.__NEXT_DATA__.props.pageProps?.env?.CLOUDFLARE_SECRET_ACCESS_KEY,
    };
};

const config = getConfig();

if (!config.accountId) {
    throw new Error('Cloudflare Account ID is not configured');
}

if (!config.bucketName) {
    throw new Error('Cloudflare Bucket Name is not configured');
}

export const cloudflareConfig = {
    accountId: process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID,
    bucketName: process.env.CLOUDFLARE_BUCKET_NAME,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    endpoint: `https://${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
}; 