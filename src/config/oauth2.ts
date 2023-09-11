import crypto from 'crypto';

export function generateState(): string {
    return crypto.randomBytes(16).toString('hex');
}

export function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return base64UrlEncode(hash);
}

export function base64UrlEncode(buffer: Buffer) {
    return buffer.toString('base64')
        .replace('+', '-')
        .replace('/', '_')
        .replace(/=+$/, '');
}

