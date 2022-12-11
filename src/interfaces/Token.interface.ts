import { Snowflake } from 'discord.js';
import { Document } from 'mongoose';

export interface IToken {
    token: string,
    user: Snowflake,
    type: string,
    expires: Date,
    blacklisted?: boolean
}

export interface ITokenModel extends IToken, Document { }
