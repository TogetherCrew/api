import { Types } from 'mongoose';
import { Community } from '@togethercrew.dev/db';

interface CommunityFixture {
  _id: Types.ObjectId;
  name: string;
  avatarURL?: string;
  users?: Types.ObjectId[];
  platforms?: Types.ObjectId[];
}

export const communityOne: CommunityFixture = {
  _id: new Types.ObjectId(),
  name: 'Community Alpha',
  avatarURL: 'path/to/avatar1.png',
};

export const communityTwo: CommunityFixture = {
  _id: new Types.ObjectId(),
  name: 'Community Beta',
};

export const communityThree: CommunityFixture = {
  _id: new Types.ObjectId(),
  name: 'Community Teta',
};

export const insertCommunities = async function <Type>(communities: Array<Type>) {
  for (const community of communities) {
    await Community.create(community);
  }
};
