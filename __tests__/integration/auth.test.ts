import request from 'supertest';
import httpStatus from 'http-status';
import moment from 'moment';
import app from '../../src/app';
import config from '../../src/config';
import { tokenService } from '../../src/services';
import setupTestDB from '../utils/setupTestDB';
import { tokenTypes } from '../../src/config/tokens';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { authService, userService } from '../../src/services';
import { Token } from 'tc-dbcomm';

setupTestDB();

describe('Auth routes', () => {
    describe('GET /api/v1/auth/login', () => {
        test('should return 302 when redirect correctly', async () => {
            await request(app)
                .get('/api/v1/auth/login')
                .send()
                .expect(httpStatus.FOUND)
        })
    })

    describe('GET /api/v1/auth/callback', () => {
        authService.exchangeCode = jest.fn().mockReturnValue({
            access_token: 'mockAccess',
            expires_in: 604800,
            refresh_token: 'mockRefresh',
            scope: 'some scope',
            token_type: 'Bearer',
            guild: {
                id: '104941675760290000',
            }
        });
        userService.getUserFromDiscordAPI = jest.fn().mockReturnValue({
            id: '600941675760290000',
            username: 'Behzad',
            avatar: '947f3e19e6e36a2679c6fe854b79a699',
            email: 'gmail@yaoo.com',
            verified: true
        })
        test('should return 302 and successfully create user and guild', async () => {
            await request(app)
                .get('/api/v1/auth/callback')
                .query({ code: 'code' })
                .send()
                .expect(httpStatus.FOUND);
        })
        test('should return 302 if code does not provided', async () => {
            await request(app)
                .get('/api/v1/auth/callback')
                .send()
                .expect(httpStatus.FOUND);
        })
    })


    describe('POST /api/v1/auth/logout', () => {
        test('should return 204 if refresh token is valid', async () => {
            await insertUsers([userOne]);
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);
            await tokenService.saveToken(refreshToken, userOne.discordId, expires, tokenTypes.REFRESH);

            await request(app)
                .post('/api/v1/auth/logout')
                .send({ refreshToken })
                .expect(httpStatus.NO_CONTENT);

            const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
            expect(dbRefreshTokenDoc).toBe(null);
        });

        test('should return 404 error if refresh token is not found in the database', async () => {
            await insertUsers([userOne]);
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);

            await request(app)
                .post('/api/v1/auth/logout')
                .send({ refreshToken })
                .expect(httpStatus.NOT_FOUND);
        });

        test('should return 404 error if refresh token is blacklisted', async () => {
            await insertUsers([userOne]);
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);
            await tokenService.saveToken(refreshToken, userOne.discordId, expires, tokenTypes.REFRESH, true);

            await request(app)
                .post('/api/v1/auth/logout')
                .send({ refreshToken })
                .expect(httpStatus.NOT_FOUND);
        });

        test('should return 400 if refresh token does not send', async () => {
            await request(app)
                .post('/api/v1/auth/logout')
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

    });

    describe('POST /api/v1/auth/refresh-tokens', () => {
        test('should return 200 and new auth tokens if refresh token is valid', async () => {
            await insertUsers([userOne]);
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);
            await tokenService.saveToken(refreshToken, userOne.discordId, expires, tokenTypes.REFRESH);

            const res = await request(app)
                .post('/api/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                access: { token: expect.anything(), expires: expect.anything() },
                refresh: { token: expect.anything(), expires: expect.anything() },
            });

            const dbRefreshTokenDoc = await Token.findOne({ token: res.body.refresh.token });
            expect(dbRefreshTokenDoc).toMatchObject({ type: tokenTypes.REFRESH, user: userOne._id, blacklisted: false });

            const dbRefreshTokenCount = await Token.countDocuments();
            expect(dbRefreshTokenCount).toBe(1);
        });

        test('should return 401 error if refresh token is signed using an invalid secret', async () => {
            await insertUsers([userOne]);
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH, 'invalidSecret');
            await tokenService.saveToken(refreshToken, userOne.discordId, expires, tokenTypes.REFRESH);

            await request(app)
                .post('/api/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 error if refresh token is not found in the database', async () => {
            await insertUsers([userOne]);
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);

            await request(app)
                .post('/api/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 error if refresh token is blacklisted', async () => {
            await insertUsers([userOne]);
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);
            await tokenService.saveToken(refreshToken, userOne.discordId, expires, tokenTypes.REFRESH, true);

            await request(app)
                .post('/api/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 error if refresh token is expired', async () => {
            await insertUsers([userOne]);
            const expires = moment().subtract(1, 'minutes');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);
            await tokenService.saveToken(refreshToken, userOne.discordId, expires, tokenTypes.REFRESH);

            await request(app)
                .post('/api/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 error if user is not found', async () => {
            const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
            const refreshToken = tokenService.generateToken(userOne.discordId, expires, tokenTypes.REFRESH);
            await tokenService.saveToken(refreshToken, userOne.discordId, expires, tokenTypes.REFRESH);

            await request(app)
                .post('/api/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 400 if refresh token does not send', async () => {
            await request(app)
                .post('/api/v1/auth/refresh-tokens')
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

    });



});