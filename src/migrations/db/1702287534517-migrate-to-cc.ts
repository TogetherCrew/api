import 'dotenv/config';
import mongoose from "mongoose";
import config from '../../config';
import logger from '../../config/logger';
import { IUser, ICommunity, User, Community, Platform } from '@togethercrew.dev/db'
import { DatabaseManager } from '@togethercrew.dev/db';
import { IOldUser, IGuild, oldUserSchema, guildSchema } from '../utils/oldSchemas';
import { analyzerAction, analyzerWindow } from '../../config/analyzer.statics';


const connectToMongoDB = async () => {
    try {
        await mongoose.connect(config.mongoose.serverURL);

        logger.info({ url: config.mongoose.serverURL }, 'Connected to MongoDB!');
    } catch (error) {
        logger.fatal({ url: config.mongoose.serverURL, error }, 'Failed to connect to MongoDB!')
    }
};





export const up = async () => {
    // Connect to MongoDB
    await connectToMongoDB();
    // const connection = mongoose.connection.useDb("RnDAO", { useCache: true });
    const connection = DatabaseManager.getInstance().getTenantDb("RnDAO");
    connection.model<IOldUser>('User', oldUserSchema);
    connection.model<IGuild>('Guild', guildSchema);

    const oldUsers = await connection.models.User.find({});
    const newUsers: IUser[] = [];
    for (let i = 0; i < oldUsers.length; i++) {
        newUsers.push({
            discordId: oldUsers[i].discordId,
            communities: [],
            tcaAt: oldUsers[i].createdAt
        })
    }
    const usersDoc = await User.create(newUsers);



    const guilds = await connection.models.Guild.find({});
    const communities: ICommunity[] = [];
    for (let i = 0; i < guilds.length; i++) {
        communities.push({
            name: guilds[i].name,
            users: [],
            platforms: [],
            tcaAt: guilds[i].connectedAt,
        })
    }

    await Community.create(communities)

    for (let i = 0; i < guilds.length; i++) {
        const communityDoc = await Community.findOne({ tcaAt: guilds[i].connectedAt, name: guilds[i].name })
        if (communityDoc) {
            const platform = await Platform.create({
                name: 'discord',
                community: communityDoc._id,
                disconnectedAt: guilds[i].isDisconnected ? new Date : null,
                metadata: {
                    action: analyzerAction,
                    window: analyzerWindow,
                    id: guilds[i].guildId,
                    isInProgress: false,
                    period: guilds[i].period,
                    icon: guilds[i].icon === null ? "" : guilds[i].icon,
                    selectedChannels: guilds[i].selectedChannels.map((selectedChannel: any) => selectedChannel.channelId),
                    name: guilds[i].name
                },
                connectedAt: guilds[i].connectedAt
            })
            communityDoc.platforms?.push(platform._id);
            await communityDoc.save()

        }

    }


    for (let i = 0; i < usersDoc.length; i++) {
        const guild = guilds.find(guild => guild.user === usersDoc[i].discordId);
        if (guild) {
            const communityDoc = await Community.findOne({ tcaAt: guild.connectedAt, name: guild.name });
            if (communityDoc) {
                usersDoc[i].communities?.push(communityDoc?._id);
                await usersDoc[i].save();
                communityDoc.users.push(usersDoc[i]._id);
                await communityDoc.save()
            }
        }
    }


};

export const down = async () => {
    await connectToMongoDB();
    await User.deleteMany()
    await Community.deleteMany()
    await Platform.deleteMany()

};
