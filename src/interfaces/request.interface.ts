import { IUser } from "@togethercrew.dev/db";
import { Request } from "express";
import { Session, SessionData } from 'express-session';

export interface IAuthRequest extends Request {
    user: IUser
}
export interface ISessionRequest extends Request {
    session: Session & Partial<SessionData> & { [key: string]: any };
}

export interface IAuthAndSessionRequest extends Request {
    session: Session & Partial<SessionData> & { [key: string]: any };
    user: IUser
}

export interface IHeatmapChartRequestBody extends Request {
    startDate: Date,
    endDate: Date,
    channelIds: Array<string>
}