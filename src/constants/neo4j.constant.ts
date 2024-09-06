import { PlatformNames } from '@togethercrew.dev/db';

export const SUPPORTED_NEO4J_PLATFORMS = [PlatformNames.Discord, PlatformNames.Discourse] as const;
export const NEO4J_PLATFORM_INFO = {
  [PlatformNames.Discord]: {
    platform: 'discordPlatform',
    member: 'discordMember',
  },
  [PlatformNames.Discourse]: {
    platform: 'discoursePlatform',
    member: 'discourseMember',
  },
};
