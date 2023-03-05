import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { heatmapOne, heatmapTwo, heatmapThree, heatmapFour } from '../fixtures/heatmap.fixture';
import { guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { heatmapService, databaseService } from 'tc-dbcomm';
import config from '../../src/config';


setupTestDB();

describe('Guild routes', () => {
    const connection = databaseService.connectionFactory(guildOne.guildId, config.mongoose.botURL);
    describe('POST /api/v1/heatmaps/:guildId/heatmap-chart', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and heatmap chart data if req data is ok', async () => {
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

    describe('POST /api/v1/heatmaps/:guildId/line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and line graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body.messages).toBe(18);
            expect(res.body.emojis).toBe(9);
            expect(res.body.msgPercentageChange).toBe(0);
            expect(res.body.emojiPercentageChange).toBe(0);

        })

        test('should return 200 and line graph data (testing percentage change) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo, heatmapThree, heatmapFour]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body.messages).toBe(18);
            expect(res.body.emojis).toBe(9);
            expect(res.body.msgPercentageChange).toBe(100);
            expect(res.body.emojiPercentageChange).toBe(-50);

        })

        test('should return 200 and line graph data (testing no for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapOne]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-02-21"), endDate: new Date("2023-02-24") })
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                categories: [],
                series: [],
                emojis: 0,
                messages: 0,
                msgPercentageChange: 0,
                emojiPercentageChange: 0
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.NOT_FOUND);
        })
    })

});