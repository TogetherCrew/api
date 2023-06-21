import { Connection } from 'mongoose';

export const guildMemberOne = {
    discordId: "123456789",
    username: "Behzad",
    avatar: null,
    roles: ["987654321123456789", "123456789987654321"],
    joinedAt: new Date("2023-03-07"),
    isBot: false,
    discriminator: "0"
};

export const guildMemberTwo = {
    discordId: "987654321",
    username: "Bi",
    avatar: "AvatarLink",
    roles: ["652345789987654321", "123456789987654321"],
    joinedAt: new Date("2023-03-31"),
    isBot: false,
    discriminator: "1234"
};

export const guildMemberThree = {
    discordId: "555555555",
    username: "Audi",
    avatar: "AvatarLink",
    roles: ["987654321123456789"],
    joinedAt: new Date("2022-06-01"),
    isBot: false,
    discriminator: "0"
};

export const guildMemberFour = {
    discordId: "444444444",
    username: "User4",
    avatar: "AvatarLink",
    roles: ["652345789987654321"],
    joinedAt: new Date("2023-04-01"),
    isBot: false,
    discriminator: "4321"
};

export const insertGuildMembers = async function <Type>(guildMembers: Array<Type>, connection: Connection) {
    await connection.models.GuildMember.insertMany(guildMembers.map((guildMember) => (guildMember)));

};