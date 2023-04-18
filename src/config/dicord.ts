import { Client, GatewayIntentBits } from 'discord.js';
import config from './index';

async function getDiscordClient() {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    await client.login(config.discord.botToken);

    await client.on('ready', () => {
        console.log(`Logged in as BEHZAD!`);
    });

    return client;
}

const scopes = {
    tryNow: "bot identify email guilds",
    login: "identify",
    connectGuild: "bot",
};

const permissions = {
    ViewChannels: 0x400,
    manageServer: 0x20,
    readMessageHistory: 0x10000
}

export {
    scopes,
    permissions,
    getDiscordClient
}

