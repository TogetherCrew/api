import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { heatmapOne, heatmapTwo } from '../fixtures/heatmap.fixture';
import { guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { heatmapService, databaseService } from 'tc-dbcomm';
import config from '../../src/config';


setupTestDB();

describe('Guild routes', () => {
    const connection = databaseService.connectionFactory(guildOne.guildId, config.mongoose.botURL);
    beforeEach(async () => {
        await connection.dropDatabase();
    });
    describe('POST /api/v1/heatmaps/:guildId/heatmap-chart', () => {

        test('should return 200 and array of 2D arrays if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24"), timeZone: "Asia/Tehran" })
                .expect(httpStatus.OK);

            expect(res.body.length).toBe(168);
            expect(res.body[3][2]).toBe(3)
            expect(res.body[26][2]).toBe(6)
            expect(res.body[27][2]).toBe(3)
            expect(res.body[50][2]).toBe(6)

        })



        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
                .send({ startDate: new Date(), endDate: new Date(), timeZone: "Asia/Tehran" })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date(), timeZone: "Asia/Tehran" })
                .expect(httpStatus.NOT_FOUND);
        })
    })

});