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
  discordId: '123456789',
  email: 'example@outlook.com',
};

export const userTwo: UserFixture = {
  _id: new Types.ObjectId(),
  discordId: '987654321',
};

export const userThree: UserFixture = {
  _id: new Types.ObjectId(),
  discordId: '555555555',
};

export const insertUsers = async function <Type>(users: Array<Type>) {
  for (const user of users) {
    await User.create(user);
  }
};
