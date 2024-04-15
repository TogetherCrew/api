import { Snowflake } from 'discord.js';

export interface IGuildUpdateBody {
  selectedChannels?: [
    {
      channelId: Snowflake;
      channelName?: string;
    },
  ];
  period?: Date;
  isDisconnected?: boolean;
}

export interface IPermissionOverwrite {
  id: string;
  type: 'role' | 'member';
  allow: string;
  deny: string;
  allow_new: string;
  deny_new: string;
}

export interface ICustomChannel {
  channelId: string;
  name: string;
  parentId: string;
  canReadMessageHistoryAndViewChannel?: boolean;
}
