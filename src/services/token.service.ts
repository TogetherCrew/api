import jwt from 'jsonwebtoken';
import { Types, HydratedDocument } from 'mongoose';
import moment from 'moment';
import httpStatus from 'http-status';
import config from '../config';
import { tokenTypes } from '../config/tokens';
import { ApiError } from '../utils';
import authService from './auth.service';
import { IToken, Token, IUser } from '@togethercrew.dev/db';
import { IDiscordOAuth2EchangeCode, IAuthTokens } from 'src/interfaces';

/**
 * Generate token
 * @param {HydratedDocument<IUser>} user
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
function generateToken(user: HydratedDocument<IUser>, expires: moment.Moment, type: string, secret = config.jwt.secret) {
    const payload = {
        sub: user,
        iat: moment().unix(),
        exp: expires.unix(),
        type
    }
    return jwt.sign(payload, secret);
}

/**
 * Save a token
 * @param {string} token
 * @param {Types.ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<IToken>}
 */
async function saveToken(token: string, userId: Types.ObjectId, expires: moment.Moment, type: string, blacklisted = false): Promise<IToken> {
    const tokenDoc: IToken = await Token.create({
        token,
        user: userId,
        expires: expires.toDate(),
        type,
        blacklisted
    });
    return tokenDoc;

}

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<IToken>}
 */
async function verifyToken(token: string, type: string) {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
    if (!tokenDoc) {
        throw new Error('Token not found');
    }
    return tokenDoc;
}

/**
 * Generate auth tokens
 * @param {IUser} user
 * @returns {Promise<IAuthTokens>}
 */
async function generateAuthTokens(user: HydratedDocument<IUser>): Promise<IAuthTokens> {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user, accessTokenExpires, tokenTypes.ACCESS);

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = generateToken(user, refreshTokenExpires, tokenTypes.REFRESH);
    await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate()
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate()
        }
    };
}

/**
 * save discord oauth2 tokens
 * @param {Types.ObjectId} userId
 * @param {IDiscordOAuth2EchangeCode} discordAuth
 * @returns {Promise<Object>}
 */
async function saveDiscordOAuth2Tokens(userId: Types.ObjectId, discordOAuth2Tokens: IDiscordOAuth2EchangeCode) {
    await Token.deleteMany({ user: userId, type: { $in: [tokenTypes.DISCORD_ACCESS, tokenTypes.DISCORD_REFRESH] } });
    const accessTokenExpires = moment().add(discordOAuth2Tokens.expires_in, 'seconds');
    const refreshTokenExpires = moment().add(config.jwt.discordRefreshExpirationDays, 'days');
    const DiscordAccessTokenDoc: IToken = await saveToken(discordOAuth2Tokens.access_token, userId, accessTokenExpires, tokenTypes.DISCORD_ACCESS);
    const DiscordRefreshTokenDoc: IToken = await saveToken(discordOAuth2Tokens.refresh_token, userId, refreshTokenExpires, tokenTypes.DISCORD_REFRESH);

    return {
        access: {
            token: DiscordAccessTokenDoc.token,
            expires: DiscordAccessTokenDoc.expires
        },
        refresh: {
            token: DiscordRefreshTokenDoc.token,
            expires: DiscordRefreshTokenDoc.expires
        }
    }
}

/**
 * get discord oauth2 tokens
 * will request new discord oauth2 tokens if access token is expired
 * @param {Types.ObjectId} userId
 * @param {IDiscordOAuth2EchangeCode} discordAuth
 * @returns {Promise<Object>}
 */
async function getDiscordOAuth2Tokens(userId: Types.ObjectId) {
    const DiscordAccessTokenDoc = await Token.findOne({ user: userId, type: tokenTypes.DISCORD_ACCESS });
    const DiscordRefreshTokenDoc = await Token.findOne({ user: userId, type: tokenTypes.DISCORD_REFRESH });

    if (!DiscordAccessTokenDoc || !DiscordRefreshTokenDoc) { throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'discord auth tokens missed'); }
    if (new Date() > DiscordAccessTokenDoc.expires) {
        const discordAuths = await authService.refreshDiscordAuth(DiscordRefreshTokenDoc.token);
        return saveDiscordOAuth2Tokens(userId, discordAuths);
    }

    return {
        access: {
            token: DiscordAccessTokenDoc.token,
            expires: DiscordAccessTokenDoc.expires
        },
        refresh: {
            token: DiscordRefreshTokenDoc.token,
            expires: DiscordRefreshTokenDoc.expires
        }
    };
}



export default {
    generateToken,
    verifyToken,
    saveToken,
    generateAuthTokens,
    getDiscordOAuth2Tokens,
    saveDiscordOAuth2Tokens
}