import { IRole } from '@togethercrew.dev/db';
import { Connection } from 'mongoose';

export const role1: IRole = {
    roleId: '652345789987654321',
    name: 'Admin',
    color: 0xFF0000,
    deletedAt: null
};

export const role2: IRole = {
    roleId: '987654321123456789',
    name: 'Moderator',
    color: 0x00FF00,
    deletedAt: null
};

export const role3: IRole = {
    roleId: '123456789987654321',
    name: 'Member',
    color: 0x0000FF,
    deletedAt: null
};

export const role4: IRole = {
    roleId: '123456789987654399',
    name: 'Member',
    color: 0x0000FF,
    deletedAt: new Date()
};
export const insertRoles = async function <Type>(roles: Array<Type>, connection: Connection) {
    await connection.models.Role.insertMany(roles.map((role) => (role)));
};