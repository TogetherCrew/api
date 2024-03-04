import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { User, IUserUpdateBody } from '@togethercrew.dev/db';

import { userOneAccessToken } from '../fixtures/token.fixture';
setupTestDB();

describe('User routes', () => {
  describe('GET /api/v1/users/@me', () => {
    test('should return 200 and the user object if data is ok', async () => {
      await insertUsers([userOne]);
      const res = await request(app)
        .get('/api/v1/users/@me')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: userOne._id.toHexString(),
        discordId: userOne.discordId,
        email: userOne.email,
        communities: [],
      });
    });
    test('should return 401 if access token is missing', async () => {
      await insertUsers([userOne]);
      await request(app).get('/api/v1/users/@me').expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH /api/v1/users/@me', () => {
    let updateBody: IUserUpdateBody;
    const currentDate = new Date();

    beforeEach(() => {
      updateBody = {
        email: 'email@yahoo.com',
        tcaAt: currentDate,
      };
    });
    test('should return 200 and successfully update user if data is ok', async () => {
      await insertUsers([userOne]);
      const res = await request(app)
        .patch('/api/v1/users/@me')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: userOne._id.toHexString(),
        discordId: userOne.discordId,
        email: updateBody.email,
        communities: [],
        tcaAt: currentDate.toISOString(),
      });

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).toBeDefined();
      expect(dbUser).toMatchObject({ email: updateBody.email, tcaAt: updateBody.tcaAt });
    });
    test('should return 401 if access token is missing', async () => {
      await insertUsers([userOne]);
      await request(app).patch('/api/v1/users/@me').send(updateBody).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if email is invalid', async () => {
      await insertUsers([userOne]);
      const updateBody = { email: 'invalidEmail' };

      await request(app)
        .patch('/api/v1/users/@me')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if tcaAt is invalid', async () => {
      const updateBody = { tcaAt: 'tcaAt' };

      await insertUsers([userOne]);
      await request(app)
        .patch('/api/v1/users/@me')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
