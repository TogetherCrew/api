/* eslint-disable @typescript-eslint/no-explicit-any */
import passportJwt from 'passport-jwt'
import config from './index';
import { tokenTypes } from './tokens';
import { User } from 'tc_dbcomm';

interface VerifiedCallback {
    (error: any, user?: any, info?: any): void;
}

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;


const jwtOptions = {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload: any, done: VerifiedCallback) => {
    try {
        if (payload.type !== tokenTypes.ACCESS) {
            throw new Error('Invalid token type');
        }
        const user = await User.findOne({ discordId: payload.sub });
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (error) {
        done(error, false);
    }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);