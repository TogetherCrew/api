import { Types } from 'mongoose';
import { Module } from '@togethercrew.dev/db';

interface ModuleFixture {
  _id: Types.ObjectId;
  name: 'hivemind';
  community?: Types.ObjectId;
  options?: {
    platforms: Array<{
      platform: Types.ObjectId;
      metadata?: Record<string, any>;
      name: 'discord';
    }>;
  };
}

export const moduleOne: ModuleFixture = {
  _id: new Types.ObjectId(),
  name: 'hivemind',
};

export const moduleTwo: ModuleFixture = {
  _id: new Types.ObjectId(),
  name: 'hivemind',
  options: {
    platforms: [
      {
        platform: new Types.ObjectId(),
        metadata: {
          answering: {
            selectedChannels: ['1234'],
          },
          learning: {
            selectedChannels: ['8765', '1234'],
            fromDate: new Date('2024-03-18T07:46:51.493+00:00'),
          },
        },
        name: 'discord',
      },
    ],
  },
};

export const moduleThree: ModuleFixture = {
  _id: new Types.ObjectId(),
  name: 'hivemind',
};

export const insertModules = async function <Type>(modules: Array<Type>) {
  for (const module of modules) {
    await Module.create(module);
  }
};
