import { Schema, model } from 'mongoose';
import { toJSON } from './plugins';
import { tokenTypes } from '../config/tokens';
import { IToken, ITokenModel } from '../interfaces/Token.interface';

const tokenSchema = new Schema<IToken>(
    {
        token: {
            type: String,
            required: true,
            index: true,
        },
        user: {
            type: String,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(tokenTypes),
            required: true,
        },
        expires: {
            type: Date,
            required: true,
        },
        blacklisted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true });

// Plugins
tokenSchema.plugin(toJSON);

export default model<ITokenModel>('Token', tokenSchema);