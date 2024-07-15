import request from 'supertest';
import httpStatus from 'http-status';
import moment from 'moment';
import app from '../../src/app';
import config from '../../src/config';
import { tokenService } from '../../src/services';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { Token, TokenTypeNames } from '@togethercrew.dev/db';

setupTestDB();

describe('Auth routes', () => {
  describe('POST /api/v1/auth/logout', () => {
    test('should return 204 if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken({ ...userOne, id: userOne._id }, expires, TokenTypeNames.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, TokenTypeNames.REFRESH);

      await request(app).post('/api/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne, expires, TokenTypeNames.REFRESH);

      await request(app).post('/api/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne, expires, TokenTypeNames.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, TokenTypeNames.REFRESH, true);

      await request(app).post('/api/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 if refresh token does not send', async () => {
      await request(app).post('/api/v1/auth/logout').send().expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/auth/refresh-tokens', () => {
    test('should return 200 and new auth tokens if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken({ ...userOne, id: userOne._id }, expires, TokenTypeNames.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, TokenTypeNames.REFRESH);

      const res = await request(app).post('/api/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.OK);

      expect(res.body).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbRefreshTokenDoc = await Token.findOne({ token: res.body.refresh.token });
      expect(dbRefreshTokenDoc).toMatchObject({ type: TokenTypeNames.REFRESH, user: userOne._id, blacklisted: false });

      const dbRefreshTokenCount = await Token.countDocuments();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test('should return 401 error if refresh token is signed using an invalid secret', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(
        { ...userOne, id: userOne._id },
        expires,
        TokenTypeNames.REFRESH,
        'invalidSecret',
      );
      await tokenService.saveToken(refreshToken, userOne._id, expires, TokenTypeNames.REFRESH);

      await request(app).post('/api/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken({ ...userOne, id: userOne._id }, expires, TokenTypeNames.REFRESH);

      await request(app).post('/api/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken({ ...userOne, id: userOne._id }, expires, TokenTypeNames.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, TokenTypeNames.REFRESH, true);

      await request(app).post('/api/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = tokenService.generateToken({ ...userOne, id: userOne._id }, expires, TokenTypeNames.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, TokenTypeNames.REFRESH);

      await request(app).post('/api/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if user is not found', async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken({ ...userOne, id: userOne._id }, expires, TokenTypeNames.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, TokenTypeNames.REFRESH);

      await request(app).post('/api/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if refresh token does not send', async () => {
      await request(app).post('/api/v1/auth/refresh-tokens').send().expect(httpStatus.BAD_REQUEST);
    });
  });
});

describe('TEST', () => {
  describe('TEST', () => {
    test('TEST', async () => {
      expect(true).toEqual(true);
    });
  });
});
