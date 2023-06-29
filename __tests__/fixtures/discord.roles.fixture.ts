import { IRole } from '@togethercrew.dev/db';
import { Connection } from 'mongoose';

export const discordRoleOne = {
    id: "652345789987654321",
    name: "Admin",
    color: 0xFF0000, // This color is represented in decimal (red).
    hoist: true, // Whether this role is displayed separately in the user listing.
    icon: null, // The role's icon image
    unicode_emoji: null, // The role's unicode emoji
    position: 1,
    permissions: "8", // Administrator permission
    managed: false,
    mentionable: true, // Whether the role is mentionable
    tags: null // Role tags
};

export const discordRoleTwo = {
    id: "987654321123456789",
    name: "Moderator",
    color: 0x00FF00, // This color is represented in decimal (green).
    hoist: true,
    icon: null,
    unicode_emoji: null,
    position: 2,
    permissions: "268435456", // View Audit Log permission
    managed: false,
    mentionable: true,
    tags: null
};

export const discordRoleThree = {
    id: "123456789987654321",
    name: "Member",
    color: 0x0000FF, // This color is represented in decimal (blue).
    hoist: false,
    icon: null,
    unicode_emoji: null,
    position: 3,
    permissions: "1048576", // Read Message History permission
    managed: false,
    mentionable: false,
    tags: null
};

export const role1: IRole = {
    roleId: '234567890123456777',
    name: 'Role 1',
    color: 123456
};

export const role2: IRole = {
    roleId: '234567890123456787',
    name: 'Role 2',
    color: 654321
};

export const role3: IRole = {
    roleId: '234567890123456797',
    name: 'Role 3',
    color: 654321
};

export const insertRoles = async function <Type>(roles: Array<Type>, connection: Connection) {
    await connection.models.Role.insertMany(roles.map((role) => (role)));
};