import { Connection } from 'mongoose';

export const discordGuildMember1 = {
    discordId: "123456789",
    username: "behzad_rabiei",
    avatar: null,
    roles: ["987654321123456789", "123456789987654321"],
    joinedAt: new Date("2023-03-07"),
    isBot: false,
    discriminator: "0",
    nickname: null,
    globalName: "Behzad"
};

export const discordGuildMember2 = {
    discordId: "987654321",
    username: "mrjackalop",
    avatar: "AvatarLink",
    roles: ["652345789987654321", "123456789987654321"],
    joinedAt: new Date("2023-03-31"),
    isBot: false,
    discriminator: "0",
    nickname: "Daniel",
    globalName: "Danielo"
};

export const discordGuildMember3 = {
    discordId: "555555555",
    username: "amin_torabi",
    avatar: "AvatarLink",
    roles: ["987654321123456789"],
    joinedAt: new Date("2022-06-01"),
    isBot: false,
    discriminator: "0",
    nickname: null,
    globalName: null
};

export const discordGuildMember4 = {
    discordId: "444444444",
    username: "zc_behzad",
    avatar: "AvatarLink",
    roles: ["652345789987654321"],
    joinedAt: new Date("2023-04-01"),
    isBot: false,
    discriminator: "4321",
    nickname: null,
    globalName: null
};

export const discordGuildMember5 = {
    discordId: "444444444",
    username: "User4",
    avatar: "AvatarLink",
    roles: ["652345789987654321"],
    joinedAt: new Date("2023-04-08"),
    isBot: false,
    discriminator: "4321",
    nickname: null,
    globalName: null
};


export const insertGuildMembers = async function <Type>(guildMembers: Array<Type>, connection: Connection) {
    for (const guildMember of guildMembers) {
        await connection.models.GuildMember.create(guildMember);
    }
};