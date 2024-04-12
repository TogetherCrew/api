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
