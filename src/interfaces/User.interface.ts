import { Snowflake } from 'discord.js';
import { Document } from 'mongodb';

export interface IUser {
    discordId: Snowflake,
    username?: string,
    discriminator?: string,
    avatar?: string,
    bot?: boolean,
    system?: boolean,
    mfa_enabled?: boolean,
    banner?: string,
    accent_color?: number
    locale?: string,
    verified?: boolean
    email?: string,
    flags?: number,
    premium_type?: number,
    public_flags?: number,
}

export interface IUserModel extends IUser, Document { }
