import { ICommunity, IPlatform } from '@togethercrew.dev/db';
import { HydratedDocument } from 'mongoose';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
    interface Request {
        platform?: HydratedDocument<IPlatform>;
        community?: HydratedDocument<ICommunity>;
        user?: HydratedDocument<IUser>;
        session?: Session & Partial<SessionData> & { [key: string]: any };
        startDate: Date;
        endDate: Date;
        channelIds: Array<string>;
        allowInput?: boolean
    }
}