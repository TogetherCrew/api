import { IRole } from '@togethercrew.dev/db';
import { Connection } from 'mongoose';

export const discordRole1: IRole = {
  roleId: '652345789987654321',
  name: 'Admin',
  color: 0xff0000,
  deletedAt: null,
};

export const discordRole2: IRole = {
  roleId: '987654321123456789',
  name: 'Moderator',
  color: 0x00ff00,
  deletedAt: null,
};

export const discordRole3: IRole = {
  roleId: '123456789987654321',
  name: 'Member',
  color: 0x0000ff,
  deletedAt: null,
};

export const discordRole4: IRole = {
  roleId: '123456789987654399',
  name: 'Member',
  color: 0x0000ff,
  deletedAt: new Date(),
};

export const insertRoles = async function <Type>(roles: Array<Type>, connection: Connection) {
  for (const role of roles) {
    await connection.models.Role.create(role);
  }
};
