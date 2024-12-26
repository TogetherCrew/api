import { PlatformNames } from '@togethercrew.dev/db';

export const SUPPORTED_NEO4J_PLATFORMS = [PlatformNames.Discord, PlatformNames.Discourse] as const;
export const NEO4J_PLATFORM_INFO = {
  [PlatformNames.Discord]: {
    platform: 'DiscordPlatform',
    member: 'DiscordMember',
  },
  [PlatformNames.Discourse]: {
    platform: 'DiscoursePlatform',
    member: 'DiscourseMember',
  },
  [PlatformNames.Telegram]: {
    platform: 'TelegramPlatform',
    member: 'TelegramMember',
  },
};
