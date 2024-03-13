import { IPlatform, IUser } from '@togethercrew.dev/db';
import { HydratedDocument } from 'mongoose';
import { Request } from 'express';
import { Session, SessionData } from 'express-session';

export interface IAuthRequest extends Request {
  user: HydratedDocument<IUser>;
}

export interface IAuthAndPlatform extends IAuthRequest {
  platform: HydratedDocument<IPlatform>;
}

export interface ISessionRequest extends Request {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: Session & Partial<SessionData> & { [key: string]: any };
}

export interface IAuthAndSessionRequest extends Request {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: Session & Partial<SessionData> & { [key: string]: any };
  user: HydratedDocument<IUser>;
}

export interface IHeatmapChartRequestBody extends Request {
  startDate: Date;
  endDate: Date;
  channelIds: Array<string>;
}
