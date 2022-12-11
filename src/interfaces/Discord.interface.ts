/* eslint-disable @typescript-eslint/no-explicit-any */
import { Snowflake } from 'discord.js';

export interface IDiscordUser {
    id: Snowflake,
    username: string,
    discriminator: string,
    avatar: string | null
    bot?: boolean,
    system?: boolean,
    mfa_enabled?: boolean,
    banner?: string | null
    accent_color?: number | null
    locale?: string,
    verified?: boolean
    email?: string | null,
    flags?: number,
    premium_type?: number,
    public_flags?: number
}

export interface IDiscordGuild {
    id: Snowflake,
    name: string,
    icon: string | null,
    icon_hash?: string | null,
    splash: string | null,
    discovery_splash: string | null,
    owner?: boolean,
    owner_id: Snowflake,
    permissions?: string,
    region?: string | null,
    afk_channel_id: Snowflake | null,
    afk_timeout: number,
    widget_enabled?: boolean,
    widget_channel_id?: Snowflake | null,
    verification_level: number,
    default_message_notifications: number,
    explicit_content_filter: number
    roles: Array<any>,
    emojis: Array<any>,
    features: Array<any>,
    application_id: Snowflake | null,
    system_channel_id: Snowflake | null,
    system_channel_flags: number,
    rules_channel_id: Snowflake | null,
    max_presences?: number | null,
    max_members?: number,
    vanity_url_code: string | null,
    description: string | null,
    banner: string | null,
    premium_tier: number,
    premium_subscription_count?: number,
    preferred_locale: string,
    public_updates_channel_id: Snowflake | null,
    max_video_channel_users?: number,
    approximate_member_count?: number,
    approximate_presence_count?: number,
    welcome_screen?: Record<string, unknown>,
    nsfw_level: number,
    stickers?: Array<any>,
    premium_progress_bar_enabled: boolean,
}

export interface IDiscordOathBotCallback {
    access_token: string,
    token_type: string,
    expires_in: number,
    refresh_token: string,
    scope: string,
    guild: IDiscordGuild
}
