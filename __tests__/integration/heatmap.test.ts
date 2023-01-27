import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { heatmapOne, heatmapTwo, heatmapThree, heatmapFour, heatmapFive, heatmapSix, APIresponse } from '../fixtures/heatmap.fixture';
import { guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { heatmapService, databaseService } from 'tc-dbcomm';
import config from '../../src/config';

setupTestDB();

describe('Guild routes', () => {
    describe('POST /api/v1/heatmaps/:guildId', () => {

        test('should return 200 and array of 3D arrays if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const connection = databaseService.connectionFactory(guildOne.guildId, config.mongoose.botURL);
            heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo, heatmapThree, heatmapFour, heatmapFive, heatmapSix]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21T13:02:10.911+00:00"), endDate: new Date("2023-01-29T13:02:10.911+00:00"), timeZone: "America/Fortaleza" })
                .expect(httpStatus.OK);

            expect(res.body).toStrictEqual(APIresponse);
        })



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