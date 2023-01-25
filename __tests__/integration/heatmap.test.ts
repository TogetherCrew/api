import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { guildOne } from '../fixtures/guilds.fixture';

setupTestDB();

describe('Guild routes', () => {
    describe('POST /api/v1/heatmaps/:guildId', () => {
        // test('should return 200 and array of 3D arrays if req data is ok', async () => {
        // TODO
        // })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}`)
                .send({ startDate: new Date(), endDate: new Date(), timeZone: "Asia/Tehran" })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date(), timeZone: "Asia/Tehran" })
                .expect(httpStatus.NOT_FOUND);
        })
    })

});