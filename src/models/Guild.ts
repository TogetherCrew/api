import { Schema, model } from 'mongoose';
import { toJSON } from './plugins';
import { IGuild, IGuildModel } from '../interfaces/Guild.interface';

const guildSchema = new Schema<IGuild>({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: String,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
    },
    selectedChannels: [
        {
            channelId: {
                type: String
            },
            channelName: {
                type: String
            },
        }
    ],
    period: {
        type: Date
    }
});

// Plugins
guildSchema.plugin(toJSON);

export default model<IGuildModel>('Guild', guildSchema);