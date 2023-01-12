import { IUser } from "tc-dbcomm";
import { Request } from "express";

export interface IAuthRequest extends Request {
    user: IUser
}