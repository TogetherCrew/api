import { Types } from 'mongoose';
import { User } from '@togethercrew.dev/db';

interface UserFixture {
    _id: Types.ObjectId;
    discordId: string;
    email?: string;
    communities?: Types.ObjectId[];
}

export const userOne: UserFixture = {
    _id: new Types.ObjectId(),
    discordId: "681946187490000902",
    email: "example@outlook.com",
};

export const userTwo: UserFixture = {
    _id: new Types.ObjectId(),
    discordId: "681946187490000903",
};

export const userThree: UserFixture = {
    _id: new Types.ObjectId(),
    discordId: "681946187490000904",
};

export const insertUsers = async function <Type>(users: Array<Type>) {
    for (const user of users) {
        await User.create(user);
    }
};