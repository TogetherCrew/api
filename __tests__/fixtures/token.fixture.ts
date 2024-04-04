import moment from 'moment';
import config from '../../src/config';
import { tokenTypes } from '../../src/config/tokens';
import { tokenService } from '../../src/services';
import { userOne, userTwo, userThree } from './user.fixture';

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
export const userOneAccessToken = tokenService.generateToken(
  { ...userOne, id: userOne._id },
  accessTokenExpires,
  tokenTypes.ACCESS,
);
export const userTwoAccessToken = tokenService.generateToken(
  { ...userTwo, id: userTwo._id },
  accessTokenExpires,
  tokenTypes.ACCESS,
);

export const userThreeAccessToken = tokenService.generateToken(
  { ...userThree, id: userThree._id },
  accessTokenExpires,
  tokenTypes.ACCESS,
);
