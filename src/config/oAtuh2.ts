import crypto from 'crypto';
import { Client, GatewayIntentBits } from 'discord.js';
import config from './index';

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


export const discord = {
    scopes: {
        authorize: "identify",
        connectGuild: "bot"
    },
    permissions: {
        ReadData: {
            ViewChannel: 0x400,
            ReadMessageHistory: 0x10000,
        },
        Announcement: {
            ViewChannel: 0x400,
            SendMessages: 0x800,
            SendMessagesInThreads: 0x4000000000,
            CreatePublicThreads: 0x800000000,
            CreatePrivateThreads: 0x1000000000,
            EmbedLinks: 0x4000,
            AttachFiles: 0x8000,
            MentionEveryone: 0x20000,
            Connect: 0x100000
        }
    },
    getDiscordClient: async function () {
        const client = new Client({
            intents: [GatewayIntentBits.Guilds],
        });
        await client.login(config.discord.botToken);
        return client;
    }

}

export const twitter = {
    scopes: {
        connectAccount: "tweet.read offline.access users.read"
    },
}



