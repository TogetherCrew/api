import { Schema, model } from 'mongoose';
import validator from 'validator';
import { toJSON } from './plugins';
import { IUser, IUserModel } from '../interfaces/User.interface';

const userSchema = new Schema<IUser>({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate(value: string) {
            if (!validator.isEmail(value))
                throw new Error('Email Address is not valid');
        },
        unique: true
    },
    verified: {
        type: Boolean,
    },
    avatar: {
        type: String
    }
}, { timestamps: true });

// Plugins
userSchema.plugin(toJSON);

export default model<IUserModel>('User', userSchema);