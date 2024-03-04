import { Types } from 'mongoose';
import { User } from '@togethercrew.dev/db';
import crypto from 'crypto';

interface UserFixture {
  _id: Types.ObjectId;
  discordId: string;
  email?: string;
  communities?: Types.ObjectId[];
}

export const userOne: UserFixture = {
  _id: new Types.ObjectId(),
  discordId: crypto.randomBytes(20).toString('hex'),
  email: 'example@outlook.com',
};

export const userTwo: UserFixture = {
  _id: new Types.ObjectId(),
  discordId: crypto.randomBytes(20).toString('hex'),
};

export const userThree: UserFixture = {
  _id: new Types.ObjectId(),
  discordId: crypto.randomBytes(20).toString('hex'),
};

export const insertUsers = async function <Type>(users: Array<Type>) {
  for (const user of users) {
    await User.create(user);
  }
};
