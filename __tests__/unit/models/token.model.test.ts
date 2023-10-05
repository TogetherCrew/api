import { Token, IToken } from '@togethercrew.dev/db';

import moment from 'moment';

describe('Token model', () => {
  describe('Token validation', () => {
    let token: IToken;
    beforeEach(() => {
      token = {
        user: '681946187490000906',
        token: '716384',
        type: 'access',
        expires: moment('2022-02-01 08:30:26.127Z').toDate(),
      };
    });

    test('should correctly validate a valid token', async () => {
      await expect(new Token(token).validate()).resolves.toBeUndefined();
    });

    test('should throw a validation error if type is invalid', async () => {
      token.type = 'invalidToken';
      await expect(new Token(token).validate()).rejects.toThrow();
    });
  });
});
