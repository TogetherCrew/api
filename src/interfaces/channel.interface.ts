import { IChannel } from '@togethercrew.dev/db';

export interface IChannelWithViewAndReadPermissions extends IChannel {
  canReadMessageHistoryAndViewChannel?: boolean;
}
