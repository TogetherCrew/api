import { IUser } from "tc-dbcomm";
import { Request } from "express";

export interface IAuthRequest extends Request {
    user: IUser
}

export interface IHeatmapChartRequestBody extends Request {
    startDate: Date,
    endDate: Date,
    channelIds: Array<string>
}