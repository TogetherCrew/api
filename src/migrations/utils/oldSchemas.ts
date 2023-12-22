import 'dotenv/config';
import { Model, Schema } from "mongoose";
import validator from 'validator';
import { type Snowflake } from 'discord.js';

export interface IOldUser {
    discordId: Snowflake;
    username?: string;
    discriminator?: string;
    avatar?: string;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string;
    accent_color?: number;
    locale?: string;
    verified?: boolean;
    email?: string;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
    twitterId?: string | null;
    twitterUsername?: string | null;
    twitterProfileImageUrl?: string | null;
    twitterConnectedAt?: Date | null;
    twitterIsInProgress?: boolean | null;
}


export interface OldUserModel extends Model<IOldUser> {
    paginate: (filter: object, options: object) => any;
}

export const oldUserSchema = new Schema<IOldUser, OldUserModel>(
    {
        discordId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate(value: string) {
                if (!validator.isEmail(value)) throw new Error('Email Address is not valid');
            },
            unique: true,
        },
        verified: {
            type: Boolean,
        },
        avatar: {
            type: String,
        },
        twitterId: {
            type: String,
        },

        twitterUsername: {
            type: String,
        },

        twitterProfileImageUrl: {
            type: String,
        },
        twitterConnectedAt: {
            type: Date,
        },
        twitterIsInProgress: {
            type: Boolean,
        },
    },
    { timestamps: true },
);



export interface IGuild {
    guildId: Snowflake;
    user: Snowflake;
    name: string;
    selectedChannels?: Array<{
        channelId: Snowflake;
        channelName?: string;
    }>;
    period?: Date;
    connectedAt: Date;
    isDisconnected: boolean;
    isInProgress: boolean;
    icon: string | null;
    window?: number[];
    action?: number[];
}

export interface GuildModel extends Model<IGuild> {
    paginate: (filter: object, options: object) => any;
}


export const guildSchema = new Schema<IGuild, GuildModel>({
    guildId: {
        type: String,
        required: true,
        unique: true,
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
                type: String,
            },
            channelName: {
                type: String,
            },
        },
    ],
    period: {
        type: Date,
    },
    connectedAt: {
        type: Date,
        default: new Date(),
    },
    isInProgress: {
        type: Boolean,
        default: true,
    },
    isDisconnected: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: String,
    },
    window: {
        type: Array<number>,
        default: [7, 1],
        validate: {
            validator: function (arr: number[]) {
                return arr.length === 2;
            },
            message: 'Window must be an array with exactly 2 numbers',
        },
    },
    action: {
        type: Array<number>,
        default: [1, 1, 1, 4, 3, 5, 5, 4, 3, 2, 2, 2, 1],
        validate: {
            validator: function (arr: number[]) {
                return arr.length === 13;
            },
            message: 'Action must be an array with exactly 11 numbers',
        },
    },
});

