import { Guild } from "@togethercrew.dev/db";
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
    isInProgress: true,
    icon: 'IconOne'
}

export const guildTwo = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000803",
    user: userOne.discordId,
    name: 'guildTwo',
    isDisconnected: true,
    isInProgress: false,
    icon: 'IconTwo'

}

export const guildThree = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000802",
    user: userTwo.discordId,
    name: 'guildThree',
    isDisconnected: true,
    isInProgress: false,
    icon: 'IconThree'

}

export const guildFour = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000801",
    user: userTwo.discordId,
    name: 'guildFour',
    isDisconnected: false,
    isInProgress: true,
    icon: 'IconFour'
}

export const guildFive = {
    _id: new Types.ObjectId(),
    guildId: "681946187490000999",
    user: userOne.discordId,
    name: 'guildFive',
    isDisconnected: false,
    isInProgress: true,
    icon: 'IconFive',
    selectedChannels: [
        {
            channelId: '987654321098765432',
            channelName: 'Channel 1'
        },
        {
            channelId: '234567890123456789',
            channelName: 'Channel 2'
        },
        {
            channelId: '345678901234567000',
            channelName: 'Channel 4'
        },
    ]
}


export const insertGuilds = async function <Type>(guilds: Array<Type>) {
    await Guild.insertMany(guilds.map((guild) => (guild)));
};


