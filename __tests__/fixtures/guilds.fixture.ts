import { Guild } from "tc-dbcomm";
import { userOne, userTwo } from "./user.fixture";
import { Types } from "mongoose"

export const discordResponseGuildOne = {
    id: "681946187490000901",
    name: "guildOne",
    icon: "947f3e19e6e36a2679c6fe854b79a601",
    owner: false,
    permissions: 2147483647,
    features: [
        "APPLICATION_COMMAND_PREMISSION_V2"
    ],
    Permission_new: "4398046511103"
};

export const discordResponseGuildTwo = {
    id: "681946187490000902",
    name: "guildTwo",
    icon: "947f3e19e6e36a2679c6fe854b79a602",
    owner: false,
    permissions: 104189505,
    features: [
        "APPLICATION_COMMAND_PREMISSION_V2"
    ],
    Permission_new: "1071698529857"
};

export const discordResponseGuildThree = {
    id: "681946187490000902",
    name: "guildTwo",
    icon: "947f3e19e6e36a2679c6fe854b79a602",
    owner: false,
    permissions: 1342178320,
    features: [
        "APPLICATION_COMMAND_PREMISSION_V2"
    ],
    Permission_new: "1071698529857"
};

export const guildOne = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000901",
    user: userOne.discordId,
    name: 'guildOne',
    isDisconnected: false,
    isInProgress: true
}

export const guildTwo = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000803",
    user: userOne.discordId,
    name: 'guildTwo',
    isDisconnected: true,
    isInProgress: false
}

export const guildThree = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000802",
    user: userTwo.discordId,
    name: 'guildThree',
    isDisconnected: true,
    isInProgress: false
}

export const guildFour = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000801",
    user: userTwo.discordId,
    name: 'guildFour',
    isDisconnected: false,
    isInProgress: true
}

export const insertGuilds = async function <Type>(guilds: Array<Type>) {
    await Guild.insertMany(guilds.map((guild) => (guild)));
};