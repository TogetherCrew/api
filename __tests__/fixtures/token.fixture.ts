import moment from "moment";
import config from "../../src/config";
import { tokenTypes } from "../../src/config/tokens";
import { tokenService } from "../../src/services";
import { userOne, userTwo } from "./user.fixture";

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
export const userOneAccessToken = tokenService.generateToken(userOne.discordId, accessTokenExpires, tokenTypes.ACCESS);
export const userTwoAccessToken = tokenService.generateToken(userTwo.discordId, accessTokenExpires, tokenTypes.ACCESS);